import { useState, useEffect } from 'react';
import {
  getPostComments,
  addComment,
  deleteComment,
  Comment
} from '../services/commentService';

export function useComments(postId: string | null, currentUser: any) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Cargar comentarios cuando cambia el post seleccionado
  useEffect(() => {
    if (postId) {
      loadComments();
    } else {
      setComments([]);
    }
  }, [postId]);

  // Cargar comentarios
  const loadComments = async () => {
    if (!postId) return;
    
    setLoading(true);
    try {
      const fetchedComments = await getPostComments(postId);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Añadir comentario
  const handleAddComment = async (postOwnerId?: string) => {
    if (!newComment.trim() || !postId || !currentUser?.uid) return;
    
    try {
      const commentData = {
        text: newComment.trim(),
        user: {
          id: currentUser.uid,
          name: currentUser.name || 'Usuario',
          image: currentUser.photo || require('../assets/images/img7.jpg')
        }
      };
      
      const commentId = await addComment(postId, commentData, postOwnerId);
      
      // Actualizar UI localmente
      setComments(prev => [{
        id: commentId,
        text: newComment.trim(),
        created_at: new Date(),
        user: commentData.user
      }, ...prev]);
      
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Eliminar comentario
  const handleDeleteComment = async (commentId: string) => {
    if (!postId) return;
    
    try {
      await deleteComment(postId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return {
    comments,
    newComment,
    loading,
    setNewComment,
    handleAddComment,
    handleDeleteComment
  };
}