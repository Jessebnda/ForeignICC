import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onGoogleLogin: () => void;
  onAnonymousLogin: () => Promise<void>;
  isLoading: boolean;
  googleEnabled: boolean;
}

export default function LoginForm({
  onLogin,
  onGoogleLogin,
  onAnonymousLogin,
  isLoading,
  googleEnabled
}: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = () => {
    if (!email.includes('@') || password.length < 6) {
      alert('Introduce un correo válido y una contraseña de al menos 6 caracteres.');
      return;
    }
    
    onLogin(email, password);
  };
  
  return (
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

      {isLoading ? (
        <ActivityIndicator size="large" color="#bb86fc" style={styles.loader} />
      ) : (
        <>
          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
            <Text style={styles.buttonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
          
          {googleEnabled && (
            <TouchableOpacity style={styles.googleButton} onPress={onGoogleLogin}>
              <Ionicons name="logo-google" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Continuar con Google</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.secondaryButton} onPress={onAnonymousLogin}>
            <Ionicons name="person-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Entrar como Invitado</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
    height: 48,
    color: '#fff',
    fontSize: 16,
    flex: 1,
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