import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import ImagePicker from './ImagePicker';
import { UserProfile } from '../../services/userService';

interface SignupFormProps {
  onSignup: (email: string, password: string, profileData: Partial<UserProfile>) => Promise<void>;
  onGoogleSignup: () => void;
  isLoading: boolean;
  googleEnabled: boolean;
  universities: string[];
  interests: string[];
}

export default function SignupForm({
  onSignup,
  onGoogleSignup,
  isLoading,
  googleEnabled,
  universities,
  interests
}: SignupFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [origin, setOrigin] = useState('');
  const [university, setUniversity] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  
  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };
  
  const handleSignup = async () => {
    // Validaciones
    if (!email.includes('@')) {
      alert('Introduce un correo electrónico válido');
      return;
    }
    
    if (password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    
    if (!name.trim()) {
      alert('Por favor introduce tu nombre');
      return;
    }
    
    if (!university) {
      alert('Por favor selecciona tu universidad');
      return;
    }
    
    // Crear objeto de perfil
    const profileData: Partial<UserProfile> = {
      name,
      origin,
      university,
      interests: selectedInterests,
      photo: profileImageUri || undefined
    };
    
    // Llamar a la función de registro
    await onSignup(email, password, profileData);
  };
  
  return (
    <ScrollView contentContainerStyle={styles.formContent}>
      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Nombre completo"
          placeholderTextColor="#888"
          value={name}
          onChangeText={setName}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Ionicons name="location-outline" size={20} color="#888" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Lugar de origen"
          placeholderTextColor="#888"
          value={origin}
          onChangeText={setOrigin}
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Ionicons name="school-outline" size={20} color="#888" style={styles.inputIcon} />
        <Picker
          selectedValue={university}
          onValueChange={(itemValue) => setUniversity(itemValue)}
          style={styles.picker}
          dropdownIconColor="#888"
        >
          <Picker.Item label="Selecciona tu universidad" value="" enabled={false} />
          {universities.map((uni) => (
            <Picker.Item key={uni} label={uni} value={uni} />
          ))}
        </Picker>
      </View>
      
      <ImagePicker
        imageUri={profileImageUri}
        onImageSelected={setProfileImageUri}
        title="Foto de perfil:"
      />
      
      <Text style={styles.interestsLabel}>Intereses (selecciona al menos uno):</Text>
      <View style={styles.interestsContainer}>
        {interests.map(interest => (
          <TouchableOpacity 
            key={interest}
            style={[
              styles.interestChip,
              selectedInterests.includes(interest) && styles.interestChipSelected
            ]}
            onPress={() => toggleInterest(interest)}
          >
            <Text 
              style={[
                styles.interestChipText,
                selectedInterests.includes(interest) && styles.interestChipTextSelected
              ]}
            >
              {interest}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
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

      {isLoading ? (
        <ActivityIndicator size="large" color="#bb86fc" style={styles.loader} />
      ) : (
        <>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSignup}>
            <Text style={styles.buttonText}>Crear Cuenta</Text>
          </TouchableOpacity>
          
          {googleEnabled && (
            <TouchableOpacity style={styles.googleButton} onPress={onGoogleSignup}>
              <Ionicons name="logo-google" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Registrarse con Google</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </ScrollView>
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
  interestsLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  interestChip: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    margin: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  interestChipSelected: {
    backgroundColor: '#bb86fc',
    borderColor: '#bb86fc',
  },
  interestChipText: {
    color: '#fff',
    fontSize: 14,
  },
  interestChipTextSelected: {
    color: '#121212',
    fontWeight: 'bold',
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
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 10,
  },
  picker: {
    flex: 1,
    color: '#fff',
    height: 48,
  },
});