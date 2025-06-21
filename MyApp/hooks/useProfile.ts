import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { UserProfile } from '../services/userService';
import { 
  getUserProfileById, 
  updateUserProfile, 
  updateProfilePhoto,
  getUserPosts,
  checkFriendshipStatus,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  FollowStatus
} from '../services/profileService';

export function useProfile(userId: string, currentUserId: string | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [friendStatus, setFriendStatus] = useState<FollowStatus>({
    isFriend: false,
    isPending: false,
    isRequested: false
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  
  const isOwnProfile = userId === currentUserId;
  
  // Cargar perfil
  const loadProfile = useCallback(async () => {
    try {
      const userProfile = await getUserProfileById(userId);
      setProfile(userProfile);
      
      // Si no es el propio perfil, comprobar estado de amistad
      if (currentUserId && userId !== currentUserId) {
        const status = await checkFriendshipStatus(currentUserId, userId);
        setFriendStatus(status);
      }
      
      // Cargar publicaciones
      const userPosts = await getUserPosts(userId);
      setPosts(userPosts);
    } catch (error) {
      console.error('Error cargando perfil:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil del usuario');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, currentUserId]);
  
  // Cargar datos iniciales
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);
  
  // Refrescar perfil
  const refreshProfile = () => {
    setRefreshing(true);
    loadProfile();
  };
  
  // Actualizar perfil
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUserId || !isOwnProfile) return;
    
    try {
      await updateUserProfile(currentUserId, updates);
      setProfile(prev => prev ? { ...prev, ...updates } : prev);
      setEditing(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    }
  };
  
  // Actualizar foto de perfil
  const updatePhoto = async (imageUri: string) => {
    if (!currentUserId || !isOwnProfile) return;
    
    try {
      const photoURL = await updateProfilePhoto(currentUserId, imageUri);
      setProfile(prev => prev ? { ...prev, photo: photoURL } : prev);
      Alert.alert('Éxito', 'Foto de perfil actualizada');
    } catch (error) {
      console.error('Error actualizando foto:', error);
      Alert.alert('Error', 'No se pudo actualizar la foto de perfil');
    }
  };
  
  // Enviar solicitud de amistad
  const sendRequest = async () => {
    if (!currentUserId || isOwnProfile) return;
    
    try {
      await sendFriendRequest(currentUserId, userId);
      setFriendStatus(prev => ({ ...prev, isPending: true }));
      Alert.alert('Solicitud enviada', 'Se ha enviado una solicitud de amistad');
    } catch (error) {
      console.error('Error enviando solicitud:', error);
      Alert.alert('Error', 'No se pudo enviar la solicitud de amistad');
    }
  };
  
  // Aceptar solicitud de amistad
  const acceptRequest = async () => {
    if (!currentUserId || isOwnProfile) return;
    
    try {
      await acceptFriendRequest(currentUserId, userId);
      setFriendStatus({
        isFriend: true,
        isPending: false,
        isRequested: false
      });
      Alert.alert('Solicitud aceptada', 'Ahora son amigos');
    } catch (error) {
      console.error('Error aceptando solicitud:', error);
      Alert.alert('Error', 'No se pudo aceptar la solicitud de amistad');
    }
  };
  
  // Rechazar solicitud de amistad
  const rejectRequest = async () => {
    if (!currentUserId || isOwnProfile) return;
    
    try {
      await rejectFriendRequest(currentUserId, userId);
      setFriendStatus(prev => ({ ...prev, isRequested: false }));
      Alert.alert('Solicitud rechazada');
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
      Alert.alert('Error', 'No se pudo rechazar la solicitud de amistad');
    }
  };
  
  // Eliminar amigo
  const removeFromFriends = async () => {
    if (!currentUserId || isOwnProfile) return;
    
    try {
      await removeFriend(currentUserId, userId);
      setFriendStatus({
        isFriend: false,
        isPending: false,
        isRequested: false
      });
      Alert.alert('Amigo eliminado', 'Ya no son amigos');
    } catch (error) {
      console.error('Error eliminando amigo:', error);
      Alert.alert('Error', 'No se pudo eliminar el amigo');
    }
  };
  
  return {
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
  };
}