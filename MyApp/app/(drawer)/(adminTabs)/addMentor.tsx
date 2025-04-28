import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, Text, TextInput, TouchableOpacity, 
  Alert, StyleSheet, FlatList, View, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { firestore } from '../../../firebase';
import { collection, getDocs, doc, updateDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

// Interfaces
interface User {
  id: string;
  name?: string;
  email?: string;
  isMentor?: boolean;
}

export default function AddMentor() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [areasInput, setAreasInput] = useState('');

  // Cargar usuarios
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // Busca usuarios que NO son mentores todavía
        const q = query(
          collection(firestore, 'users'), 
          where('isMentor', '!=', true)
        );
        const snapshot = await getDocs(q);
        
        const usersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as any
        }));
        
        setUsers(usersList);
        setFilteredUsers(usersList);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        Alert.alert('Error', 'No se pudieron cargar los usuarios');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  // Filtrar usuarios cuando cambia la búsqueda
  useEffect(() => {
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = users.filter(user => 
        user.name?.toLowerCase().includes(lowercasedQuery) ||
        user.email?.toLowerCase().includes(lowercasedQuery)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  const handleSave = async () => {
    if (!selectedUser) {
      return Alert.alert('Error', 'Selecciona un usuario para convertir en mentor');
    }

    const areas = areasInput.split(',').map(a => a.trim()).filter(a => a);
    if (areas.length === 0) {
      return Alert.alert('Error', 'Ingresa al menos un área de especialidad');
    }

    try {
      // Actualizar usuario existente en lugar de crear uno nuevo
      await updateDoc(doc(firestore, 'users', selectedUser.id), {
        isMentor: true,
        areas,
        updatedAt: serverTimestamp()
      });
      
      Alert.alert('Éxito', `${selectedUser.name || 'Usuario'} ahora es mentor`, [
        { 
          text: 'OK', 
          onPress: () => {
            // Reemplazar navegación para forzar recarga
            router.replace({
              pathname: './gestionUsuarios',
              params: { refresh: 'true', activeTab: 'mentors' }
            });
          }
        }
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo convertir al usuario en mentor');
    }
  };

  // Renderizar usuario en la lista
  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity 
      style={[
        styles.userItem, 
        selectedUser?.id === item.id && styles.selectedItem
      ]}
      onPress={() => handleUserSelect(item)}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name || 'Sin nombre'}</Text>
        <Text style={styles.userEmail}>{item.email || 'Sin email'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Convertir usuario en mentor</Text>
      
      {selectedUser ? (
        // Vista de edición cuando un usuario está seleccionado
        <View style={styles.formContainer}>
          <View style={styles.selectedUserInfo}>
            <Text style={styles.label}>Usuario seleccionado:</Text>
            <Text style={styles.selectedUserName}>{selectedUser.name || 'Sin nombre'}</Text>
            <Text style={styles.selectedUserEmail}>{selectedUser.email || 'Sin email'}</Text>
            
            <TouchableOpacity 
              style={styles.changeButton}
              onPress={() => setSelectedUser(null)}
            >
              <Text style={styles.changeButtonText}>Cambiar usuario</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.label}>Áreas de especialización (separadas por coma):</Text>
          <TextInput
            style={styles.input}
            value={areasInput}
            onChangeText={setAreasInput}
            placeholder="Ej: Deportes, Tecnología, Música..."
            placeholderTextColor="#666"
            multiline
          />
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.buttonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Vista de selección de usuario
        <View style={styles.userSelectContainer}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar usuarios..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color="#b388ff" style={styles.loader} />
          ) : (
            <FlatList
              data={filteredUsers}
              renderItem={renderUserItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.userList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No se encontraron usuarios{searchQuery ? ' con esa búsqueda' : ''}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: '#000'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center'
  },
  userSelectContainer: {
    flex: 1
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
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
  userList: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    marginBottom: 8,
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: '#2c1a47', // Fondo para item seleccionado
    borderWidth: 1,
    borderColor: '#b388ff',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#b388ff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#999',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  formContainer: {
    flex: 1,
  },
  selectedUserInfo: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  selectedUserName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedUserEmail: {
    color: '#999',
    fontSize: 14,
    marginBottom: 12,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#444',
    padding: 12,
    color: '#fff',
    marginVertical: 8,
    borderRadius: 8,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  changeButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  changeButtonText: {
    color: '#b388ff',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#b388ff',
    padding: 14,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
});