import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image
} from 'react-native';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { collection, getDocs, doc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { firestore } from '../../../firebase'; // Using your existing Firebase config

//@ts-ignore
export default function UserManagementScreen({ navigation }) {
  interface User {
    id: string;
    name?: string;
    email?: string;
    role?: string;
    photoURL?: string;
  }

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // 'asc' or 'desc'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'email', 'createdAt'

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = users.filter(
        user => 
          user.name?.toLowerCase().includes(lowercasedQuery) || 
          user.email?.toLowerCase().includes(lowercasedQuery)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Create a query with sorting
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, orderBy(sortBy, sortOrder));
      
      const querySnapshot = await getDocs(q);
      const usersList: User[] = [];
      
      querySnapshot.forEach((doc) => {
        usersList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setUsers(usersList);
      setFilteredUsers(usersList);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      Alert.alert("Error", "No se pudieron cargar los usuarios");
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

interface DeleteUserAlertOptions {
    text: string;
    style: "cancel" | "destructive";
    onPress?: () => Promise<void> | void;
}

const handleDeleteUser = (userId: string): void => {
    const alertOptions: DeleteUserAlertOptions[] = [
        {
            text: "Cancelar",
            style: "cancel"
        },
        { 
            text: "Eliminar", 
            style: "destructive",
            onPress: async () => {
                try {
                    await deleteDoc(doc(firestore, "users", userId));
                    // Remove user from state
                    const updatedUsers = users.filter(user => user.id !== userId);
                    setUsers(updatedUsers);
                    setFilteredUsers(updatedUsers);
                    Alert.alert("Éxito", "Usuario eliminado correctamente");
                } catch (error) {
                    console.error("Error deleting user:", error);
                    Alert.alert("Error", "No se pudo eliminar el usuario");
                }
            }
        }
    ];

    Alert.alert(
        "Confirmar eliminación",
        "¿Estás seguro que deseas eliminar este usuario? Esta acción no se puede deshacer.",
        alertOptions
    );
};

  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    // Re-fetch with new sort order
    fetchUsers();
  };

const changeSortBy = (field: 'name' | 'email' | 'createdAt'): void => {
    setSortBy(field);
    // Re-fetch with new sort field
    fetchUsers();
};

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {item.photoURL ? (
            <Image source={{ uri: item.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>{item.name ? item.name.charAt(0).toUpperCase() : '?'}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.name || 'Sin nombre'}</Text>
          <Text style={styles.userEmail}>{item.email || 'Sin email'}</Text>
          {item.role && <Text style={styles.userRole}>{item.role}</Text>}
        </View>
      </View>
      
      <View style={styles.userActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => navigation.navigate('EditUser', { userId: item.id })}
        >
          <Feather name="edit-2" size={16} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteUser(item.id)}
        >
          <Feather name="trash-2" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color="#555" />
      <Text style={styles.emptyText}>No hay usuarios para mostrar</Text>
      {searchQuery.length > 0 && (
        <Text style={styles.emptySubText}>Intenta con otra búsqueda</Text>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>

      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar usuarios..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
        </View>
      
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Ordenar por:</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
            onPress={() => changeSortBy('name')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>Nombre</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'email' && styles.sortButtonActive]}
            onPress={() => changeSortBy('email')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'email' && styles.sortButtonTextActive]}>Email</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'createdAt' && styles.sortButtonActive]}
            onPress={() => changeSortBy('createdAt')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'createdAt' && styles.sortButtonTextActive]}>Fecha</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={toggleSortOrder} style={styles.sortOrderButton}>
            <MaterialIcons 
              name={sortOrder === 'asc' ? 'arrow-upward' : 'arrow-downward'} 
              size={20} 
              color="#b388ff" 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Mostrando {filteredUsers.length} de {users.length} usuarios
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#b388ff" />
          <Text style={styles.loadingText}>Cargando usuarios...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#b388ff"
              colors={["#b388ff"]}
            />
          }
        />
      )}
      

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    padding: 8,
    marginTop: -12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 80,
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    width: '100%',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#fff',
    fontSize: 16,
  },
  sortContainer: {
    marginBottom: 12,
  },
  sortLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#222',
  },
  sortButtonActive: {
    backgroundColor: '#b388ff33',
  },
  sortButtonText: {
    color: '#999',
    fontSize: 14,
  },
  sortButtonTextActive: {
    color: '#b388ff',
  },
  sortOrderButton: {
    padding: 6,
  },
  statsContainer: {
    marginTop: 8,
  },
  statsText: {
    color: '#999',
    fontSize: 14,
  },
  userCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    backgroundColor: '#b388ff33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#b388ff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: '#999',
    fontSize: 14,
    marginBottom: 4,
  },
  userRole: {
    color: '#b388ff',
    fontSize: 12,
    fontWeight: '500',
  },
  userActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#2a2a2a',
  },
  deleteButton: {
    backgroundColor: '#5c2b29',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#b388ff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#b388ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});