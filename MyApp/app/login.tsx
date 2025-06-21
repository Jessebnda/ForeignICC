import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Ionicons } from '@expo/vector-icons';
import MaxWidthContainer from '../components/MaxWidthContainer';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';
import { GOOGLE_CONFIG } from '../services/firebase/auth';
import { useAuth } from '../hooks/useAuth';
import { uploadProfileImage } from '../services/imageService';
import { UserProfile } from '../services/userService';

// Cierra el flujo OAuth cuando regresas a la app
WebBrowser.maybeCompleteAuthSession();

// Universidades disponibles
const UNIVERSITIES = ['CETYS', 'UNAM', 'ITESM', 'UABC', 'IPN', 'Otra'];

// Intereses disponibles
const INTERESTS = ['deportes', 'gimnasio', 'programación', 'música', 'arte', 'viajes'];

export default function LoginScreen() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' o 'signup'
  const [authState, authActions] = useAuth();
  const router = useRouter();
  
  // Config para Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    redirectUri: GOOGLE_CONFIG.redirectUri,
    clientId: GOOGLE_CONFIG.webClientId,
    iosClientId: GOOGLE_CONFIG.iosClientId,
    androidClientId: GOOGLE_CONFIG.androidClientId,
    scopes: ['profile', 'email'],
  });
  
  // Manejar respuesta de Google Auth
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        authActions.loginWithGoogle(id_token);
      }
    }
  }, [response]);
  
  // Manejo de inicio de sesión con email
  const handleEmailLogin = async (email: string, password: string) => {
    await authActions.login(email, password);
  };
  
  // Manejo de inicio de sesión anónimo
  const handleAnonymousLogin = async () => {
    await authActions.loginAnonymously();
  };
  
  // Manejo de inicio de sesión con Google
  const handleGoogleLogin = () => {
    promptAsync();
  };
  
  // Manejo de registro
  const handleSignup = async (
    email: string, 
    password: string, 
    profileData: Partial<UserProfile>
  ) => {
    try {
      // Si hay imagen, subirla primero
      if (profileData.photo) {
        // Crear un ID temporal para la imagen
        const tempId = Date.now().toString();
        const photoURL = await uploadProfileImage(profileData.photo, tempId);
        profileData.photo = photoURL;
      }
      
      // Registrar usuario
      await authActions.signup(email, password, profileData);
    } catch (error) {
      console.error('Error en registro:', error);
    }
  };
  
  if (authState.isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#bb86fc" />
        <Text style={styles.loaderText}>Cargando...</Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <MaxWidthContainer style={styles.maxWidthContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.contentWrapper}>
            <View style={styles.logoContainer}>
              <Image source={require('../assets/images/logo.png.jpeg')} style={styles.logo} />
              <Text style={styles.appName}>Foreign</Text>
            </View>
            
            <View style={styles.formCard}>
              <View style={styles.tabContainer}>
                <TouchableOpacity 
                  style={[styles.tab, activeTab === 'login' && styles.activeTab]}
                  onPress={() => setActiveTab('login')}
                >
                  <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>
                    Iniciar Sesión
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
                  onPress={() => setActiveTab('signup')}
                >
                  <Text style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}>
                    Registrarse
                  </Text>
                </TouchableOpacity>
              </View>

              {activeTab === 'login' ? (
                <LoginForm 
                  onLogin={handleEmailLogin}
                  onGoogleLogin={handleGoogleLogin}
                  onAnonymousLogin={handleAnonymousLogin}
                  isLoading={authState.isLoading}
                  googleEnabled={!!request}
                />
              ) : (
                <SignupForm 
                  onSignup={handleSignup}
                  onGoogleSignup={handleGoogleLogin}
                  isLoading={authState.isLoading}
                  googleEnabled={!!request}
                  universities={UNIVERSITIES}
                  interests={INTERESTS}
                />
              )}
            </View>
          </View>
        </ScrollView>
      </MaxWidthContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212',
  },
  maxWidthContainer: {
    backgroundColor: '#121212',
  },
  scrollContent: {
  flexGrow: 1,
  ...(Platform.OS === 'web' ? { minHeight: 600 } : {}), // número en vez de string
},
  contentWrapper: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loaderText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#bb86fc',
  },
  formCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    margin: Platform.OS === 'web' ? 20 : 0,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#bb86fc',
  },
  tabText: {
    color: '#888',
    fontSize: 16,
  },
  activeTabText: {
    color: '#bb86fc',
    fontWeight: 'bold',
  },
});