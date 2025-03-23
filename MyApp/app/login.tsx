import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!email.includes('@') || password.length < 6) {
      Alert.alert('Error', 'Introduce un correo válido y una contraseña de al menos 6 caracteres.');
      return;
    }
    router.replace('./(tabs)/feed');
    
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
      <Button title="Ingresar" color="#6200ee" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', padding: 16 },
  title: { fontSize: 28, color: '#fff', marginBottom: 20, textAlign: 'center' },
  input: { height: 48, borderWidth: 1, borderColor: '#333', borderRadius: 8, paddingHorizontal: 12, marginBottom: 16, color: '#fff' },
});
