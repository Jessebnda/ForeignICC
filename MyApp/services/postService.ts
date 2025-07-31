import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp as firestoreTimestamp,
  deleteField,
  where
} from 'firebase/firestore';
import { firestore } from './firebase/config';
import { uploadImageToFirebase } from './imageService';
import { createNotification } from './notificationService';

// Constantes
const POSTS_COLLECTION = 'feedPosts';

// Interfaces
export interface Post {
  id: string;
  image: string;
  caption?: string;
  createdAt: any;
  userId: string;
  user?: {
    id: string;
    university?: string;
  };
  likes?: { [userId: string]: boolean };
  likeCount?: number;
  comments?: any[];
  userName?: string;
  userPhoto?: string;
}

export interface PostInput {
  image: string;
  caption: string;
  userId: string;
}

// Obtener todas las publicaciones ordenadas por fecha
export const getAllPosts = async (): Promise<Post[]> => {
  try {
    const q = query(collection(firestore, POSTS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Post));
  } catch (error) {
    console.error('Error getting posts:', error);
    throw error;
  }
};

// Obtener publicaciones con datos de usuario
export const getPostsWithUserData = async (): Promise<any[]> => {
  try {
    const posts = await getAllPosts();
    
    // Obtener todos los userIds únicos
    const uniqueUserIds = [...new Set(posts.map(post => post.userId).filter(Boolean))];
    
    // Si no hay userIds, retornar posts como están
    if (uniqueUserIds.length === 0) {
      return posts.map(post => ({
        ...post,
        likes: post.likes || {},
        likeCount: post.likes ? Object.keys(post.likes).length : 0
      }));
    }
    
    // Obtener todos los usuarios en una sola consulta batch
    const userPromises = uniqueUserIds.map(userId => 
      getDoc(doc(firestore, 'users', userId))
    );
    
    const userDocs = await Promise.all(userPromises);
    
    // Crear un mapa de usuarios para acceso rápido
    const usersMap = new Map();
    userDocs.forEach((userDoc, index) => {
      if (userDoc.exists()) {
        usersMap.set(uniqueUserIds[index], userDoc.data());
      }
    });
    
    // Mapear posts con datos de usuario
    const postsWithUserData = posts.map(post => {
      if (!post.userId) {
        return {
          ...post,
          likes: post.likes || {},
          likeCount: post.likes ? Object.keys(post.likes).length : 0
        };
      }
      
      const userData = usersMap.get(post.userId);
      
      return {
        ...post,
        user: {
          id: post.userId,
          name: userData?.name || post.userName || 'Usuario sin nombre',
          image: userData?.photo 
            ? (typeof userData.photo === 'string'
              ? { uri: userData.photo }
              : userData.photo)
            : (post.userPhoto 
              ? { uri: post.userPhoto }
              : require('../assets/images/img7.jpg')),
          university: userData?.university || null
        },
        likes: post.likes || {},
        createdAt: post.createdAt || firestoreTimestamp(),
        likeCount: post.likes ? Object.keys(post.likes).length : 0
      };
    });
    
    return postsWithUserData;
  } catch (error) {
    console.error('Error in getPostsWithUserDataEfficient:', error);
    throw error;
  }
};

// Filtrar publicaciones por universidad
export const getPostsByUniversity = async (university: string): Promise<Post[]> => {
  try {
    const allPosts = await getPostsWithUserData();
    return allPosts.filter(post => post.user?.university === university);
  } catch (error) {
    console.error(`Error getting posts for university ${university}:`, error);
    throw error;
  }
};

// Filtrar publicaciones por amigos
export const getPostsByFriends = async (friendIds: string[]): Promise<Post[]> => {
  try {
    if (!friendIds.length) return [];
    
    const allPosts = await getPostsWithUserData();
    return allPosts.filter(post => friendIds.includes(post.userId));
  } catch (error) {
    console.error('Error getting friends posts:', error);
    throw error;
  }
};

// Crear una nueva publicación
export const createPost = async (postData: PostInput, imageUri: string): Promise<string> => {
  try {
    // Subir imagen a Firebase Storage
    const imageUrl = await uploadImageToFirebase(
      imageUri, 
      `feedPosts/${Date.now()}_${postData.userId}.jpg`,
      { width: 1200, quality: 0.8 }
    );
    
    // Crear post en Firestore
    const newPost = {
      image: imageUrl,
      caption: postData.caption,
      userId: postData.userId,
      createdAt: firestoreTimestamp(),
      likes: {}
    };
    
    const docRef = await addDoc(collection(firestore, POSTS_COLLECTION), newPost);
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

// Dar like a una publicación
export const togglePostLike = async (
  postId: string, 
  userId: string, 
  isLiked: boolean,
  postOwnerId?: string,
  currentUserData?: any
): Promise<void> => {
  try {
    const postRef = doc(firestore, POSTS_COLLECTION, postId);
    
    if (isLiked) {
      // Quitar like
      await updateDoc(postRef, {
        [`likes.${userId}`]: deleteField()
      });
    } else {
      // Añadir like
      await updateDoc(postRef, {
        [`likes.${userId}`]: true
      });
      
      // Crear notificación si el post no es del usuario que da like
      if (postOwnerId && postOwnerId !== userId && currentUserData) {
        await createNotification({
          type: 'post_like',
          fromUserId: userId,
          fromUserName: currentUserData.name || 'Usuario',
          fromUserPhoto: currentUserData.photo || '',
          toUserId: postOwnerId,
          contentId: postId,
          contentText: ''
        });
      }
    }
  } catch (error) {
    console.error(`Error toggling like for post ${postId}:`, error);
    throw error;
  }
};

// Eliminar una publicación
export const deletePost = async (postId: string): Promise<void> => {
  try {
    await deleteDoc(doc(firestore, POSTS_COLLECTION, postId));
  } catch (error) {
    console.error(`Error deleting post ${postId}:`, error);
    throw error;
  }
};