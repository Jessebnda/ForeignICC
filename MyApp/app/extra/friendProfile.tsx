import React from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  ActivityIndicator, 
  Text,
  RefreshControl,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getAuth } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import MaxWidthContainer from '../../components/MaxWidthContainer';
import ProfileHeader from '../../components/profile/ProfileHeader';
import ProfilePostsGrid from '../../components/profile/ProfilePostsGrid';
import ProfileEditForm from '../../components/profile/ProfileEditForm';
import { useProfile } from '../../hooks/useProfile';
import PostDetailModal from '../../components/feed/PostDetailModal';
import { usePosts } from '../../hooks/usePosts';
import { useComments } from '../../hooks/useComments';
import { Post } from '../../services/postService';


export default function FriendProfile() {
  const { uid } = useLocalSearchParams();
  const router = useRouter();
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid || null;
  
  // Si no hay uid en params, usar el currentUserId
  const targetUserId = uid ? String(uid) : currentUserId || '';
  
  const {
    profile,
    posts,
    friendStatus,
    loading,
    refreshing,
    editing,
    isOwnProfile,
    setEditing,
    refreshProfile,
    updateProfile,
    updatePhoto,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFromFriends
  } = useProfile(targetUserId, currentUserId);

  // Usar el hook usePosts existente
  const {
    selectedPost,
    isLiked,
    setSelectedPost,
    handleToggleLike,
    handleDeletePost
  } = usePosts(profile);
  
  // Usar el hook useComments existente
  const {
    comments,
    newComment,
    loading: loadingComments,
    setNewComment,
    handleAddComment
  } = useComments(selectedPost?.id || null, profile);

  const handleSelectProfilePhoto = async () => {
    if (!isOwnProfile) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        updatePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };
  
  const handleCreatePost = () => {
    router.push('/extra/createPost');
  };
  
  const handleViewPost = (post: Post) => {
  setSelectedPost(post as Post);
  };
  
  // Función para cerrar el modal
  const closeModal = () => {
    setSelectedPost(null);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#bb86fc" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <MaxWidthContainer>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshProfile} />
          }
        >
          {editing && profile ? (
            <ProfileEditForm 
              profile={profile}
              onSave={updateProfile}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              <ProfileHeader
                profile={profile}
                posts={posts}
                isOwnProfile={isOwnProfile}
                friendStatus={friendStatus}
                onEdit={() => setEditing(true)}
                onAddFriend={sendRequest}
                onAcceptRequest={acceptRequest}
                onRejectRequest={rejectRequest}
                onRemoveFriend={removeFromFriends}
                onSelectPhoto={handleSelectProfilePhoto}
              />
              
              <Text style={styles.sectionTitle}>Publicaciones</Text>
              
              <ProfilePostsGrid
                posts={posts}
                onPostPress={handleViewPost}
                onCreatePost={isOwnProfile ? handleCreatePost : undefined}
                isOwnProfile={isOwnProfile}
              />
            </>
          )}
        </ScrollView>
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
          currentUserId={currentUserId!}
        />
      </MaxWidthContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'web' ? 40 : 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
});