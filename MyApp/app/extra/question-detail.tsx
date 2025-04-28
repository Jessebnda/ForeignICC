import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, doc, getDoc, onSnapshot, query, orderBy, Timestamp, updateDoc, increment, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebase';
import { getAuth } from 'firebase/auth';
import { useUser } from '../../context/UserContext';

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
}

interface ForumAnswer {
  id: string;
  content: string;
  timestamp: any;
  user: ForumUser;
  likes: number;
  commentCount: number;
}

export default function QuestionDetailScreen() {
  const router = useRouter();
  const { questionId } = useLocalSearchParams();
  const [question, setQuestion] = useState<ForumQuestion | null>(null);
  const [answers, setAnswers] = useState<ForumAnswer[]>([]);
  const [newAnswer, setNewAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [questionLoading, setQuestionLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;
  const { userProfile } = useUser();
  
  // Obtener la pregunta
  useEffect(() => {
    if (!questionId) return;
    
    setQuestionLoading(true);
    const fetchQuestion = async () => {
      try {
        const questionDoc = await getDoc(doc(firestore, 'forumQuestions', questionId as string));
        if (questionDoc.exists()) {
          setQuestion({ id: questionDoc.id, ...questionDoc.data() } as ForumQuestion);
        }
      } catch (error) {
        console.error('Error al obtener pregunta:', error);
      } finally {
        setQuestionLoading(false);
      }
    };
    
    fetchQuestion();
  }, [questionId]);
  
  // Obtener las respuestas
  useEffect(() => {
    if (!questionId) return;
    
    const q = query(
      collection(firestore, 'forumQuestions', questionId as string, 'answers'),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      setLoading(true);
      
      // Procesar cada respuesta
      const answersPromises = snapshot.docs.map(async (doc) => {
        const answerData = { id: doc.id, ...doc.data() } as ForumAnswer;
        
        // Obtener contador de comentarios
        try {
          const commentsCollection = collection(firestore, 'forumQuestions', 
            questionId as string, 'answers', doc.id, 'comments');
          const commentsSnapshot = await getDocs(commentsCollection); // Cambia getDoc por getDocs
          answerData.commentCount = commentsSnapshot.size; // Ahora puedes acceder a .size
        } catch (e) {
          answerData.commentCount = 0;
        }
        
        return answerData;
      });
      
      const loadedAnswers = await Promise.all(answersPromises);
      setAnswers(loadedAnswers);
      setLoading(false);
      setRefreshing(false);
    });
    
    return () => unsubscribe();
  }, [questionId]);

  const onRefresh = () => {
    setRefreshing(true);
    // Las recargas se manejan con el onSnapshot
  };

  const sendAnswer = async () => {
    if (!newAnswer.trim() || !user || !questionId) return;
    
    try {
      const answer = {
        content: newAnswer.trim(),
        timestamp: Timestamp.now(),
        user: {
          id: user.uid,
          name: userProfile?.name || user.displayName || 'Usuario sin nombre',
          photo: userProfile?.photo || '',
        },
        likes: 0,
        commentCount: 0,
      };
      
      // Añadir la respuesta
      await addDoc(
        collection(firestore, 'forumQuestions', questionId as string, 'answers'), 
        answer
      );
      
      // Incrementar el contador de respuestas en la pregunta
      await updateDoc(doc(firestore, 'forumQuestions', questionId as string), {
        answerCount: increment(1)
      });
      
      setNewAnswer('');
    } catch (error) {
      console.error('Error al enviar respuesta:', error);
    }
  };

  const goToAnswerDetail = (answer: ForumAnswer) => {
    router.push({
      pathname: '/extra/answer-detail',
      params: { 
        questionId: questionId as string,
        answerId: answer.id
      }
    });
  };

  const renderAvatar = (source: string) => {
    if (source && (source.startsWith('http') || source.startsWith('data:'))) {
      return { uri: source };
    }
    return require('../../assets/images/img7.jpg');
  };

  if (questionLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#bb86fc" />
        <Text style={styles.loadingText}>Cargando pregunta...</Text>
      </View>
    );
  }

  if (!question) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={64} color="#e91e63" />
        <Text style={styles.errorText}>No se encontró la pregunta</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver al foro</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <Image 
            source={renderAvatar(question.user.photo)} 
            style={styles.questionAvatar} 
          />
          <View style={styles.questionUser}>
            <Text style={styles.userName}>{question.user.name}</Text>
            <Text style={styles.timestamp}>
              {question.timestamp?.toDate ? 
                new Date(question.timestamp.toDate()).toLocaleString() : 
                '...'}
            </Text>
          </View>
        </View>
        <Text style={styles.questionTitle}>{question.title}</Text>
      </View>

      <View style={styles.answersHeader}>
        <Text style={styles.answersTitle}>
          Respuestas ({answers.length})
        </Text>
      </View>

      <FlatList
        data={answers}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loader} color="#bb86fc" size="small" />
          ) : (
            <View style={styles.emptyAnswers}>
              <Text style={styles.emptyText}>Aún no hay respuestas</Text>
              <Text style={styles.emptySuggestion}>¡Sé el primero en responder!</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.answerCard} 
            onPress={() => goToAnswerDetail(item)}
            activeOpacity={0.7}
          >
            <View style={styles.answerHeader}>
              <Image source={renderAvatar(item.user.photo)} style={styles.avatar} />
              <View style={styles.answerMeta}>
                <Text style={styles.userName}>{item.user.name}</Text>
                <Text style={styles.timestamp}>
                  {item.timestamp?.toDate ? 
                    new Date(item.timestamp.toDate()).toLocaleString() : 
                    '...'}
                </Text>
              </View>
            </View>
            <Text style={styles.answerText}>{item.content}</Text>
            <View style={styles.answerFooter}>
              <View style={styles.statContainer}>
                <Ionicons name="heart-outline" size={18} color="#888" />
                <Text style={styles.statText}>{item.likes || 0}</Text>
              </View>
              <View style={styles.statContainer}>
                <Ionicons name="chatbubble-outline" size={18} color="#888" />
                <Text style={styles.statText}>{item.commentCount || 0}</Text>
                <Text style={styles.commentAction}>Ver comentarios</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe una respuesta..."
          placeholderTextColor="#888"
          value={newAnswer}
          onChangeText={setNewAnswer}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, !newAnswer.trim() && styles.sendButtonDisabled]} 
          onPress={sendAnswer}
          disabled={!newAnswer.trim()}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={newAnswer.trim() ? '#fff' : '#888'} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212' 
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#e91e63',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  questionCard: {
    backgroundColor: '#1e1e1e',
    padding: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  questionAvatar: {
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#bb86fc',
  },
  questionUser: {
    justifyContent: 'center',
  },
  questionTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#fff', 
    lineHeight: 28,
  },
  answersHeader: {
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  answersTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  answerCard: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    elevation: 2,
  },
  answerHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#bb86fc',
  },
  answerMeta: {
    justifyContent: 'center',
  },
  userName: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 15,
  },
  timestamp: { 
    fontSize: 12, 
    color: '#888', 
    marginTop: 2,
  },
  answerText: { 
    color: '#fff', 
    fontSize: 16,
    lineHeight: 24,
  },
  answerFooter: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    color: '#888',
    marginLeft: 6,
    fontSize: 14,
  },
  commentAction: {
    color: '#bb86fc',
    marginLeft: 8,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#bb86fc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
  loader: {
    marginVertical: 20,
  },
  emptyAnswers: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  emptySuggestion: {
    color: '#888',
    fontSize: 14,
  },
});
