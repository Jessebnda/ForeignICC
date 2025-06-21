import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import * as AuthService from '../services/firebase/auth';
import * as UserService from '../services/userService';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export interface AuthState {
  user: User | null;
  userProfile: UserService.UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, profileData: Partial<UserService.UserProfile>) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserService.UserProfile>) => Promise<void>;
}

export function useAuth(): [AuthState, AuthActions] {
  const [state, setState] = useState<AuthState>({
    user: null,
    userProfile: null,
    isLoading: true,
    isAdmin: false,
  });
  
  const router = useRouter();
  
  // Función para actualizar el estado con datos del usuario
  const refreshUserState = useCallback(async (user: User | null) => {
    if (!user) {
      setState({
        user: null,
        userProfile: null,
        isLoading: false,
        isAdmin: false,
      });
      return;
    }
    
    try {
      // Obtener perfil de usuario
      const userProfile = await UserService.getUserProfile(user.uid);
      
      setState({
        user,
        userProfile,
        isLoading: false,
        isAdmin: !!userProfile?.isAdmin,
      });
    } catch (error) {
      console.error('Error refreshing user state:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);
  
  // Suscribirse a cambios de autenticación
  useEffect(() => {
    const unsubscribe = AuthService.subscribeToAuthChanges(async (user) => {
      if (user) {
        await refreshUserState(user);
        
        // Redirigir basado en el tipo de usuario
        if (state.isAdmin) {
          router.replace('/(drawer)/(adminTabs)');
        } else if (!user.isAnonymous) {
          router.replace('/(drawer)/(tabs)/feed');
        }
      } else {
        setState(prev => ({ ...prev, user: null, userProfile: null, isLoading: false }));
      }
    });
    
    return () => unsubscribe();
  }, [refreshUserState, router, state.isAdmin]);
  
  // Acciones de autenticación
  const actions: AuthActions = {
    login: async (email: string, password: string) => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        const user = await AuthService.loginWithEmail(email, password);
        await refreshUserState(user);
      } catch (error: any) {
        Alert.alert('Error en Login', error.message);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    
    signup: async (email: string, password: string, profileData: Partial<UserService.UserProfile>) => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        const user = await AuthService.registerWithEmail(email, password, profileData.name);
        
        if (user) {
          // Crear perfil en Firestore
          await UserService.createOrUpdateUserProfile(user, profileData);
          
          // Si hay una imagen de perfil, actualizarla
          if (profileData.photo) {
            await AuthService.updateUserProfile(user, { photoURL: profileData.photo });
          }
          
          await refreshUserState(user);
        }
      } catch (error: any) {
        Alert.alert('Error en Registro', error.message);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    
    loginWithGoogle: async (idToken: string) => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        const user = await AuthService.signInWithGoogle(idToken);
        
        if (user) {
          // Asegurarse de que existe el perfil
          await UserService.createOrUpdateUserProfile(user);
          await refreshUserState(user);
        }
      } catch (error: any) {
        Alert.alert('Error en Login con Google', error.message);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    
    loginAnonymously: async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        await AuthService.signInAnonymously();
        // No necesitamos refreshUserState aquí, ya que el listener lo hará
      } catch (error: any) {
        Alert.alert('Error en Login Anónimo', error.message);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    
    logout: async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        await AuthService.logout();
        router.replace('/login');
      } catch (error: any) {
        Alert.alert('Error al cerrar sesión', error.message);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    
    updateProfile: async (data: Partial<UserService.UserProfile>) => {
      try {
        if (!state.user) throw new Error('No hay usuario autenticado');
        
        setState(prev => ({ ...prev, isLoading: true }));
        await UserService.createOrUpdateUserProfile(state.user, data);
        
        // Si hay una foto nueva, actualizar también en Auth
        if (data.photo) {
          await AuthService.updateUserProfile(state.user, { photoURL: data.photo });
        }
        
        await refreshUserState(state.user);
      } catch (error: any) {
        Alert.alert('Error al actualizar perfil', error.message);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
  };
  
  return [state, actions];
}