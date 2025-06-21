import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, collection, addDoc, onSnapshot, query, orderBy, Timestamp, updateDoc, increment } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firestore } from '../../firebase';
import { useUser } from '../../context/UserContext';
import { createNotification } from '../../services/notificationService';

interface ForumUser {
  id: string;
  name: string;
  photo: string;
}

interface ForumAnswer {
  id: string;
  content: string;
  timestamp: any;
  user: ForumUser;
  userId: string; // Agregar esta propiedad
  likes: number;
}

interface ForumComment {
  id: string;
  content: string;
  timestamp: any;
  user: ForumUser;
  likes: number;
}

export default function AnswerDetailScreen() {
  const router = useRouter();
  const { questionId, answerId } = useLocalSearchParams();
  const [answer, setAnswer] = useState<ForumAnswer | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [answerLoading, setAnswerLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;
  const { userProfile } = useUser();

  // Cargar la respuesta
  useEffect(() => {
    if (!questionId || !answerId) return;
    
    const fetchAnswer = async () => {
      try {
        setAnswerLoading(true);
        const answerDoc = await getDoc(
          doc(firestore, 'forumQuestions', questionId as string, 'answers', answerId as string)
        );
        
        if (answerDoc.exists()) {
          setAnswer({ id: answerDoc.id, ...answerDoc.data() } as ForumAnswer);
        }
      } catch (error) {
        console.error('Error al obtener respuesta:', error);
      } finally {
        setAnswerLoading(false);
      }
    };
    
    fetchAnswer();
  }, [questionId, answerId]);
  
  // Cargar los comentarios
  useEffect(() => {
    if (!questionId || !answerId) return;
    
    const q = query(
      collection(firestore, 'forumQuestions', questionId as string, 'answers', answerId as string, 'comments'),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedComments = snapshot.docs.map(doc => 
        ({ id: doc.id, ...doc.data() }) as ForumComment
      );
      setComments(loadedComments);
      setLoading(false);
      setRefreshing(false);
    });
    
    return () => unsubscribe();
  }, [questionId, answerId]);

  const onRefresh = () => {
    setRefreshing(true);
    // Las recargas se manejan con el onSnapshot
  };

  const addComment = async () => {
    if (!newComment.trim() || !user || !answer) return; // Añadir verificación de answer
    
    try {
      const comment = {
        content: newComment.trim(),
        timestamp: Timestamp.now(),
        user: {
          id: user.uid,
          name: userProfile?.name || user?.displayName || 'Usuario sin nombre',
          photo: userProfile?.photo || '',
        },
        likes: 0
      };
      
      // Añadir el comentario
      await addDoc(
        collection(firestore, 'forumQuestions', 
          questionId as string, 'answers', answerId as string, 'comments'),
        comment
      );
      
      // Incrementar el contador de comentarios
      await updateDoc(
        doc(firestore, 'forumQuestions', questionId as string, 'answers', answerId as string),
        { commentCount: increment(1) }
      );
      
      setNewComment('');

      // Verificación segura
      if (answer && user && answer.userId && user.uid) {
        console.log("Datos de notificación respuesta:", {
          fromUserId: user.uid,
          toUserId: answer.userId,
        });
        
        try {
          await createNotification({
            type: 'forum_answer_comment',
            fromUserId: String(user.uid),
            fromUserName: userProfile?.name || user?.displayName || 'Usuario',
            fromUserPhoto: userProfile?.photo || '',
            toUserId: String(answer.userId),
            contentId: String(answerId),
            contentText: newComment.trim().substring(0, 100),
            relatedContentId: String(questionId)
          });
        } catch (err) {
          console.error("Error al crear notificación:", err);
        }
      }
    } catch (error) {
      console.error("Error al añadir comentario:", error);
    }
  };

  const toggleLike = async () => {
    if (!user || !questionId || !answerId || !answer) return;
    
    try {
      // Tu código existente para actualizar el like...
      
      // Primero recupera explícitamente todos los datos de la respuesta
      // para asegurar que tenemos toda la información
      const answerRef = doc(firestore, 'forumQuestions', questionId as string, 'answers', answerId as string);
      const answerSnap = await getDoc(answerRef);
      
      if (answerSnap.exists() && answerSnap.data().user && answerSnap.data().user.id) {
        const answerUserId = answerSnap.data().user.id;
        
        // Asegurar que tenemos un ID válido antes de crear la notificación
        if (answerUserId !== user.uid) {
          await createNotification({
            type: 'forum_answer_like',
            fromUserId: user.uid,
            fromUserName: userProfile?.name || user?.displayName || 'Usuario',
            fromUserPhoto: userProfile?.photo || '',
            toUserId: answerUserId, // Usar el ID recuperado explícitamente
            contentId: String(answerId),
            contentText: answer.content?.substring(0, 100) || '',
            relatedContentId: String(questionId)
          });
        }
      } else {
        console.error("No se encontró userId en la respuesta");
      }
    } catch (error) {
      console.error("Error al dar like a la respuesta:", error);
    }
  };

  const renderAvatar = (source: string) => {
    if (source && (source.startsWith('http') || source.startsWith('data:'))) {
      return { uri: source };
    }
    return require('../../assets/images/img7.jpg');
  };

  const renderComment = ({ item }: { item: ForumComment }) => (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <View style={styles.userInfo}>
          <Image source={renderAvatar(item.user.photo)} style={styles.avatar} />
          <View>
            <Text style={styles.userName}>{item.user.name}</Text>
            <Text style={styles.timestamp}>
              {item.timestamp?.toDate ? 
                new Date(item.timestamp.toDate()).toLocaleString() : 
                'Ahora'}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.commentContent}>{item.content}</Text>
      <View style={styles.commentFooter}>
        <TouchableOpacity style={styles.statButton}>
          <Ionicons name="heart-outline" size={18} color="#888" />
          <Text style={styles.statText}>{item.likes || 0}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (answerLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#bb86fc" />
        <Text style={styles.loadingText}>Cargando respuesta...</Text>
      </View>
    );
  }

  if (!answer) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={64} color="#e91e63" />
        <Text style={styles.errorText}>No se encontró la respuesta</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver a la pregunta</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.answerHeader}>
        <View style={styles.userInfo}>
          <Image source={renderAvatar(answer.user.photo)} style={styles.avatar} />
          <View>
            <Text style={styles.userName}>{answer.user.name}</Text>
            <Text style={styles.timestamp}>
              {answer.timestamp?.toDate ? 
                new Date(answer.timestamp.toDate()).toLocaleString() : 
                'Hace un momento'}
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.answerContent}>{answer.content}</Text>
      
      <View style={styles.answerFooter}>
        <TouchableOpacity 
          style={[styles.likeButton, isLiked && styles.likeButtonActive]} 
          onPress={toggleLike}
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={20} 
            color={isLiked ? "#bb86fc" : "#888"} 
          />
          <Text style={[styles.likeText, isLiked && styles.likeTextActive]}>
            {answer.likes || 0}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.commentsHeader}>
        <Text style={styles.commentsTitle}>Comentarios ({comments.length})</Text>
      </View>

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loader} color="#bb86fc" size="small" />
          ) : (
            <View style={styles.emptyComments}>
              <Text style={styles.emptyText}>Aún no hay comentarios</Text>
              <Text style={styles.emptySuggestion}>¡Sé el primero en comentar!</Text>
            </View>
          )
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un comentario..."
          placeholderTextColor="#888"
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]} 
          onPress={addComment}
          disabled={!newComment.trim()}
        >
          <Ionicons name="send" size={20} color={newComment.trim() ? '#fff' : '#888'} />
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
  answerHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1e1e1e'
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
    borderColor: '#bb86fc'
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 2
  },
  answerContent: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    padding: 16,
    backgroundColor: '#1e1e1e'
  },
  answerFooter: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1e1e1e'
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#333'
  },
  likeButtonActive: {
    backgroundColor: '#bb86fc20'
  },
  likeText: {
    color: '#888',
    marginLeft: 6,
    fontSize: 14
  },
  likeTextActive: {
    color: '#bb86fc'
  },
  commentsHeader: {
    padding: 16,
    backgroundColor: '#1e1e1e',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
  loader: {
    marginVertical: 20,
  },
  listContent: {
    padding: 16
  },
  commentCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  commentContent: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
    marginBottom: 8
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16
  },
  statText: {
    color: '#888',
    marginLeft: 4,
    fontSize: 14
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1a1a1a'
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
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#333'
  },
  emptyComments: {
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
