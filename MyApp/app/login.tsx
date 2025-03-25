// login.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  signInWithEmailAndPassword, 
  signInAnonymously, 
  signInWithCredential,
  createUserWithEmailAndPassword,
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../firebase';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Ionicons } from '@expo/vector-icons';

// Cierra el flujo OAuth cuando regresas a la app
WebBrowser.maybeCompleteAuthSession();

// Ajusta estos IDs con los que obtuviste en Google Cloud Console
const WEB_CLIENT_ID = 'TU_WEB_CLIENT_ID.apps.googleusercontent.com';
const IOS_CLIENT_ID = '497729458678-oovq36fgcgdm6ho6unb5rql4gg30cupn.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = 'TU_ANDROID_CLIENT_ID.apps.googleusercontent.com';
const REDIRECT_URI = 'https://auth.expo.io/@jesse05/MyApp';

export default function LoginScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Configura la solicitud de autenticación para Google
  const [request, response, promptAsync] = Google.useAuthRequest({
    redirectUri: REDIRECT_URI,
    clientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  // Manejo de la respuesta de Google
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        setLoading(true);
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential)
          .then(() => {
            router.replace('./(tabs)/feed');
          })
          .catch((error) => {
            Alert.alert('Error en Google Login', error.message);
          })
          .finally(() => setLoading(false));
      }
    }
  }, [response]);

  // Login por correo
  const handleEmailLogin = async () => {
    if (!email.includes('@') || password.length < 6) {
      Alert.alert('Error', 'Introduce un correo válido y una contraseña de al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('./(tabs)/feed');
    } catch (error: any) {
      Alert.alert('Error en Login', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Login anónimo
  const handleAnonymousLogin = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
      router.replace('./(tabs)/feed');
    } catch (error: any) {
      Alert.alert('Error en Login Anónimo', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Login con Google
  const handleGoogleLogin = () => {
    promptAsync();
  };

  // Registro con email
  const handleSignUp = async () => {
    if (!email.includes('@')) {
      Alert.alert('Error', 'Introduce un correo electrónico válido');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert('¡Éxito!', 'Cuenta creada correctamente');
      router.replace('./(tabs)/feed');
    } catch (error: any) {
      Alert.alert('Error en Registro', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        
        <View style={styles.formCard}>
          {/* Cabecera de pestañas */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'login' && styles.activeTab]}
              onPress={() => setActiveTab('login')}
            >
              <Text 
                style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}
              >
                Iniciar Sesión
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'signup' && styles.activeTab]}
              onPress={() => setActiveTab('signup')}
            >
              <Text 
                style={[styles.tabText, activeTab === 'signup' && styles.activeTabText]}
              >
                Registrarse
              </Text>
            </TouchableOpacity>
          </View>

          {/* Formulario de Login */}
          {activeTab === 'login' ? (
            <View style={styles.formContent}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Correo electrónico"
                  placeholderTextColor="#888"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="#888"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {loading ? (
                <ActivityIndicator size="large" color="#bb86fc" style={styles.loader} />
              ) : (
                <>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleEmailLogin}>
                    <Text style={styles.buttonText}>Iniciar Sesión</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin} disabled={!request}>
                    <Ionicons name="logo-google" size={20} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Continuar con Google</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.secondaryButton} onPress={handleAnonymousLogin}>
                    <Ionicons name="person-outline" size={20} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Entrar como Invitado</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            /* Formulario de Registro */
            <View style={styles.formContent}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Correo electrónico"
                  placeholderTextColor="#888"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="#888"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor="#888"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              {loading ? (
                <ActivityIndicator size="large" color="#bb86fc" style={styles.loader} />
              ) : (
                <>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp}>
                    <Text style={styles.buttonText}>Crear Cuenta</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin} disabled={!request}>
                    <Ionicons name="logo-google" size={20} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Registrarse con Google</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
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
  formContent: {
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
    backgroundColor: '#2a2a2a',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#fff',
    fontSize: 16,
  },
  loader: {
    marginVertical: 20,
  },
  primaryButton: {
    backgroundColor: '#bb86fc',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#333',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 10,
  },
});
