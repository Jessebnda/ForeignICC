import React, { useEffect } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Text 
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { useChats } from '../../hooks/useChats';
import ChatSessionCard from '../../components/mentor/ChatSessionCard';
import { ChatSession } from '../../services/mentorService';

export default function ReceivedChatsScreen() {
  const router = useRouter();
  const auth = getAuth();
  const userId = auth.currentUser?.uid || '';
  
  const { 
    chatSessions, 
    loading, 
    setActiveSession 
  } = useChats(userId, true);
  
  const handleSelectSession = (session: ChatSession) => {
    setActiveSession(session);
    router.push({
      pathname: '/extra/chatDetail',
      params: { sessionId: session.id }
    });
  };
  
  if (loading.sessions) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#bb86fc" />
        <Text style={styles.loadingText}>Cargando conversaciones...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <FlatList
        data={chatSessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatSessionCard
            session={item}
            isMentor={true}
            onPress={handleSelectSession}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No has recibido mensajes todavía
            </Text>
            <Text style={styles.emptySubText}>
              Los estudiantes que te contacten aparecerán aquí
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
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
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
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});