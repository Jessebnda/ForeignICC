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
  Animated
} from 'react-native';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firestore } from '../../firebase';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import MaxWidthContainer from '../../components/MaxWidthContainer';

type UserData = {
  id: string;
  name?: string;
  photo?: string;
  friends?: string[];
  pendingRequests?: string[];
};

export default function AmigosScreen() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const currentUser = getAuth().currentUser;
  const [pendingRequests, setPendingRequests] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  // Función para actualizar el estado de carga para un usuario específico
  const setLoadingFor = (userId: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [userId]: isLoading
    }));
  };

  // Refrescar
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchUsers();
    } catch (error) {
      console.error('Error al refrescar feed:', error);
    } finally {
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    }
  };

  // Enviar solicitud de amistad
  const sendFriendRequest = async (targetUserId: string) => {
    if (!currentUser) return;
    
    setLoadingFor(targetUserId, true);
    
    try {
      const targetUserRef = doc(firestore, 'users', targetUserId);
      
      await updateDoc(targetUserRef, {
        pendingRequests: arrayUnion(currentUser.uid),
      });
      
      Alert.alert('✅ Solicitud enviada', 'Tu solicitud ha sido enviada con éxito.');
      
      await fetchUsers();
    } catch (error) {
      console.error('❌ Error enviando solicitud:', error);
      Alert.alert('Error', 'No se pudo enviar la solicitud.');
    } finally {
      setLoadingFor(targetUserId, false);
    }
  };

  // Aceptar solicitud
  const acceptFriendRequest = async (requestingUserId: string) => {
    if (!currentUser) return;
    
    setLoadingFor(requestingUserId, true);
    
    try {
      const userRef = doc(firestore, 'users', currentUser.uid);
      
      await updateDoc(userRef, {
        friends: arrayUnion(requestingUserId),
        pendingRequests: arrayRemove(requestingUserId),
      });
      
      // También agregar a su lista de amigos
      const requestingUserRef = doc(firestore, 'users', requestingUserId);
      await updateDoc(requestingUserRef, {
        friends: arrayUnion(currentUser.uid),
      });
      
      Alert.alert('✅ Solicitud aceptada', '¡Ahora son amigos!');
      await fetchUsers();
    } catch (error) {
      console.error('❌ Error aceptando solicitud:', error);
      Alert.alert('Error', 'No se pudo aceptar la solicitud.');
    } finally {
      setLoadingFor(requestingUserId, false);
    }
  };

  // Rechazar solicitud
  const rejectFriendRequest = async (requestingUserId: string) => {
    if (!currentUser) return;
    
    setLoadingFor(requestingUserId, true);
    
    try {
      const userRef = doc(firestore, 'users', currentUser.uid);
      
      await updateDoc(userRef, {
        pendingRequests: arrayRemove(requestingUserId),
      });
      
      Alert.alert('✅ Solicitud rechazada');
      await fetchUsers();
    } catch (error) {
      console.error('❌ Error rechazando solicitud:', error);
      Alert.alert('Error', 'No se pudo rechazar la solicitud.');
    } finally {
      setLoadingFor(requestingUserId, false);
    }
  };

  // Obtener usuarios
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
      setFriends(friendList);
      setPendingRequests(pendingList);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const renderItem = ({ item }: { item: UserData }) => {
    const isFriend = friends.includes(item.id);
    const isPending = pendingRequests.includes(item.id);
    const isLoading = loadingStates[item.id] || false;
    
    // Animaciones
    const scaleAnim = new Animated.Value(1);
    
    const onPressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };
    
    const onPressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View 
        style={[
          styles.card,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <View style={styles.cardContent}>
          {isFriend && (
            <View style={styles.friendBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
            </View>
          )}
          
          <Image
            source={item.photo ? { uri: item.photo } : require('../../assets/images/img7.jpg')}
            style={styles.avatar}
          />
          
          <Text style={styles.userName}>{item.name}</Text>
          
          {!isFriend && !isPending && (
            <TouchableOpacity 
              style={styles.sendRequestButton}
              onPress={() => sendFriendRequest(item.id)}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="person-add" size={16} color="#ffffff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Enviar solicitud</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          
          {isPending && (
            <View style={styles.pendingActions}>
              <TouchableOpacity 
                style={styles.acceptButton}
                onPress={() => acceptFriendRequest(item.id)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={16} color="#ffffff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Aceptar</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.rejectButton}
                onPress={() => rejectFriendRequest(item.id)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="close" size={16} color="#ffffff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Rechazar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
          
          {isFriend && (
            <View style={styles.friendStatus}>
              <Ionicons name="people" size={16} color="#4CAF50" />
              <Text style={styles.friendStatusText}>Amigos</Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="search-off" size={60} color="#bb86fc" />
      <Text style={styles.emptyText}>No se encontraron usuarios</Text>
      <Text style={styles.emptySubText}>Intenta más tarde</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <MaxWidthContainer>
        <Text style={styles.title}>
          <Ionicons name="people" size={24} color="#bb86fc" /> Buscar amigos
        </Text>
        
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#bb86fc']}
              tintColor="#bb86fc"
            />
          }
          ListEmptyComponent={EmptyListComponent}
          showsVerticalScrollIndicator={false}
        />
      </MaxWidthContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  listContainer: {
    paddingBottom: 40,
    paddingTop: 10,
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#bb86fc',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#bb86fc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardContent: {
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  friendBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#03DAC6',
    borderRadius: 12,
    padding: 6,
    zIndex: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#ffffff',
    backgroundColor: '#333333',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  friendStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  friendStatusText: {
    color: '#4CAF50',
    marginLeft: 6,
    fontWeight: '600',
  },
  pendingActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
  },
  sendRequestButton: {
    backgroundColor: '#4f0c2e',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    marginTop: 10,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    minWidth: 110,
  },
  rejectButton: {
    backgroundColor: '#F44336',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    minWidth: 110,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonIcon: {
    marginRight: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#bb86fc',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubText: {
    color: '#999999',
    fontSize: 14,
    marginTop: 8,
  },
});