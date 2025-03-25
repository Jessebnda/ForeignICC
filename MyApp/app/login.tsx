import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  signInWithEmailAndPassword, 
  signInAnonymously, 
  signInWithCredential, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../firebase'; // Ajusta la ruta a tu archivo de configuración de Firebase
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

// Completa el flujo de autenticación cuando regresas a la app
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Configura la solicitud de autenticación para Google
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: 'TU_EXPO_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: '497729458678-oovq36fgcgdm6ho6unb5rql4gg30cupn.apps.googleusercontent.com',
    androidClientId: 'TU_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    webClientId: 'TU_WEB_CLIENT_ID.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
  });

  // Cuando el usuario complete el flujo de autenticación con Google
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(() => {
          router.replace('./(tabs)/feed');
        })
        .catch(error => {
          Alert.alert('Error', error.message);
        });
    }
  }, [response]);

  // Login por correo
  const handleEmailLogin = async () => {
    if (!email.includes('@') || password.length < 6) {
      Alert.alert('Error', 'Introduce un correo válido y una contraseña de al menos 6 caracteres.');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('./(tabs)/feed');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // Login anónimo
  const handleAnonymousLogin = async () => {
    try {
      await signInAnonymously(auth);
      router.replace('./(tabs)/feed');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // Login con Google: inicia el flujo de autenticación
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
