import { useState, useCallback, useEffect } from 'react';
import { 
  getPostsWithUserData, 
  getPostsByUniversity, 
  getPostsByFriends,
  togglePostLike,
  deletePost
} from '../services/postService';
import { Post } from '../services/postService';

export function usePosts(currentUser: any) {
  const [universityPosts, setUniversityPosts] = useState<Post[]>([]);
  const [friendPosts, setFriendPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  // Actualizar estado de "isLiked" cuando cambia el post seleccionado
  useEffect(() => {
    if (selectedPost && currentUser?.uid) {
      setIsLiked(!!selectedPost.likes?.[currentUser.uid]);
    }
  }, [selectedPost, currentUser]);

  // Cargar publicaciones
  const fetchPosts = useCallback(async () => {
    if (!currentUser) return;

    try {
      // Obtener todas las publicaciones con datos de usuario
      const allPosts = await getPostsWithUserData();
      
      // Filtrar por universidad
      const myUniversity = currentUser.university;
      if (myUniversity) {
        const filtered = allPosts.filter(post => 
          post.user?.university === myUniversity
        );
        setUniversityPosts(filtered);
      }
      
      // Filtrar por amigos
      const friendIds = currentUser.friends || [];
      if (friendIds.length) {
        const filtered = allPosts.filter(post => 
          friendIds.includes(post.userId)
        );
        setFriendPosts(filtered);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }, [currentUser]);

  // Refrescar publicaciones
  const refreshPosts = async () => {
    setRefreshing(true);
    await fetchPosts();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Manejar like
  const handleToggleLike = async () => {
    if (!selectedPost || !currentUser?.uid) return;

    try {
      await togglePostLike(
        selectedPost.id, 
        currentUser.uid, 
        isLiked,
        selectedPost.userId,
        currentUser
      );
      
      // Actualizar UI localmente
      setIsLiked(!isLiked);
      
      // Actualizar conteo de likes en UI
      setSelectedPost(prev => {
        if (!prev) return prev;
        
        const updatedLikes = { ...prev.likes };
        
        if (isLiked) {
          delete updatedLikes[currentUser.uid];
        } else {
          updatedLikes[currentUser.uid] = true;
        }
        
        return { 
          ...prev, 
          likes: updatedLikes, 
          likeCount: Object.keys(updatedLikes).length 
        };
      });
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Eliminar publicación
  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      setSelectedPost(null);
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  return {
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
  };
}