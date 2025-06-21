import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  orderBy, 
  query, 
  serverTimestamp 
} from 'firebase/firestore';
import { firestore } from './firebase/config';
import { createNotification } from './notificationService';

// Constantes
const POSTS_COLLECTION = 'feedPosts';

// Interfaces
export interface Comment {
  id?: string;
  text: string;
  created_at: any;
  user: {
    id: string;
    name: string;
    image: any;
  };
}

// Obtener comentarios de una publicación
export const getPostComments = async (postId: string): Promise<Comment[]> => {
  try {
    const q = query(
      collection(firestore, POSTS_COLLECTION, postId, 'comments'),
      orderBy('created_at', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Comment));
  } catch (error) {
    console.error(`Error getting comments for post ${postId}:`, error);
    throw error;
  }
};

// Añadir un comentario a una publicación
export const addComment = async (
  postId: string, 
  comment: Omit<Comment, 'id' | 'created_at'>, 
  postOwnerId?: string
): Promise<string> => {
  try {
    const commentData = {
      ...comment,
      created_at: serverTimestamp()
    };
    
    const docRef = await addDoc(
      collection(firestore, POSTS_COLLECTION, postId, 'comments'), 
      commentData
    );
    
    // Crear notificación si el post no es del usuario que comenta
    if (postOwnerId && postOwnerId !== comment.user.id) {
      await createNotification({
        type: 'post_comment',
        fromUserId: comment.user.id,
        fromUserName: comment.user.name || 'Usuario',
        fromUserPhoto: typeof comment.user.image === 'string' 
          ? comment.user.image 
          : '',
        toUserId: postOwnerId,
        contentId: postId,
        contentText: comment.text.substring(0, 100)
      });
    }
    
    return docRef.id;
  } catch (error) {
    console.error(`Error adding comment to post ${postId}:`, error);
    throw error;
  }
};

// Eliminar un comentario
export const deleteComment = async (postId: string, commentId: string): Promise<void> => {
  try {
    await deleteDoc(doc(firestore, POSTS_COLLECTION, postId, 'comments', commentId));
  } catch (error) {
    console.error(`Error deleting comment ${commentId} from post ${postId}:`, error);
    throw error;
  }
};