import React, { useState, useEffect } from 'react';
import { FlatList, View, Text, Image, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query as firestoreQuery, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { ref, query as dbQuery, orderByChild, get, onValue } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { firestore, database } from '../../firebase';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';

// Interfaces
interface ChatRequest {
  id: string;           // chatId
  userId: string;       // ID del usuario que envía el mensaje
  userName: string;     // Nombre del usuario
  userPhoto?: string;   // Foto del usuario
  lastMessage: string;  // Último mensaje
  timestamp: number;    // Timestamp del último mensaje
  unreadCount: number;  // Contador de mensajes no leídos
}

interface ChatMessage {
  from: string;
  text: string;
  timestamp: number;
  read?: boolean;
}

const defaultUserImage = require('../../assets/images/img7.jpg');

export default function ReceivedChatsScreen() {
  const router = useRouter();
  const { userProfile } = useUser();
  const [chats, setChats] = useState<ChatRequest[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Cargar chats desde Realtime Database
  useEffect(() => {
    const fetchReceivedChats = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        
        // Obtenemos todos los mensajes
        const messagesRef = ref(database, 'messages');
        const snapshot = await get(messagesRef);
        
        if (!snapshot.exists()) {
          setChats([]);
          setFilteredChats([]);
          setLoading(false);
          return;
        }

        const allChats = snapshot.val();
        const chatIds = Object.keys(allChats);
        
        // Filtramos los chats donde participa el usuario actual
        const mentorChatIds = chatIds.filter(chatId => 
          chatId.includes(currentUser.uid)
        );
        
        // Para cada chat, obtenemos la información necesaria
        const chatPromises = mentorChatIds.map(async (chatId) => {
          // Obtenemos el ID del otro usuario (no el mentor)
          const [user1, user2] = chatId.split('_');
          const otherUserId = user1 === currentUser.uid ? user2 : user1;
          
          // Obtenemos la información del otro usuario desde Firestore
          const userDoc = await getDoc(doc(firestore, 'users', otherUserId));
          const userData = userDoc.exists() ? userDoc.data() : null;
          
          // Obtenemos los mensajes del chat
          const chatMessages = allChats[chatId];
          const messagesArray = chatMessages ? Object.values(chatMessages) as ChatMessage[] : [];
          
          // Ordenamos por timestamp y obtenemos el último mensaje
          const sortedMessages = messagesArray.sort((a: any, b: any) => 
            (b.timestamp || 0) - (a.timestamp || 0)
          );
          
          const lastMessage = sortedMessages.length > 0 ? sortedMessages[0] : null;
          
          // Contamos mensajes no leídos (de otros usuarios y no leídos)
          const unreadCount = sortedMessages.filter((msg: any) => 
            msg.from !== currentUser.uid && !msg.read
          ).length;
          
          return {
            id: chatId,
            userId: otherUserId,
            userName: userData?.name || userData?.displayName || 'Usuario',
            userPhoto: userData?.photo || userData?.photoURL,
            lastMessage: lastMessage?.text || 'Nuevo chat',
            timestamp: lastMessage?.timestamp || Date.now(),
            unreadCount
          } as ChatRequest;
        });
        
        const userChats = await Promise.all(chatPromises);
        
        // Ordenar por timestamp descendente (más reciente primero)
        const sortedChats = userChats.sort((a, b) => b.timestamp - a.timestamp);
        
        setChats(sortedChats);
        setFilteredChats(sortedChats);
      } catch (error) {
        console.error('Error al cargar chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReceivedChats();
    
    // También configuramos un listener para actualizar en tiempo real
    if (currentUser) {
      const messagesRef = ref(database, 'messages');
      const unsubscribe = onValue(messagesRef, () => {
        fetchReceivedChats();
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, [currentUser]);

  // Filtrar chats cuando cambia la búsqueda
  useEffect(() => {
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = chats.filter(chat =>
        chat.userName?.toLowerCase().includes(lowercasedQuery) ||
        chat.lastMessage?.toLowerCase().includes(lowercasedQuery)
      );
      setFilteredChats(filtered);
    } else {
      setFilteredChats(chats);
    }
  }, [searchQuery, chats]);

  const goToChat = (chat: ChatRequest) => {
    router.push({
      pathname: '/extra/chat',
      params: { 
        friendId: chat.userId,
        friendName: chat.userName || 'Usuario',
        friendPhotoURL: chat.userPhoto || '',
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
        <Text style={styles.loadingText}>Cargando mensajes recibidos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar mensajes..."
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
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.card, item.unreadCount > 0 && styles.unreadCard]} 
            onPress={() => goToChat(item)}
          >
            <Image 
              source={renderAvatar(item.userPhoto)} 
              style={styles.avatar} 
            />
            <View style={styles.userInfo}>
              <Text style={styles.name}>{item.userName || 'Usuario sin nombre'}</Text>
              <Text style={styles.message} numberOfLines={1} ellipsizeMode="tail">
                {item.lastMessage || 'Nuevo mensaje'}
              </Text>
            </View>
            <View style={styles.rightContent}>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>
                    {item.unreadCount > 9 ? '9+' : item.unreadCount}
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
            <Ionicons name="chatbubbles-outline" size={64} color="#555" />
            <Text style={styles.emptyText}>
              No tienes mensajes{searchQuery ? ' con esa búsqueda' : ''}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Estilos existentes...
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
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16
  },
});