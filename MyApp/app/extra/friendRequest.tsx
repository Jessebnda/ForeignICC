import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Animated,
  ScrollView,
  Platform,
  TextInput
} from 'react-native';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firestore } from '../../firebase';
import { Ionicons } from '@expo/vector-icons';
import MaxWidthContainer from '../../components/MaxWidthContainer';

type UserData = {
  id: string;
  name?: string;
  photo?: string;
  friends?: string[];
  pendingRequests?: string[];
  email?: string;
};

export default function friendRequest() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const currentUser = getAuth().currentUser;
  const [pendingRequests, setPendingRequests] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'discover' | 'requests'>('discover');

  const setLoadingFor = (userId: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [userId]: isLoading
    }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchUsers();
    } catch (error) {
      console.error('Error al refrescar:', error);
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    if (!currentUser) return;
    
    setLoadingFor(targetUserId, true);
    
    try {
      const targetUserRef = doc(firestore, 'users', targetUserId);
      
      await updateDoc(targetUserRef, {
        pendingRequests: arrayUnion(currentUser.uid),
      });
      
      Alert.alert('¡Solicitud enviada!', 'Tu solicitud de amistad ha sido enviada correctamente.');
      await fetchUsers();
    } catch (error) {
      console.error('Error enviando solicitud:', error);
      Alert.alert('Error', 'No se pudo enviar la solicitud.');
    } finally {
      setLoadingFor(targetUserId, false);
    }
  };

  const acceptFriendRequest = async (requestingUserId: string) => {
    if (!currentUser) return;
    
    setLoadingFor(requestingUserId, true);
    
    try {
      const userRef = doc(firestore, 'users', currentUser.uid);
      
      await updateDoc(userRef, {
        friends: arrayUnion(requestingUserId),
        pendingRequests: arrayRemove(requestingUserId),
      });
      
      const requestingUserRef = doc(firestore, 'users', requestingUserId);
      await updateDoc(requestingUserRef, {
        friends: arrayUnion(currentUser.uid),
      });
      
      Alert.alert('¡Genial!', '¡Ahora son amigos! 🎉');
      await fetchUsers();
    } catch (error) {
      console.error('Error aceptando solicitud:', error);
      Alert.alert('Error', 'No se pudo aceptar la solicitud.');
    } finally {
      setLoadingFor(requestingUserId, false);
    }
  };

  const rejectFriendRequest = async (requestingUserId: string) => {
    if (!currentUser) return;
    
    Alert.alert(
      'Rechazar solicitud',
      '¿Estás seguro de que quieres rechazar esta solicitud?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            setLoadingFor(requestingUserId, true);
            
            try {
              const userRef = doc(firestore, 'users', currentUser.uid);
              
              await updateDoc(userRef, {
                pendingRequests: arrayRemove(requestingUserId),
              });
              
              await fetchUsers();
            } catch (error) {
              console.error('Error rechazando solicitud:', error);
              Alert.alert('Error', 'No se pudo rechazar la solicitud.');
            } finally {
              setLoadingFor(requestingUserId, false);
            }
          }
        }
      ]
    );
  };

  const fetchUsers = async () => {
    if (!currentUser) return;
    
    try {
      const currentSnap = await getDocs(collection(firestore, 'users'));
      const userList = currentSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as UserData));
      
      const currentUserData = userList.find((u) => u.id === currentUser.uid);
      const friendList = currentUserData?.friends || [];
      const pendingList = currentUserData?.pendingRequests || [];
      
      const filtered = userList.filter((u) => u.id !== currentUser.uid);
      setUsers(filtered);
      setFilteredUsers(filtered);
      setFriends(friendList);
      setPendingRequests(pendingList);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.name?.toLowerCase().includes(query.toLowerCase()) ||
        user.email?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getImageSource = (photo?: string) => {
    return photo ? { uri: photo } : require('../../assets/images/img7.jpg');
  };

  const renderDiscoverItem = ({ item }: { item: UserData }) => {
    const isFriend = friends.includes(item.id);
    const isLoading = loadingStates[item.id] || false;

    if (isFriend) return null;

    return (
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <Image
            source={getImageSource(item.photo)}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.name || 'Usuario'}</Text>
            <Text style={styles.userEmail}>{item.email || 'Sin email'}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.sendButton]}
          onPress={() => sendFriendRequest(item.id)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="person-add-outline" size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Agregar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderRequestItem = ({ item }: { item: UserData }) => {
    const isLoading = loadingStates[item.id] || false;

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <Image
            source={getImageSource(item.photo)}
            style={styles.requestAvatar}
          />
          <View style={styles.requestInfo}>
            <Text style={styles.requestName}>{item.name || 'Usuario'}</Text>
            <Text style={styles.requestText}>Te ha enviado una solicitud de amistad</Text>
          </View>
        </View>
        
        <View style={styles.requestActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => acceptFriendRequest(item.id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Aceptar</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => rejectFriendRequest(item.id)}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="close" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Rechazar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const EmptyDiscoverComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="people-outline" size={64} color="#bb86fc" />
      </View>
      <Text style={styles.emptyTitle}>No hay usuarios para mostrar</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'No se encontraron usuarios con ese nombre' : 'Todos los usuarios disponibles ya son tus amigos'}
      </Text>
    </View>
  );

  const EmptyRequestsComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="mail-outline" size={64} color="#bb86fc" />
      </View>
      <Text style={styles.emptyTitle}>No tienes solicitudes pendientes</Text>
      <Text style={styles.emptySubtitle}>Las nuevas solicitudes de amistad aparecerán aquí</Text>
    </View>
  );

  const pendingRequestUsers = users.filter(user => pendingRequests.includes(user.id));
  const discoverUsers = filteredUsers.filter(user => !friends.includes(user.id));

  return (
    <View style={styles.container}>
      <MaxWidthContainer style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerIcon}>
              <Ionicons name="people" size={24} color="#bb86fc" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Amigos</Text>
              <Text style={styles.headerSubtitle}>Conecta con otras personas</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
            onPress={() => setActiveTab('discover')}
          >
            <Ionicons 
              name="search-outline" 
              size={20} 
              color={activeTab === 'discover' ? '#bb86fc' : '#888'} 
            />
            <Text style={[
              styles.tabText,
              activeTab === 'discover' && styles.activeTabText
            ]}>
              Descubrir
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
            onPress={() => setActiveTab('requests')}
          >
            <Ionicons 
              name="mail-outline" 
              size={20} 
              color={activeTab === 'requests' ? '#bb86fc' : '#888'} 
            />
            <Text style={[
              styles.tabText,
              activeTab === 'requests' && styles.activeTabText
            ]}>
              Solicitudes
            </Text>
            {pendingRequestUsers.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequestUsers.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar (solo en tab de descubrir) */}
        {activeTab === 'discover' && (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search-outline" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre o email..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={handleSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'discover' ? (
            <FlatList
              data={discoverUsers}
              keyExtractor={(item) => item.id}
              renderItem={renderDiscoverItem}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl 
                  refreshing={refreshing} 
                  onRefresh={onRefresh}
                  colors={['#bb86fc']}
                  tintColor="#bb86fc"
                />
              }
              ListEmptyComponent={EmptyDiscoverComponent}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <FlatList
              data={pendingRequestUsers}
              keyExtractor={(item) => item.id}
              renderItem={renderRequestItem}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl 
                  refreshing={refreshing} 
                  onRefresh={onRefresh}
                  colors={['#bb86fc']}
                  tintColor="#bb86fc"
                />
              }
              ListEmptyComponent={EmptyRequestsComponent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </MaxWidthContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 768,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
    position: 'relative',
  },
  activeTab: {
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(187, 134, 252, 0.3)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#bb86fc',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#888',
  },
  requestCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  requestAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  requestText: {
    fontSize: 13,
    color: '#888',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  sendButton: {
    backgroundColor: '#bb86fc',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
  },
  rejectButton: {
    backgroundColor: '#ff4757',
    flex: 1,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});