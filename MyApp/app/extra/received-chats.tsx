import React, { useState, useEffect } from 'react';
import { FlatList, View, Text, Image, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firestore } from '../../firebase';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';

// Interfaces
interface ChatRequest {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  mentorId: string;
  message?: string;
  timestamp: any;
  read: boolean;
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

  // Cargar chats recibidos
  useEffect(() => {
    const fetchReceivedChats = async () => {
      if (!currentUser || !userProfile?.isMentor) return;

      try {
        setLoading(true);
        // Consultar mensajes donde el usuario actual (mentor) es el destinatario
        const q = query(
          collection(firestore, 'mentorChats'),
          where('mentorId', '==', currentUser.uid),
          orderBy('timestamp', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const chatsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as any
        })) as ChatRequest[];

        setChats(chatsList);
        setFilteredChats(chatsList);
      } catch (error) {
        console.error('Error al cargar chats recibidos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReceivedChats();
  }, [currentUser, userProfile]);

  // Filtrar chats cuando cambia la búsqueda
  useEffect(() => {
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = chats.filter(chat =>
        chat.userName?.toLowerCase().includes(lowercasedQuery) ||
        chat.message?.toLowerCase().includes(lowercasedQuery)
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
          <TouchableOpacity style={[styles.card, !item.read && styles.unreadCard]} onPress={() => goToChat(item)}>
            <Image 
              source={renderAvatar(item.userPhoto)} 
              style={styles.avatar} 
            />
            <View style={styles.userInfo}>
              <Text style={styles.name}>{item.userName || 'Usuario sin nombre'}</Text>
              <Text style={styles.message} numberOfLines={1} ellipsizeMode="tail">
                {item.message || 'Nuevo mensaje'}
              </Text>
            </View>
            <View style={styles.rightContent}>
              {!item.read && <View style={styles.unreadBadge} />}
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
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#bb86fc',
    marginBottom: 6
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