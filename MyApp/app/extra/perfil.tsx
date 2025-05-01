// El código base de tu AmigoProfileScreen ya está bastante completo.
// Lo que necesitas modificar es:
// 1. Obtener el uid del amigo desde la URL (como hiciste con perfil.tsx)
// 2. Cargar sus publicaciones, no las del usuario autenticado.
// 3. Quitar la lógica de edición de perfil.

import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc, collection, getDocs, query, orderBy, deleteDoc, updateDoc, addDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import { firestore } from '@/firebase';
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const defaultImage = require('@/assets/images/img7.jpg');

type Post = {
    id: string;
    image: string;
    content: string;
    user: {
      id: string;  // Añadir esta propiedad que estaba faltando
      name: string;
      image: any;
      university?: string;  // También incluir esta que usas más adelante
    };
    likeCount?: number;
    likes?: { [userId: string]: true };
    comments: any[];
  };

export default function AmigoProfileScreen() {
  const { uid } = useLocalSearchParams();
  const [userData, setUserData] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUserDataAndPosts = useCallback(async () => {
    if (!uid || typeof uid !== 'string') return;
    try {
      const userDoc = await getDoc(doc(firestore, 'users', uid));
      if (userDoc.exists()) setUserData(userDoc.data());

      const postsQuery = query(collection(firestore, 'feedPosts'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(postsQuery);
      const filtered = snapshot.docs
        .filter(doc => doc.data().userId === uid)
        .map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(filtered);
    } catch (error) {
      console.error('❌ Error al cargar perfil de amigo:', error);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchUserDataAndPosts();
  }, [fetchUserDataAndPosts]);

  const loadComments = async (postId: string) => {
    try {
      const q = query(
        collection(firestore, 'feedPosts', postId, 'comments'),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      const loadedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComments(loadedComments);
    } catch (error) {
      console.error('❌ Error al cargar comentarios:', error);
    }
  };

  useEffect(() => {
    if (selectedPost?.id) {
      setLoadingComments(true);
      loadComments(selectedPost.id).finally(() => setLoadingComments(false));
    }
  }, [selectedPost]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return;
    const comment = {
      text: newComment.trim(),
      created_at: serverTimestamp(),
      user: { name: 'Tú', image: defaultImage },
      likes: 0,
    };
    try {
      await addDoc(collection(firestore, 'feedPosts', selectedPost.id, 'comments'), comment);
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('❌ Error guardando comentario:', error);
    }
  };

  const toggleLike = async () => {
    if (!selectedPost || !currentUserId) return;
    const postRef = doc(firestore, 'feedPosts', selectedPost.id);
    try {
      if (liked) {
        await updateDoc(postRef, { [`likes.${currentUserId}`]: deleteField() });
      } else {
        await updateDoc(postRef, { [`likes.${currentUserId}`]: true });
      }
      setSelectedPost(prev => {
        if (!prev) return prev;
        const updatedLikes = { ...prev.likes };
        liked ? delete updatedLikes[currentUserId] : (updatedLikes[currentUserId] = true);
        return { ...prev, likes: updatedLikes, likeCount: Object.keys(updatedLikes).length };
      });
      setLiked(!liked);
    } catch (error) {
      console.error('❌ Error actualizando like:', error);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!selectedPost) return;
    try {
      await deleteDoc(doc(firestore, 'feedPosts', selectedPost.id, 'comments', commentId));
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('❌ Error al eliminar comentario:', error);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} />;

  return (
    <ScrollView style={{ backgroundColor: '#121212' }}>
      <View style={{ alignItems: 'center', padding: 20 }}>
        <Image
          source={userData?.photo ? { uri: userData.photo } : defaultImage}
          style={{ width: 100, height: 100, borderRadius: 50 }}
        />
        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 10 }}>{userData?.name}</Text>
        <Text style={{ color: 'gray' }}>{userData?.university}</Text>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          numColumns={3}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{ flex: 1 / 3, aspectRatio: 1, margin: 1 }}
              onPress={() => setSelectedPost(item)}
            >
              <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} />
            </TouchableOpacity>
          )}
          scrollEnabled={false}
        />
      </View>

      {selectedPost && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedPost}
          onRequestClose={() => setSelectedPost(null)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.97)' }}
          >
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <TouchableOpacity onPress={() => setSelectedPost(null)} style={{ position: 'absolute', top: 30, right: 20 }}>
                <Ionicons name="close-circle" size={32} color="#aaa" />
              </TouchableOpacity>
              <Image source={{ uri: selectedPost.image }} style={{ width: '100%', aspectRatio: 1, borderRadius: 10 }} />
              <Text style={{ color: '#bbb' }}>{selectedPost.likeCount} Me gusta</Text>

              {/* Comentarios */}
              <View style={{ marginTop: 20 }}>
                {loadingComments ? (
                  <ActivityIndicator color="#bb86fc" />
                ) : comments.length > 0 ? (
                  comments.map((comment) => (
                    <View key={comment.id} style={{ flexDirection: 'row', backgroundColor: '#bb86fc', borderRadius: 10, padding: 10, marginBottom: 8 }}>
                      <Image
                        source={comment.user?.image ? { uri: comment.user.image } : defaultImage}
                        style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: 'bold', color: '#333' }}>{comment.user?.name || 'Usuario'}</Text>
                        <Text style={{ color: '#333' }}>{comment.text}</Text>
                      </View>
                      {comment.user?.id === currentUserId && (
                        <TouchableOpacity
                          onPress={() => deleteComment(comment.id)}
                          style={{ paddingLeft: 6 }}
                        >
                          <Ionicons name="trash-outline" size={20} color="red" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={{ color: '#aaa' }}>No hay comentarios aún.</Text>
                )}
              </View>
            </ScrollView>

            {/* Input de comentario */}
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#121212', borderTopWidth: 1, borderTopColor: '#333' }}>
              <TextInput
                style={{ flex: 1, backgroundColor: '#2a2a2a', color: '#fff', borderRadius: 20, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 12 : 8 }}
                placeholder="Añadir un comentario..."
                placeholderTextColor="#888"
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity onPress={handleAddComment} disabled={!newComment.trim()}>
                <Ionicons name="send" size={24} color={newComment.trim() ? '#bb86fc' : '#888'} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </ScrollView>
  );
}

// --- Styles (Keep existing styles, ensure they match the structure) ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
    },
    loadingText: {
        color: '#fff',
        marginTop: 10,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 16,
        backgroundColor: '#1a1a1a',
        marginBottom: 16,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 12,
        borderWidth: 3,
        borderColor: '#bb86fc',
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    profileInfo: {
        fontSize: 16,
        color: '#aaa',
        marginBottom: 16,
    },
    editButton: {
        borderColor: '#bb86fc',
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 25,
    },
    editButtonText: {
        color: '#bb86fc',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    interestsContainer: {
        marginBottom: 24,
    },
    interestsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
    },
    interestChip: {
        backgroundColor: '#2a2a2a',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#bb86fc',
        marginRight: 8,
        marginBottom: 8,
    },
    interestText: {
        color: '#fff',
        fontSize: 13,
    },
    noDataText: {
        color: '#888',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 10,
        width: '100%',
        paddingHorizontal: 16,
    },
    postsContainer: {
        // Removed flex: 1 to let ScrollView handle height
        paddingBottom: 20,
    },
    gridItem: {
        flex: 1 / 3,
        aspectRatio: 1,
        padding: 1.5,
    },
    gridImage: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#333',
    },
    gridPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Modal Styles
    detailOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.97)',
    },
    detailScroll: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingHorizontal: 15,
    },
    closeButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        right: 15,
        zIndex: 10,
    },
    detailAuthor: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    detailAuthorImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#555',
    },
    detailAuthorName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    detailImage: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 8,
        marginBottom: 15,
        backgroundColor: '#222',
    },
    detailContent: {
        alignItems: 'center',
    },
    detailCaption: {
        color: '#eee',
        fontSize: 15,
        lineHeight: 21,
        marginBottom: 20,
    },
    detailActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    commentBubble: {
        backgroundColor: '#1e1e1e',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    commentUser: {
        color: '#aaa',
        fontWeight: 'bold',
        fontSize: 13,
        marginBottom: 4,
    },
    commentText: {
        color: '#eee',
        fontSize: 14,
    },
    commentInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#333',
        backgroundColor: '#121212',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    commentInput: {
        flex: 1,
        backgroundColor: '#2a2a2a',
        color: '#fff',
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        borderRadius: 20,
        marginRight: 10,
        fontSize: 15,
    },
    commentCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        backgroundColor: '#bb86fc',
        borderRadius: 12,
        padding: 10,
        gap: 8,
      },
      commentUserImage: {
        width: 32,
        height: 32,
        borderRadius: 16,
      },
      commentContent: {
        flex: 1,
        backgroundColor: '#bb86fc',
      },
      commentUserName: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#333',
      },
});