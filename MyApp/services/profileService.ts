import { 
  doc,
  addDoc,
  writeBatch,
  getDoc, 
  updateDoc, 
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { firestore } from './firebase/config';
import { uploadProfileImage } from './imageService';
import { UserProfile } from './userService';

// Interfaces
export interface FollowStatus {
  isFriend: boolean;
  isPending: boolean;
  isRequested: boolean;
}

// Obtener perfil completo de usuario
export const getUserProfileById = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    
    if (userDoc.exists()) {
      return { uid: userDoc.id, ...userDoc.data() } as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error obteniendo perfil de usuario:', error);
    throw error;
  }
};

// Actualizar perfil de usuario
export const updateUserProfile = async (
  userId: string, 
  updates: Partial<UserProfile>
): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    
    // Eliminar propiedades que no deben actualizarse
    const { id, createdAt, ...validUpdates } = updates as any;
    
    await updateDoc(userRef, {
      ...validUpdates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error actualizando perfil de usuario:', error);
    throw error;
  }
};

// Actualizar foto de perfil
export const updateProfilePhoto = async (
  userId: string, 
  imageUri: string
): Promise<string> => {
  try {
    // Subir imagen
    const photoURL = await uploadProfileImage(imageUri, userId);
    
    // Actualizar perfil
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, { 
      photo: photoURL,
      updatedAt: serverTimestamp()
    });
    
    return photoURL;
  } catch (error) {
    console.error('Error actualizando foto de perfil:', error);
    throw error;
  }
};

// Obtener publicaciones del usuario
export const getUserPosts = async (userId: string): Promise<any[]> => {
  try {
    const postsQuery = query(
      collection(firestore, 'feedPosts'),
      where('userId', '==', userId)
    );
    
    const postsSnapshot = await getDocs(postsQuery);
    
    return postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error obteniendo publicaciones del usuario:', error);
    throw error;
  }
};

// Verificar estado de amistad
export const checkFriendshipStatus = async (
  currentUserId: string, 
  targetUserId: string
): Promise<FollowStatus> => {
  try {
    // Obtener usuario actual
    const currentUserDoc = await getDoc(doc(firestore, 'users', currentUserId));
    
    // Obtener usuario objetivo
    const targetUserDoc = await getDoc(doc(firestore, 'users', targetUserId));
    
    if (!currentUserDoc.exists() || !targetUserDoc.exists()) {
      throw new Error('Usuario no encontrado');
    }
    
    const currentUserData = currentUserDoc.data();
    const targetUserData = targetUserDoc.data();
    
    const friends = currentUserData.friends || [];
    const pendingRequests = currentUserData.pendingRequests || [];
    const friendRequests = targetUserData.friendRequests || [];
    
    return {
      isFriend: friends.includes(targetUserId),
      isPending: pendingRequests.includes(targetUserId),
      isRequested: friendRequests.includes(currentUserId)
    };
  } catch (error) {
    console.error('Error verificando estado de amistad:', error);
    throw error;
  }
};

// Enviar solicitud de amistad
export const sendFriendRequest = async (
  currentUserId: string, 
  targetUserId: string
): Promise<void> => {
  try {
    // Actualizar pendingRequests del usuario actual
    await updateDoc(doc(firestore, 'users', currentUserId), {
      pendingRequests: arrayUnion(targetUserId)
    });
    
    // Actualizar friendRequests del usuario objetivo
    await updateDoc(doc(firestore, 'users', targetUserId), {
      friendRequests: arrayUnion(currentUserId)
    });
    
    // Crear notificación
    await addDoc(collection(firestore, 'notifications'), {
      type: 'friend_request',
      fromUserId: currentUserId,
      toUserId: targetUserId,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error enviando solicitud de amistad:', error);
    throw error;
  }
};

// Aceptar solicitud de amistad
export const acceptFriendRequest = async (
  currentUserId: string, 
  requesterId: string
): Promise<void> => {
  try {
    // Batch update
    const batch = writeBatch(firestore);
    
    // Actualizar amigos del usuario actual
    const currentUserRef = doc(firestore, 'users', currentUserId);
    batch.update(currentUserRef, {
      friends: arrayUnion(requesterId),
      friendRequests: arrayRemove(requesterId)
    });
    
    // Actualizar amigos del solicitante
    const requesterRef = doc(firestore, 'users', requesterId);
    batch.update(requesterRef, {
      friends: arrayUnion(currentUserId),
      pendingRequests: arrayRemove(currentUserId)
    });
    
    await batch.commit();
    
    // Crear notificación
    await addDoc(collection(firestore, 'notifications'), {
      type: 'friend_accepted',
      fromUserId: currentUserId,
      toUserId: requesterId,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error aceptando solicitud de amistad:', error);
    throw error;
  }
};

export const getPendingFriendRequests = async (
  currentUserId: string
): Promise<UserProfile[]> => {
  try {
    if (!currentUserId) throw new Error('ID de usuario no proporcionado');

    const userDoc = await getDoc(doc(firestore, 'users', currentUserId));

    if (!userDoc.exists()) {
      throw new Error('Usuario no encontrado');
    }

    const userData = userDoc.data();
    const pendingRequests: string[] = userData.pendingRequests || [];

    const profiles: UserProfile[] = [];

    for (const requesterId of pendingRequests) {
      // Validar que el ID no esté vacío o mal formado
      if (typeof requesterId !== 'string' || requesterId.trim() === '') {
        console.warn('ID inválido en pendingRequests:', requesterId);
        continue;
      }

      const requesterDoc = await getDoc(doc(firestore, 'users', requesterId));

      if (requesterDoc.exists()) {
        profiles.push({
          uid: requesterDoc.id,
          ...requesterDoc.data()
        } as UserProfile);
      } else {
        console.warn('Usuario no encontrado para ID:', requesterId);
      }
    }

    return profiles;
  } catch (error) {
    console.error('Error obteniendo solicitudes de amistad pendientes:', error);
    throw error;
  }
};


// Eliminar amigo
export const removeFriend = async (
  currentUserId: string, 
  friendId: string
): Promise<void> => {
  try {
    // Batch update
    const batch = writeBatch(firestore);
    
    // Actualizar usuario actual
    const currentUserRef = doc(firestore, 'users', currentUserId);
    batch.update(currentUserRef, {
      friends: arrayRemove(friendId)
    });
    
    // Actualizar amigo
    const friendRef = doc(firestore, 'users', friendId);
    batch.update(friendRef, {
      friends: arrayRemove(currentUserId)
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error eliminando amigo:', error);
    throw error;
  }
};