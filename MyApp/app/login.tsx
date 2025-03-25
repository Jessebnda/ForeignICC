// login.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  signInWithEmailAndPassword, 
  signInAnonymously, 
  signInWithCredential, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../firebase';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

// Cierra el flujo OAuth cuando regresas a la app
WebBrowser.maybeCompleteAuthSession();

// Ajusta estos IDs con los que obtuviste en Google Cloud Console
// Usa tu ID de cliente de tipo "Web" para clientId (cuando usas Expo Go).
const WEB_CLIENT_ID = 'TU_WEB_CLIENT_ID.apps.googleusercontent.com';
const IOS_CLIENT_ID = '497729458678-oovq36fgcgdm6ho6unb5rql4gg30cupn.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = 'TU_ANDROID_CLIENT_ID.apps.googleusercontent.com';

// Genera manualmente la URL de redirección con tu usuario y slug
// Por ejemplo: https://auth.expo.io/@jesse05/MyApp
const REDIRECT_URI = 'https://auth.expo.io/@jesse05/MyApp';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Configura la solicitud de autenticación para Google
  const [request, response, promptAsync] = Google.useAuthRequest({
    redirectUri: REDIRECT_URI, // URI manual
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
      Alert.alert('Error en Email Login', error.message);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {loading ? (
        <ActivityIndicator size="large" color="#6200ee" />
      ) : (
        <>
          <Button title="Ingresar (Email)" color="#6200ee" onPress={handleEmailLogin} />
          <View style={{ marginVertical: 8 }} />
          <Button title="Ingresar Anónimo" color="#6200ee" onPress={handleAnonymousLogin} />
          <View style={{ marginVertical: 8 }} />
          <Button 
            title="Ingresar con Google" 
            color="#6200ee" 
            onPress={handleGoogleLogin} 
            disabled={!request} 
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 16 
  },
  title: { 
    fontSize: 28, 
    color: '#fff', 
    marginBottom: 20 
  },
  input: { 
    width: '100%', 
    height: 48, 
    borderWidth: 1, 
    borderColor: '#333', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    marginBottom: 16, 
    color: '#fff' 
  }
});
