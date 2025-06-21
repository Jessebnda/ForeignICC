import React, { useState, useEffect } from 'react';
import { FlatList, View, Text, Image, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query as firestoreQuery, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { ref, query as dbQuery, orderByChild, get, onValue } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { firestore, database } from '../../firebase';
import { Ionicons } from '@expo/vector-icons';

// Interfaces
interface FriendInfo {
  id: string;
  name: string;
  photoURL?: string;
  lastMessage?: string;
  timestamp?: number;
  unreadCount?: number;
}

interface ChatMessage {
  from: string;
  text: string;
  timestamp: number;
  read?: boolean;
}

const defaultUserImage = require('../../assets/images/img7.jpg');

export default function MessagesScreen() {
  const router = useRouter();
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<FriendInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const currentUser = getAuth().currentUser;

  useEffect(() => {
    const fetchFriends = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // 1. Obtener la lista de amigos del usuario actual
        const userRef = doc(firestore, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        const friendIds = userSnap.exists() ? userSnap.data()?.friends || [] : [];

        if (friendIds.length === 0) {
          setFriends([]);
          setFilteredFriends([]);
          setLoading(false);
          return;
        }

        // 2. Obtener detalles de cada amigo
        const usersRef = collection(firestore, 'users');
        const q = firestoreQuery(usersRef, where('uid', 'in', friendIds.slice(0, 30))); // Límite de 30 amigos
        const querySnapshot = await getDocs(q);

        const friendsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || doc.data().displayName || 'Sin nombre',
          photoURL: doc.data().photo || doc.data().photoURL || '',
          lastMessage: '',
          timestamp: 0,
          unreadCount: 0
        }));

        // 3. Obtener mensajes de chat desde Realtime Database
        const messagesRef = ref(database, 'messages');
        const snapshot = await get(messagesRef);
        
        if (snapshot.exists()) {
          const allChats = snapshot.val();
          
          // 4. Para cada amigo, verificar si tenemos chat y obtener último mensaje
          const updatedFriends = await Promise.all(friendsList.map(async (friend) => {
            // Generar chatId de forma consistente
            const chatId = currentUser.uid < friend.id 
              ? `${currentUser.uid}_${friend.id}` 
              : `${friend.id}_${currentUser.uid}`;
            
            // Verificar si existe chat con este amigo
            if (allChats[chatId]) {
              const chatMessages = allChats[chatId];
              const messagesArray = chatMessages ? Object.values(chatMessages) as ChatMessage[] : [];
              
              // Ordenar por timestamp y obtener último mensaje
              const sortedMessages = messagesArray.sort((a: any, b: any) => 
                (b.timestamp || 0) - (a.timestamp || 0)
              );
              
              const lastMessage = sortedMessages.length > 0 ? sortedMessages[0] : null;
              
              // Contar mensajes no leídos
              const unreadCount = sortedMessages.filter((msg: any) => 
                msg.from === friend.id && !msg.read
              ).length;
              
              return {
                ...friend,
                lastMessage: lastMessage?.text || '',
                timestamp: lastMessage?.timestamp || 0,
                unreadCount
              };
            }
            
            return friend; // Devolver amigo sin cambios si no hay chat
          }));
          
          // 5. Ordenar amigos por timestamp (más reciente primero) y priorizar los que tienen mensajes
          const sortedFriends = updatedFriends.sort((a, b) => {
            // Si ambos tienen timestamp, ordenar por timestamp
            if (a.timestamp && b.timestamp) {
              return b.timestamp - a.timestamp;
            }
            // Si solo uno tiene timestamp, ese va primero
            if (a.timestamp) return -1;
            if (b.timestamp) return 1;
            // Si ninguno tiene timestamp, ordenar por nombre
            return a.name.localeCompare(b.name);
          });
          
          setFriends(sortedFriends);
          setFilteredFriends(sortedFriends);
        } else {
          setFriends(friendsList);
          setFilteredFriends(friendsList);
        }
      } catch (error) {
        console.error('Error al obtener amigos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();

    // Escuchar cambios en los mensajes en tiempo real
    if (currentUser) {
      const messagesRef = ref(database, 'messages');
      const unsubscribe = onValue(messagesRef, () => {
        fetchFriends();
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, [currentUser]);

  // Filtrar amigos cuando cambia la búsqueda
  useEffect(() => {
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = friends.filter(friend =>
        friend.name.toLowerCase().includes(lowercasedQuery) ||
        friend.lastMessage?.toLowerCase().includes(lowercasedQuery)
      );
      setFilteredFriends(filtered);
    } else {
      setFilteredFriends(friends);
    }
  }, [searchQuery, friends]);

  const goToChat = (friend: FriendInfo) => {
    router.push({
      pathname: '/extra/chat',
      params: { 
        friendId: friend.id,
        friendName: friend.name || 'Amigo',
        friendPhotoURL: friend.photoURL || '',
      }
    });
  };

  const renderAvatar = (source?: string) => {
    if (source && (source.startsWith('http') || source.startsWith('data:'))) {
      return { uri: source };
    }
    return defaultUserImage;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b388fc" />
        <Text style={styles.loadingText}>Cargando amigos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar amigos..."
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

      <FlatList
        data={filteredFriends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.card, item.unreadCount ? styles.unreadCard : null]} 
            onPress={() => goToChat(item)}
          >
            <Image 
              source={renderAvatar(item.photoURL)} 
              style={styles.avatar} 
            />
            <View style={styles.userInfo}>
              <Text style={styles.name}>{item.name || 'Sin nombre'}</Text>
              <Text style={styles.message} numberOfLines={1} ellipsizeMode="tail">
                {item.lastMessage || 'Inicia una conversación'}
              </Text>
            </View>
            <View style={styles.rightContent}>
              {(item.unreadCount ?? 0) > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>
                    {(item.unreadCount ?? 0) > 9 ? '9+' : item.unreadCount}
                  </Text>
                </View>
              )}
              <Ionicons name="chatbubble-outline" size={24} color="#b388fc" style={styles.chatIcon} />
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#555" />
            <Text style={styles.emptyText}>
              No tienes amigos{searchQuery ? ' con esa búsqueda' : ''}
            </Text>
            <TouchableOpacity 
              style={styles.addFriendButton}
              onPress={() => router.push('/extra/friendRequest')}
            >
              <Text style={styles.addFriendText}>Agregar amigos</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212',
    paddingTop: 8
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 12,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
  },
  list: {
    padding: 16,
  },
  card: { 
    flexDirection: 'row', 
    padding: 16, 
    alignItems: 'center', 
    borderRadius: 10, 
    backgroundColor: '#1e1e1e', 
    marginBottom: 12, 
    elevation: 2 
  },
  unreadCard: {
    backgroundColor: '#2c1a47',
    borderLeftWidth: 3,
    borderLeftColor: '#bb86fc',
  },
  avatar: { 
    width: 55, 
    height: 55, 
    borderRadius: 27.5, 
    marginRight: 12 
  },
  userInfo: {
    flex: 1,
  },
  name: { 
    fontWeight: 'bold', 
    color: '#fff', 
    fontSize: 16 
  },
  message: { 
    color: '#ccc', 
    fontSize: 14,
    marginTop: 4
  },
  rightContent: {
    alignItems: 'center',
  },
  chatIcon: {
    marginLeft: 8
  },
  unreadBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#bb86fc',
    marginBottom: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24
  },
  addFriendButton: {
    backgroundColor: '#bb86fc',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center'
  },
  addFriendText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16
  }
});