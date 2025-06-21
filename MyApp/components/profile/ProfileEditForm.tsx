import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  ScrollView,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { UserProfile } from '../../services/userService';

// Universidades disponibles
const UNIVERSITIES = ['CETYS', 'UNAM', 'ITESM', 'UABC', 'IPN', 'Otra'];

// Intereses disponibles
const INTERESTS = ['deportes', 'gimnasio', 'programación', 'música', 'arte', 'viajes'];

interface ProfileEditFormProps {
  profile: UserProfile;
  onSave: (updates: Partial<UserProfile>) => void;
  onCancel: () => void;
}

export default function ProfileEditForm({ 
  profile, 
  onSave, 
  onCancel 
}: ProfileEditFormProps) {
  const [name, setName] = useState(profile.name || '');
  const [university, setUniversity] = useState(profile.university || '');
  const [origin, setOrigin] = useState(profile.origin || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    profile.interests || []
  );
  
  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };
  
  const handleSave = () => {
    if (!name.trim()) {
      alert('Por favor introduce tu nombre');
      return;
    }
    
    onSave({
      name: name.trim(),
      university,
      origin: origin.trim(),
      interests: selectedInterests
    });
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Información personal</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nombre completo</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Tu nombre"
          placeholderTextColor="#888"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Lugar de origen</Text>
        <TextInput
          style={styles.input}
          value={origin}
          onChangeText={setOrigin}
          placeholder="¿De dónde eres?"
          placeholderTextColor="#888"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Universidad</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={university}
            onValueChange={(value) => setUniversity(value)}
            style={styles.picker}
            dropdownIconColor="#888"
          >
            <Picker.Item label="Selecciona tu universidad" value="" />
            {UNIVERSITIES.map((uni) => (
              <Picker.Item key={uni} label={uni} value={uni} />
            ))}
          </Picker>
        </View>
      </View>
      
      <Text style={styles.sectionTitle}>Intereses</Text>
      <View style={styles.interestsContainer}>
        {INTERESTS.map(interest => (
          <TouchableOpacity 
            key={interest}
            style={[
              styles.interestChip,
              selectedInterests.includes(interest) ? styles.interestChipSelected : null
            ]}
            onPress={() => toggleInterest(interest)}
          >
            <Text 
              style={[
                styles.interestChipText,
                selectedInterests.includes(interest) ? styles.interestChipTextSelected : null
              ]}
            >
              {interest}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton]} 
          onPress={onCancel}
        >
          <Text style={styles.buttonText}>Cancelar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.saveButton]} 
          onPress={handleSave}
        >
          <Text style={styles.buttonText}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#bb86fc',
    marginTop: 16,
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    color: '#fff',
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
    height: 50,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
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
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#333',
  },
  saveButton: {
    backgroundColor: '#bb86fc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});