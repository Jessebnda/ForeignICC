import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  signInWithCredential,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from './config';
import Constants from 'expo-constants';

// Estas credenciales deberían estar en variables de entorno
export const GOOGLE_CONFIG = {
  webClientId: Constants.expoConfig?.extra?.googleWebClientId || '',
  iosClientId: Constants.expoConfig?.extra?.googleIosClientId || '497729458678-oovq36fgcgdm6ho6unb5rql4gg30cupn.apps.googleusercontent.com',
  androidClientId: Constants.expoConfig?.extra?.googleAndroidClientId || '',
  redirectUri: Constants.expoConfig?.extra?.googleRedirectUri || 'https://auth.expo.io/@jesse05/MyApp'
};

// Iniciar sesión con correo electrónico y contraseña
export const loginWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Error en login con email:', error);
    throw new Error(error.message || 'Error al iniciar sesión');
  }
};

// Crear un nuevo usuario con correo electrónico y contraseña
export const registerWithEmail = async (
  email: string, 
  password: string, 
  displayName?: string
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Actualizar perfil si se proporciona un nombre
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    
    return userCredential.user;
  } catch (error: any) {
    console.error('Error en registro con email:', error);
    throw new Error(error.message || 'Error al registrar usuario');
  }
};

// Iniciar sesión anónimamente
export const signInAnonymously = async (): Promise<User> => {
  try {
    const userCredential = await firebaseSignInAnonymously(auth);
    return userCredential.user;
  } catch (error: any) {
    console.error('Error en login anónimo:', error);
    throw new Error(error.message || 'Error al iniciar sesión anónimamente');
  }
};

// Iniciar sesión con Google (usando el token)
export const signInWithGoogle = async (idToken: string): Promise<User> => {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential.user;
  } catch (error: any) {
    console.error('Error en login con Google:', error);
    throw new Error(error.message || 'Error al iniciar sesión con Google');
  }
};

// Cerrar sesión
export const logout = async (): Promise<void> => {
  try {
    await auth.signOut();
  } catch (error: any) {
    console.error('Error al cerrar sesión:', error);
    throw new Error(error.message || 'Error al cerrar sesión');
  }
};

// Comprobar estado de autenticación
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Escuchar cambios en el estado de autenticación
export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
): () => void => {
  return onAuthStateChanged(auth, callback);
};

// Restablecer contraseña
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Error al restablecer contraseña:', error);
    throw new Error(error.message || 'Error al restablecer contraseña');
  }
};

// Actualizar perfil del usuario
export const updateUserProfile = async (
  user: User,
  updates: { displayName?: string; photoURL?: string }
): Promise<void> => {
  try {
    await updateProfile(user, updates);
  } catch (error: any) {
    console.error('Error al actualizar perfil:', error);
    throw new Error(error.message || 'Error al actualizar perfil');
  }
};