import { 
    collection, addDoc, getDocs, query, where, 
    orderBy, doc, updateDoc, arrayUnion, arrayRemove, getDoc, serverTimestamp
  } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { firestore, storage } from '../firebase';
  import { Post } from '../models/Post';
  
  // Crear un post
  export const createPost = async (userId: string, content: string, image?: any) => {
    try {
      // Si hay imagen, subirla primero
      let imageUrl = '';
      if (image) {
        const response = await fetch(image);
        const blob = await response.blob();
        
        const imageName = `${userId}_${Date.now()}.jpg`;
        const storageRef = ref(storage, `posts/${imageName}`);
        
        await uploadBytes(storageRef, blob);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      // Obtener datos del usuario
      const userRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      // Crear post
      const postData = {
        userId,
        userName: userData?.name || 'Usuario',
        userPhoto: userData?.photo || '',
        content,
        imageUrl,
        likes: {},
        comments: [],
        createdAt: serverTimestamp()
      };
      
      const postRef = await addDoc(collection(firestore, 'feedPosts'), postData);
      
      // Actualizar referencia en el usuario
      await updateDoc(userRef, {
        posts: arrayUnion(postRef.id)
      });
      
      return { ...postData, id: postRef.id };
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  };
  
  // Obtener TODOS los posts (menos eficiente para perfil)
  export const getPosts = async (): Promise<Post[]> => { // Asegúrate que el tipo Post incluya userId
    try {
      const postsRef = collection(firestore, 'feedPosts');
      const q = query(postsRef, orderBy('createdAt', 'desc')); // Ordenar es opcional aquí
      const querySnapshot = await getDocs(q);
      
      // Mapeo simple, asumiendo que Post tiene userId
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[]; 
    } catch (error) {
      console.error('Error getting all posts:', error);
      throw error;
    }
  };
  
  // Obtener posts de un usuario
  export const getUserPosts = async (userId: string) => {
    try {
      const postsRef = collection(firestore, 'feedPosts');
      const q = query(
        postsRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
    } catch (error) {
      console.error('Error getting user posts:', error);
      throw error;
    }
  };