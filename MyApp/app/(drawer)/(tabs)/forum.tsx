import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, getDocs } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { getAuth } from 'firebase/auth';
import { useUser } from '../../../context/UserContext';
import { formatTimeAgo } from '../../../utils/formatters';

interface ForumUser {
  id: string;
  name: string;
  photo: string;
}

interface ForumQuestion {
  id: string;
  title: string;
  timestamp: any;
  user: ForumUser;
  answerCount?: number;
}

export default function ForumScreen() {
  const router = useRouter();
  const [forumData, setForumData] = useState<ForumQuestion[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;
  const { userProfile } = useUser();

  const fetchQuestions = () => {
    const q = query(collection(firestore, 'forumQuestions'), orderBy('timestamp', 'desc'));
    return onSnapshot(q, async (snapshot) => {
      setLoading(true);
      
      // Obtener las preguntas con sus contadores de respuestas
      const questionsPromises = snapshot.docs.map(async (doc) => {
        const questionData = { id: doc.id, ...doc.data() } as ForumQuestion;
        
        // Obtener el contador de respuestas
        const answersQuery = collection(firestore, 'forumQuestions', doc.id, 'answers');
        const answersSnapshot = await getDocs(answersQuery); // Cambia getDoc por getDocs
        questionData.answerCount = answersSnapshot.size; // Ahora puedes acceder a .size
        
        return questionData;
      });
      
      const questions = await Promise.all(questionsPromises);
      setForumData(questions);
      setLoading(false);
      setRefreshing(false);
    });
  };

  useEffect(() => {
    const unsubscribe = fetchQuestions();
    return () => unsubscribe();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQuestions();
  };

  const addQuestion = async () => {
    if (!question.trim() || !user) return;

    try {
      const newQuestion = {
        title: question.trim(),
        timestamp: Timestamp.now(),
        user: {
          id: user.uid,
          name: userProfile?.name || user.displayName || 'Usuario sin nombre',
          photo: userProfile?.photo || '',
        },
        answerCount: 0,
      };
      
      await addDoc(collection(firestore, 'forumQuestions'), newQuestion);
      setQuestion('');
    } catch (error) {
      console.error('Error al crear pregunta:', error);
    }
  };

  const goToQuestionDetail = (item: ForumQuestion) => {
    router.push({
      pathname: '/extra/question-detail',  // ✅ Ruta absoluta correcta
      params: { questionId: item.id }
    });
  };

  const renderAvatar = (source: any) => {
    try {
      // Si es directamente un objeto con uri, retornarlo
      if (source && typeof source === 'object' && source.uri) {
        return source;
      }
      
      // Si es un string válido con http o data:
      if (source && typeof source === 'string' && 
          (source.startsWith('http') || source.startsWith('data:'))) {
        // En iOS antiguo, a veces es necesario añadir un cache buster
        const cacheBuster = `?t=${Date.now()}`;
        const imageUri = source.includes('?') ? source : source + cacheBuster;
        return { uri: imageUri };
      }
      
      // Respaldo: imagen por defecto
      return require('../../../assets/images/img7.jpg');
    } catch (e) {
      console.log('Error renderizando avatar:', e);
      return require('../../../assets/images/img7.jpg');
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#bb86fc" />
        <Text style={styles.loadingText}>Cargando preguntas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={forumData}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => goToQuestionDetail(item)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.userInfo}>
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                  onPress={() => router.push(`/extra/perfil?uid=${item.user.id}`)}
                >
                  <Image 
                    source={renderAvatar(item.user.photo)} 
                    style={styles.avatar} 
                  />
                  <View>
                    <Text style={styles.userName}>{item.user.name}</Text>
                    <Text style={styles.timestamp}>{formatTimeAgo(item.timestamp)}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.title}>{item.title}</Text>

            <View style={styles.cardFooter}>
              <View style={styles.stats}>
                <Ionicons name="chatbubble-outline" size={20} color="#bb86fc" />
                <Text style={styles.answerCount}>
                  {item.answerCount || 0} {item.answerCount === 1 ? 'respuesta' : 'respuestas'}
                </Text>
              </View>
              <TouchableOpacity style={styles.answerButton}>
                <Text style={styles.answerButtonText}>Responder</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#555" />
            <Text style={styles.emptyText}>No hay preguntas en el foro</Text>
            <Text style={styles.emptySubText}>¡Sé el primero en preguntar algo!</Text>
          </View>
        }
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe tu pregunta..."
          placeholderTextColor="#888"
          value={question}
          onChangeText={setQuestion}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !question.trim() && styles.sendButtonDisabled]}
          onPress={addQuestion}
          disabled={!question.trim()}
        >
          <Ionicons name="send" size={20} color={question.trim() ? '#fff' : '#888'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: '#121212' 
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#bb86fc',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#bb86fc',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  moreButton: {
    padding: 8,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#fff',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#888',
    marginLeft: 6,
    fontSize: 14,
  },
  answerCount: {
    color: '#bb86fc',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  answerButton: {
    backgroundColor: '#2c1a47',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerButtonText: {
    color: '#bb86fc',
    fontSize: 14,
    fontWeight: '600',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    backgroundColor: '#1e1e1e',
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#bb86fc',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
});