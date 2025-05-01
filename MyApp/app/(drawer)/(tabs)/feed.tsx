import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Text,
  Alert
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { collection, getDocs, orderBy, query, deleteField, doc, addDoc, serverTimestamp, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import 'react-native-reanimated';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { TextInput } from 'react-native';
import { Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { ScrollView } from 'react-native';
import { RefreshControl } from 'react-native';
import EditItem from '../(adminTabs)/editItem';
import { createNotification } from '../../../services/notificationService';


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

type WeeklyEventsSliderProps = {
  friendPosts: any[];
  onPressItem: (item: any) => void;
};

const { width } = Dimensions.get('window');
const horizontalPadding = 16;
const sliderWidth = width - horizontalPadding * 4;


function WeeklyEventsSlider({ friendPosts, onPressItem }: WeeklyEventsSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();

  const onScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / sliderWidth);
    setActiveIndex(index);
  };


  return (
    <View style={[styles.sliderWrapper, { paddingHorizontal: horizontalPadding }]}>
      <Text style={styles.sliderTitle}></Text>
      
      <FlatList
        data={friendPosts}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        snapToInterval={sliderWidth}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onPressItem(item)}
            style={{ width: sliderWidth }}
          >

            <View style={[styles.roundedContainer, { width: sliderWidth }]}>
              <Image
                source={
                  typeof item.image === 'string'
                    ? { uri: item.image } 
                    : item.image
                }
                style={[styles.sliderImage, { width: sliderWidth, height: sliderWidth * 0.7 }]}
                resizeMode="cover"
              />
              <View style={styles.sliderOverlay}>
                <Image source={item.user.image} style={styles.publisherImage} />
                <Text style={styles.publisherName}>{item.user.name}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      <View style={styles.pagination}>
        {friendPosts.map((_, index) => (
          <View key={index} style={[styles.dot, activeIndex === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [liked, setLiked] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const likeCount = selectedPost?.likes ? Object.keys(selectedPost.likes).length : 0;
  const [friendPosts, setFriendPosts] = useState<any[]>([]);
  const [universityPosts, setUniversityPosts] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);


  const closeModal = () => {
    setSelectedPost(null);
    fetchPosts();
};

  useEffect(() => {
    const fetchCurrentUserData = async () => {
      const user = getAuth().currentUser;
  
      if (user) {
        setCurrentUserId(user.uid);
  
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
  
        if (userDoc.exists()) {
          setCurrentUserData(userDoc.data());
        }
      } else {
      }
    };
  
    fetchCurrentUserData();
  }, []);
  

    useEffect(() => {
      const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
      const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }, []);

    const fetchPosts = async () => {
      if (!currentUserData) return;
    
      try {
        
        const q = query(collection(firestore, 'feedPosts'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
    
        const loadedPosts = await Promise.all(snapshot.docs.map(async (docPost) => {
          const data = docPost.data();
          const likesMap = data.likes || {};
          const userId = data.userId;
    
          let userData = {
            university: undefined,
            photo: require('../../../assets/images/img7.jpg'),
            name: 'Usuario sin nombre',
          };
    
          if (userId) {
            try {
              const userDoc = await getDoc(doc(firestore, 'users', userId));
              if (userDoc.exists()) {
                const userInfo = userDoc.data();
                userData = {
                  university: userInfo.university || undefined,
                  photo: userInfo.photo 
                    ? (userInfo.photo.startsWith('data:') 
                        ? { uri: userInfo.photo }
                        : { uri: userInfo.photo })
                    : require('../../../assets/images/img7.jpg'),
                  name: userInfo.name || 'Usuario sin nombre',
                };
              }
            } catch (error) {
            }
          }
    
          return {
            id: docPost.id,
            image: data.image,
            user: {
              id: userId,
              name: userData.name,
              image: userData.photo,
              university: userData.university,
            },
            content: data.caption,
            likes: likesMap,
            likeCount: Object.keys(likesMap).length,
            comments: data.comments || [],
          };
        }));

        const friendsIds = currentUserData.friends || [];
        const myUniversity = currentUserData.university;
    
        const friendFiltered = loadedPosts.filter((post) => 
          friendsIds.includes(post.user.id)
        );
    
        const universityFiltered = loadedPosts.filter((post) => 
          post.user.university === myUniversity
        );
        
    
        setFriendPosts(friendFiltered);
        setUniversityPosts(universityFiltered);
    
      } catch (error) {
        console.error('❌ Error al cargar publicaciones:', error);
      }
    };

    const onRefresh = async () => {
      setRefreshing(true);
    
      try {
        await fetchPosts();  // 🔥 Ya puedes usarlo aquí
      } catch (error) {
        console.error('Error al refrescar feed:', error);
      } finally {
        setTimeout(() => {
          setRefreshing(false);
        }, 1000);
      }
    };    

    //likes
    const toggleLike = async () => {
      if (!selectedPost || !currentUserId) return;
    
      const postRef = doc(firestore, 'feedPosts', selectedPost.id);
    
      try {
        if (liked) {
          await updateDoc(postRef, {
            [`likes.${currentUserId}`]: deleteField(),
          });
        } else {
          // Añadir like
          await updateDoc(postRef, {
            [`likes.${currentUserId}`]: true,
          });
          
          // Crear notificación de like - AÑADIR ESTE BLOQUE
          if (selectedPost.user.id !== currentUserId) {
            try {
              await createNotification({
                type: 'post_like',
                fromUserId: currentUserId,
                fromUserName: currentUserData?.name || 'Usuario',
                fromUserPhoto: currentUserData?.photo || '',
                toUserId: selectedPost.user.id,
                contentId: selectedPost.id,
                contentText: selectedPost.content?.substring(0, 100) || ''
              });
            } catch (err) {
              console.error('Error al crear notificación de like:', err);
            }
          }
        }
        
        // Actualiza UI local
        setSelectedPost((prev) => {
          if (!prev) return prev;
        
          const updatedLikes = { ...prev.likes };
        
          if (liked) {
            delete updatedLikes[currentUserId];
          } else {
            updatedLikes[currentUserId] = true;
          }
        
          return { ...prev, likes: updatedLikes, likeCount: Object.keys(updatedLikes).length, };
        });
        setLiked(!liked);
        
      } catch (error) {
        console.error('❌ Error actualizando like:', error);
      }
    };

    useEffect(() => {
      if (selectedPost && currentUserId) {
        setLiked(!!selectedPost.likes?.[currentUserId]);
      }
    }, [selectedPost, currentUserId]);

  const goToCreatePost = () => {
    router.push({ pathname: '/extra/crearpubli' });
  };

  const deletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(firestore, 'feedPosts', postId));
      setSelectedPost(null); // cerrar modal
      fetchPosts(); // recargar feed
    } catch (error) {
      console.error('❌ Error al eliminar post:', error);
    }
  };
  
  const goToPostDetail = async (item: any) => {
  setSelectedPost(item);
  await loadComments(item.id);
  setLiked(!!item.likes?.[currentUserId]); 
};

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost) return;

    const comment = {
      text: newComment.trim(),
      created_at: serverTimestamp(),
      user: {
        id: currentUserId, // NECESARIO
        name: currentUserData?.name || 'Tú',
        image: currentUserData?.photo || require('../../../assets/images/img7.jpg'),
      },
    };

    try {
      await addDoc(collection(firestore, 'feedPosts', selectedPost.id, 'comments'), comment);
      setComments((prev) => [comment, ...prev]);
      setNewComment('');
      
      // Crear notificación de comentario - AÑADIR ESTE BLOQUE
      if (selectedPost.user.id !== currentUserId) {
        try {
          // Importar al inicio del archivo si no está: import { createNotification } from '../../../services/notificationService';
          await createNotification({
            type: 'post_comment',
            fromUserId: currentUserId,
            fromUserName: currentUserData?.name || 'Usuario',
            fromUserPhoto: currentUserData?.photo || '',
            toUserId: selectedPost.user.id,
            contentId: selectedPost.id,
            contentText: newComment.trim().substring(0, 100)
          });
        } catch (err) {
          console.error('Error al crear notificación de comentario:', err);
        }
      }
    } catch (error) {
      console.error('❌ Error guardando comentario:', error);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!selectedPost) return; 
  
    try {
      await deleteDoc(doc(firestore, 'feedPosts', selectedPost.id, 'comments', commentId));
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error('❌ Error al eliminar comentario:', error);
    }
  };
  
  const loadComments = async (postId: string) => {
    try {
      const q = query(
        collection(firestore, 'feedPosts', postId, 'comments'),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(q);
      const loadedComments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
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

  const renderPost = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.postCard} onPress={() => goToPostDetail(item)}>
      <Image
        source={
          typeof item.image === 'string'
             ? { uri: item.image } 
            : item.image
        }
        style={styles.postImage}
        resizeMode="cover"
      />
      <View style={styles.postOverlay}>
        <View style={styles.postUserInfo}>
          <Image
            source={item.user.image || require('../../../assets/images/img7.jpg')}
            style={styles.postUserImage}
          />
          <Text style={styles.postUserName}>{item.user.name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  useFocusEffect(
    useCallback(() => {
      if (currentUserData) {
        fetchPosts();
      }
    }, [currentUserData])
  );
  

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={universityPosts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.postRow}
        renderItem={renderPost}
        ListHeaderComponent={
          <WeeklyEventsSlider friendPosts={friendPosts} onPressItem={goToPostDetail} />
        }
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
  
      {/* Post Detail Modal */}
      {selectedPost && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedPost}
          onRequestClose={closeModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.detailOverlay}
          >
            <ScrollView style={styles.detailScroll}
            contentContainerStyle={{ paddingBottom: 80 }}
            >
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close-circle" size={32} color="#aaa" />
              </TouchableOpacity>
  
              {/* Author Info */}
              <TouchableOpacity
              onPress={() => {
                setSelectedPost(null);
                router.push(`/extra/perfil?uid=${selectedPost.user.id}`);
              }}
              style={styles.authorContainer}
            >
              <Image
                source={
                  selectedPost.user.image || require('../../../assets/images/img7.jpg')
                }
                style={styles.detailAuthorImage}
              />
              <Text style={styles.detailAuthorName}>{selectedPost.user.name}</Text>
            </TouchableOpacity>
  
              {/* Image */}
              {selectedPost.image && (
                <Image
                  source={{ uri: selectedPost.image }}
                  style={styles.detailImage}
                />
              )}

              {selectedPost?.user.id === currentUserId && (
              <View style={{ width: '100%', alignItems: 'flex-end', marginTop: 8 }}>
            <TouchableOpacity onPress={() => deletePost(selectedPost.id)}>
              <Ionicons name="trash-outline" size={24} color="red" />
            </TouchableOpacity>
            </View>
          )}
  
              {/* Content/Caption */}
              <View style={styles.detailContent}>
                <Text style={styles.detailCaption}>{selectedPost.content}</Text>
  
                {/* Like Button */}
                <View style={{ width: '100%', marginTop: 16, alignItems: 'flex-start' }}>
                <TouchableOpacity onPress={toggleLike} style={styles.likeButton}>
                    <Ionicons
                      name={liked ? "heart" : "heart-outline"}
                      size={28}
                      color={liked ? "#e91e63" : "#fff"}
                    />
                  </TouchableOpacity>
                </View>

            <Text style={styles.actionText}>{selectedPost.likeCount} Me gusta</Text>
            
          <View style={{ width: '100%', marginTop: 16 }}>
          {loadingComments ? (
            <ActivityIndicator color="#bb86fc" />
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <View key={comment.id} style={styles.commentCard}>
                <Image
                  source={
                    comment.user?.image
                      ? typeof comment.user.image === 'string'
                        ? { uri: comment.user.image }
                        : comment.user.image
                      : require('../../../assets/images/img7.jpg')
                  }
                  style={styles.commentUserImage}
                />
                <View style={styles.commentContent}>
                  <Text style={styles.commentUserName}>{comment.user?.name || 'Usuario'}</Text>
                  <Text style={styles.commentText}> {comment.text}</Text>
                </View>

                {comment.user?.id === currentUserId && (
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        'Eliminar comentario',
                        '¿Quieres eliminar este comentario?',
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          {
                            text: 'Eliminar',
                            style: 'destructive',
                            onPress: () => deleteComment(comment.id),
                          },
                        ]
                      )
                    }
                    style={{ padding: 4, marginLeft: 4 }}
                  >
                    <Ionicons name="trash-outline" size={20} color="red" />
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No hay comentarios aún.</Text>
          )}
        </View>
        </View>
        </ScrollView>
  
            {/* Comment Input */}
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Añadir un comentario..."
                placeholderTextColor="#888"
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity onPress={handleAddComment} disabled={!newComment.trim()}>
                <Ionicons name="send" size={24} color={newComment.trim() ? "#bb86fc" : "#888"} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
        
        )}
  
      {/* crear post bton */}
      {!isKeyboardVisible && (
        <TouchableOpacity style={styles.fab} onPress={goToCreatePost}>
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>
      )}
    </View>
    
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  contentContainer: { padding: 16 },

  // Slider
  sliderWrapper: { marginBottom: 24 },
  sliderTitle: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  roundedContainer: { borderRadius: 20, overflow: 'hidden' },
  sliderImage: { height: width * 0.7 },
  sliderOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  publisherImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#fff',
    marginRight: 8,
  },
  publisherName: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  pagination: { flexDirection: 'row', alignSelf: 'center', marginTop: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'gray',
    marginHorizontal: 4,
  },
  dotActive: { backgroundColor: '#bb86fc', width: 10, height: 10 },

  // Grid de posts
  postRow: { justifyContent: 'space-between', marginBottom: 16 },
  postCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1e1e1e',
    marginBottom: 16,
    elevation: 2,
  },
  postImage: { width: '100%', height: 140 },
  postOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  postUserInfo: { flexDirection: 'row', alignItems: 'center' },
  postUserImage: { width: 20, height: 20, borderRadius: 10, marginRight: 6 },
  postUserName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  postUserUniversity: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: 'normal',
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#4f0c2e',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  fabText: {
    color: 'white',
    fontSize: 32,
    lineHeight: 34,
  },
  detailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    padding: 20,
    justifyContent: 'center',
  },
  detailImage: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    marginBottom: 16,
  },
  detailContent: {
    alignItems: 'center',
  },
  detailUser: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  detailCaption: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    alignSelf: 'flex-start', // 👈 Esto alinea a la izquierda
    textAlign: 'left',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
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
  sendButton: {
    color: '#bb86fc',
    fontWeight: 'bold',
  },
  likedImage: {
    borderWidth: 2,
    borderColor: '#f77',
  },
  commentBubble: {
    backgroundColor: '#1e1e1e',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  commentText: {
    color: '#fff',
    fontSize: 14,
  },  
  likeCount: {
    color: '#fff',
    fontSize: 14,
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    marginBottom: 16,
  },
  likeOverlayButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 20,
  }, 
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 15,
    zIndex: 10,
},
  closeDetail: {
    color: '#bb86fc',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  actionText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  detailScroll: {
    paddingBottom: 80,
  } ,
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
detailActions: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 20,
},
sectionTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#fff',
  marginBottom: 12,
  paddingHorizontal: 16,
},
commentUser: {
  color: '#eee',
  fontWeight: 'bold',
  fontSize: 13,
  marginBottom: 4,
},
noDataText: {
  color: '#888',
  fontStyle: 'italic',
  textAlign: 'center',
  marginTop: 10,
  width: '100%',
  paddingHorizontal: 16,
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
authorContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10, // si usas React Native >= 0.71
  marginBottom: 12,
},
});
