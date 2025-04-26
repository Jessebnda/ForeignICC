import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  Text
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { collection, getDocs, orderBy, query, deleteField, doc, updateDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase';
import 'react-native-reanimated';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { TextInput } from 'react-native';
import { Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { ScrollView } from 'react-native';

type Post = {
  id: string;
  image: string;
  content: string;
  user: {
    name: string;
    image: any;
  };
  likes: Record<string, boolean>;
  comments: any[];
};

const { width } = Dimensions.get('window');
const horizontalPadding = 16;
const sliderWidth = width - horizontalPadding * 4;


function WeeklyEventsSlider({ friendPosts }: { friendPosts: any[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();

  const onScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / sliderWidth);
    setActiveIndex(index);
  };

  //Amigos
    const goToAmigos = () => {
      router.push('/extra/AmigosScreen');
    };


  return (
    <View style={[styles.sliderWrapper, { paddingHorizontal: horizontalPadding }]}>
      <Text style={styles.sliderTitle}>Foreign</Text>
      
      <TouchableOpacity onPress={goToAmigos} style={styles.friendButton}>
              <Text style={styles.friendButtonText}>👥 Amigos</Text>
        </TouchableOpacity>
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
            //onPress={() => goToPublicationDetail(item)}
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


  useEffect(() => {
    const fetchCurrentUserData = async () => {
      const user = getAuth().currentUser;
      console.log('🔎 Intentando obtener usuario autenticado:', user);
  
      if (user) {
        setCurrentUserId(user.uid);
  
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        console.log('📄 Documento de usuario Firestore:', userDoc.exists() ? userDoc.data() : 'No existe');
  
        if (userDoc.exists()) {
          setCurrentUserData(userDoc.data());
        }
      } else {
        console.log('⚠️ No hay usuario autenticado.');
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
          await updateDoc(postRef, {
            [`likes.${currentUserId}`]: true,
          });
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
        
          return { ...prev, likes: updatedLikes };
        });
        setLiked(!liked);
        
      } catch (error) {
        console.error('❌ Error actualizando like:', error);
      }
    };

  const goToCreatePost = () => {
    router.push({ pathname: '/extra/crearpubli' });
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
        name: 'Tú',
        image: require('../../assets/images/img7.jpg'), // Reemplaza si tienes auth
      },
      likes: 0,
    };

    try {
      await addDoc(collection(firestore, 'feedPosts', selectedPost.id, 'comments'), comment);
      setComments((prev) => [comment, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('❌ Error guardando comentario:', error);
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
            source={item.user.image || require('../../assets/images/img7.jpg')}
            style={styles.postUserImage}
          />
          <Text style={styles.postUserName}>{item.user.name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  useFocusEffect(
    useCallback(() => {
      const fetchPosts = async () => {
        if (!currentUserData) return;
      
        try {
          
          const q = query(collection(firestore, 'feedPosts'), orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(q);
      
          const loadedPosts = await Promise.all(snapshot.docs.map(async (docPost) => {
            const data = docPost.data();
            const userId = data.userId;
      
            let userData = {
              university: undefined,
              photo: require('../../assets/images/img7.jpg'),
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
                      : require('../../assets/images/img7.jpg'),
                    name: userInfo.name || 'Usuario sin nombre',
                  };
                }
              } catch (error) {
                console.error(`❌ Error cargando usuario ${userId}:`, error);
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
              likes: data.likes ? Object.keys(data.likes).length : 0,
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
          
          console.log(friendFiltered);
      
          setFriendPosts(friendFiltered);
          setUniversityPosts(universityFiltered);
      
        } catch (error) {
          console.error('❌ Error al cargar publicaciones:', error);
        }
      };
      
      fetchPosts();
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
        ListHeaderComponent={<WeeklyEventsSlider friendPosts={friendPosts} />}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      />
      
        {selectedPost && (
  <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.detailOverlay}>
     <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    style={{ flex: 1 }}
  >
    <ScrollView contentContainerStyle={styles.detailScroll}>
    <View style={styles.imageWrapper}>
      <Image
        source={typeof selectedPost.image === 'string' ? { uri: selectedPost.image } : selectedPost.image}
        style={[styles.detailImage, liked && styles.likedImage]}
        resizeMode="cover"
      />

      <TouchableOpacity onPress={toggleLike} style={styles.likeOverlayButton}>
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={28}
          color={liked ? '#f77' : '#fff'}
        />
      </TouchableOpacity>
      <Text style={styles.actionText}>{likeCount}</Text>
    </View>

    <View style={styles.detailContent}>
      <Text style={styles.detailUser}>{selectedPost.user.name}</Text>
      <Text style={styles.detailCaption}>{selectedPost.content}</Text>

      {/* Comentarios */}
      <View style={{ width: '100%', marginTop: 16 }}>
        {comments.map((c, i) => (
          <View key={i} style={styles.commentBubble}>
            <Text style={styles.commentText}>🗨 {c.text}</Text>
          </View>
        ))}
        <View style={styles.commentInputRow}>
          <TextInput
            placeholder="Escribe un comentario..."
            placeholderTextColor="#888"
            value={newComment}
            onChangeText={setNewComment}
            style={styles.commentInput}
          />
          <TouchableOpacity onPress={handleAddComment} disabled={!newComment.trim()}>
          <Ionicons name="send" size={20} color={newComment.trim() ? '#bb86fc' : '#888'} />
        </TouchableOpacity>


        </View>
      </View>

      <TouchableOpacity onPress={() => setSelectedPost(null)} style={styles.closeButton}>
      <Ionicons name="arrow-back" size={24} color="#bb86fc" />
      <Text style={styles.closeDetail}>Cerrar</Text>
  </TouchableOpacity>
    </View>
    </ScrollView>
    </KeyboardAvoidingView>
  </Animated.View>
)}

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
    marginVertical: 12,
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  
  commentInput: {
    flex: 1,
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 8,
    color: '#fff',
    marginRight: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    alignSelf: 'flex-start',
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
  friendButton: {
    alignSelf: 'flex-end',
    marginRight: 20,
    marginTop: 5,
    backgroundColor: '#4f0c2e',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  friendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  
});
