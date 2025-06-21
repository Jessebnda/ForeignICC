import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Text,
  SafeAreaView,
  RefreshControl,
  Platform,
  Dimensions
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../services/firebase/config';
import MaxWidthContainer from '../../../components/MaxWidthContainer';
import FriendsSlider from '../../../components/feed/FriendsSlider';
import PostDetailModal from '../../../components/feed/PostDetailModal';
import { usePosts } from '../../../hooks/usePosts';
import { useComments } from '../../../hooks/useComments';
import { Post } from '../../../services/postService';

const { width } = Dimensions.get('window');
const numColumns = Platform.OS === 'web' ? 4 : 2;

export default function FeedScreen() {
  const router = useRouter();
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Custom hooks para posts y comentarios
  const {
    universityPosts,
    friendPosts,
    refreshing,
    selectedPost,
    isLiked,
    setSelectedPost,
    fetchPosts,
    refreshPosts,
    handleToggleLike,
    handleDeletePost
  } = usePosts(currentUserData);

  const {
    comments,
    newComment,
    loading: loadingComments,
    setNewComment,
    handleAddComment
  } = useComments(selectedPost?.id || null, currentUserData);

  // Cargar datos del usuario actual
  useEffect(() => {
    const fetchCurrentUserData = async () => {
      const user = getAuth().currentUser;
  
      if (user) {
        setCurrentUserId(user.uid);
  
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
  
        if (userDoc.exists()) {
          setCurrentUserData({...userDoc.data(), uid: user.uid});
        }
      }
    };
  
    fetchCurrentUserData();
  }, []);

  // Manejar teclado
  useEffect(() => {
    const Keyboard = require('react-native').Keyboard;
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));
    
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Cargar posts cuando el componente obtiene foco
  useFocusEffect(
    useCallback(() => {
      if (currentUserData) {
        fetchPosts();
      }
    }, [currentUserData, fetchPosts])
  );

  // Ir al detalle del post
  const goToPostDetail = (post: Post) => {
    setSelectedPost(post);
  };

  // Cerrar modal
  const closeModal = () => {
    setSelectedPost(null);
  };

  // Ir a la pantalla de crear post
  const goToCreatePost = () => {
    router.push({ pathname: '/extra/createPost' });
  };

  // Renderizar cada post
  const renderPost = ({ item }: { item: Post }) => (
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
            source={item.user?.image || require('../../../assets/images/img7.jpg')}
            style={styles.postUserImage}
          />
          <Text style={styles.postUserName}>{item.user?.name || 'Usuario'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <MaxWidthContainer>
        <FlatList
          data={universityPosts}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          columnWrapperStyle={styles.postRow}
          renderItem={renderPost}
          ListHeaderComponent={
            <FriendsSlider 
              friendPosts={friendPosts} 
              onPressItem={goToPostDetail} 
            />
          }
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshPosts} />
          }
        />
  
        {/* Post Detail Modal */}
        <PostDetailModal
          post={selectedPost}
          isVisible={!!selectedPost}
          onClose={closeModal}
          onToggleLike={handleToggleLike}
          onDeletePost={handleDeletePost}
          isLiked={isLiked}
          comments={comments}
          newComment={newComment}
          setNewComment={setNewComment}
          onAddComment={() => handleAddComment(selectedPost?.userId)}
          loadingComments={loadingComments}
          currentUserId={currentUserId}
        />
  
        {/* FAB para crear post */}
        {!isKeyboardVisible && (
          <TouchableOpacity style={styles.fab} onPress={goToCreatePost}>
            <Text style={styles.fabText}>＋</Text>
          </TouchableOpacity>
        )}
      </MaxWidthContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212' 
  },
  contentContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'web' ? 80 : 16,
  },
  postRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  postCard: {
    flex: 1,
    margin: 8,
    maxWidth: Platform.OS === 'web' ? '23%' : '48%',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  postImage: { 
    width: '100%', 
    height: 140 
  },
  postOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  postUserInfo: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  postUserImage: { 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    marginRight: 6 
  },
  postUserName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fab: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
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
});