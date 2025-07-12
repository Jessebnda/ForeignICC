import React, { useState, useEffect } from 'react';
import { 
  FlatList, 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  RefreshControl,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query as firestoreQuery, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { ref, query as dbQuery, orderByChild, get, onValue } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { firestore, database } from '../../firebase';
import { Ionicons } from '@expo/vector-icons';

interface FriendInfo {
  id: string;
  name: string;
  photoURL?: string;
  lastMessage?: string;
  timestamp?: number;
  unreadCount?: number;
  isOnline?: boolean;
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
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const currentUser = getAuth().currentUser;

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFriends();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const fetchFriends = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const userRef = doc(firestore, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const friendIds = userSnap.exists() ? userSnap.data()?.friends || [] : [];

      if (friendIds.length === 0) {
        setFriends([]);
        setFilteredFriends([]);
        setLoading(false);
        return;
      }

      const usersRef = collection(firestore, 'users');
      const q = firestoreQuery(usersRef, where('uid', 'in', friendIds.slice(0, 30)));
      const querySnapshot = await getDocs(q);

      const friendsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.data().displayName || 'Sin nombre',
        photoURL: doc.data().photo || doc.data().photoURL || '',
        lastMessage: '',
        timestamp: 0,
        unreadCount: 0,
        isOnline: Math.random() > 0.5 // Simulado - en producción vendría de la base de datos
      }));

      const messagesRef = ref(database, 'messages');
      const snapshot = await get(messagesRef);
      
      if (snapshot.exists()) {
        const allChats = snapshot.val();
        
        const updatedFriends = await Promise.all(friendsList.map(async (friend) => {
          const chatId = currentUser.uid < friend.id 
            ? `${currentUser.uid}_${friend.id}` 
            : `${friend.id}_${currentUser.uid}`;
          
          if (allChats[chatId]) {
            const chatMessages = allChats[chatId];
            const messagesArray = chatMessages ? Object.values(chatMessages) as ChatMessage[] : [];
            
            const sortedMessages = messagesArray.sort((a: any, b: any) => 
              (b.timestamp || 0) - (a.timestamp || 0)
            );
            
            const lastMessage = sortedMessages.length > 0 ? sortedMessages[0] : null;
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
          
          return friend;
        }));
        
        const sortedFriends = updatedFriends.sort((a, b) => {
          if (a.timestamp && b.timestamp) {
            return b.timestamp - a.timestamp;
          }
          if (a.timestamp) return -1;
          if (b.timestamp) return 1;
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

  useEffect(() => {
    fetchFriends();

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

  useEffect(() => {
    let filtered = friends;

    // Filtrar por búsqueda
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(friend =>
        friend.name.toLowerCase().includes(lowercasedQuery) ||
        friend.lastMessage?.toLowerCase().includes(lowercasedQuery)
      );
    }

    // Filtrar por tab activo
    if (activeTab === 'unread') {
      filtered = filtered.filter(friend => (friend.unreadCount ?? 0) > 0);
    }

    setFilteredFriends(filtered);
  }, [searchQuery, friends, activeTab]);

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

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return '';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    
    return new Date(timestamp).toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const unreadCount = friends.reduce((total, friend) => total + (friend.unreadCount || 0), 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#bb86fc" />
          <Text style={styles.loadingText}>Cargando conversaciones...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="chatbubbles" size={24} color="#bb86fc" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Mensajes</Text>
            <Text style={styles.headerSubtitle}>
              {friends.length} {friends.length === 1 ? 'conversación' : 'conversaciones'}
            </Text>
          </View>
        </View>
        {unreadCount > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Ionicons 
            name="chatbubbles-outline" 
            size={18} 
            color={activeTab === 'all' ? '#bb86fc' : '#888'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'all' && styles.activeTabText
          ]}>
            Todas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
          onPress={() => setActiveTab('unread')}
        >
          <Ionicons 
            name="mail-unread-outline" 
            size={18} 
            color={activeTab === 'unread' ? '#bb86fc' : '#888'} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'unread' && styles.activeTabText
          ]}>
            No leídos
          </Text>
          {unreadCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar conversaciones..."
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
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredFriends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[
              styles.chatCard,
              (item.unreadCount ?? 0) > 0 && styles.unreadChatCard
            ]} 
            onPress={() => goToChat(item)}
          >
            <View style={styles.avatarContainer}>
              <Image 
                source={renderAvatar(item.photoURL)} 
                style={styles.avatar} 
              />
              {item.isOnline && <View style={styles.onlineIndicator} />}
            </View>
            
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={[
                  styles.chatName,
                  (item.unreadCount ?? 0) > 0 && styles.unreadChatName
                ]}>
                  {item.name || 'Sin nombre'}
                </Text>
                {item.timestamp > 0 && (
                  <Text style={styles.timestamp}>
                    {formatTimestamp(item.timestamp ?? 0)}
                  </Text>
                )}
              </View>
              
              <View style={styles.messageRow}>
                <Text 
                  style={[
                    styles.lastMessage,
                    (item.unreadCount ?? 0) > 0 && styles.unreadLastMessage
                  ]} 
                  numberOfLines={1} 
                  ellipsizeMode="tail"
                >
                  {item.lastMessage || 'Inicia una conversación'}
                </Text>
                
                {(item.unreadCount ?? 0) > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>
                      {(item.unreadCount ?? 0) > 9 ? '9+' : item.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#bb86fc']}
            tintColor="#bb86fc"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons 
                name={activeTab === 'unread' ? "mail-outline" : "chatbubbles-outline"} 
                size={64} 
                color="#bb86fc" 
              />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'unread' 
                ? 'No tienes mensajes sin leer' 
                : searchQuery 
                  ? 'No se encontraron conversaciones'
                  : 'No tienes conversaciones'
              }
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'unread' 
                ? 'Los nuevos mensajes aparecerán aquí'
                : searchQuery 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Conecta con tus amigos para empezar a chatear'
              }
            </Text>
            {!searchQuery && activeTab === 'all' && (
              <TouchableOpacity 
                style={styles.addFriendButton}
                onPress={() => router.push('/extra/friendRequest')}
              >
                <Ionicons name="person-add" size={18} color="#fff" />
                <Text style={styles.addFriendText}>Buscar amigos</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingContent: {
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 24,
    borderRadius: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  headerBadge: {
    backgroundColor: '#ff4757',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  tabBadge: {
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
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
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
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  chatCard: { 
    flexDirection: 'row', 
    padding: 15, 
    alignItems: 'center', 
    borderRadius: 12, 
    backgroundColor: '#2a2a2a', 
    marginBottom: 12,
  },
  unreadChatCard: {
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#bb86fc',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25,
    backgroundColor: '#333',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: { 
    fontWeight: '500', 
    color: '#fff', 
    fontSize: 16,
  },
  unreadChatName: {
    fontWeight: '600',
    color: '#bb86fc',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: { 
    color: '#888', 
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  unreadLastMessage: {
    color: '#ccc',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#bb86fc',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
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
    marginBottom: 24,
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#bb86fc',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  addFriendText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});