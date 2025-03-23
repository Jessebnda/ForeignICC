// app/(tabs)/edit-profile.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile: profileParam } = useLocalSearchParams();
  const initialProfile = profileParam ? JSON.parse(profileParam as string) : {};
  
  const [name, setName] = useState(initialProfile.name || '');
  const [origin, setOrigin] = useState(initialProfile.origin || '');
  const [profileImage, setProfileImage] = useState(initialProfile.profileImage || '');
  const [interests, setInterests] = useState<string[]>(initialProfile.interests || []);
  const [newInterest, setNewInterest] = useState('');

  const addInterest = () => {
    if (newInterest.trim()) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  const saveProfile = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.imageContainer}>
        <Image
          source={profileImage ? { uri: profileImage } : require('../../assets/images/img7.jpg')}
          style={styles.avatar}
        />
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Nombre de Usuario"
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        value={origin}
        onChangeText={setOrigin}
        placeholder="Origen"
        placeholderTextColor="#888"
      />
      <Text style={styles.label}>Intereses:</Text>
      <FlatList
        data={interests}
        keyExtractor={(_, i) => `interest-${i}`}
        renderItem={({ item }) => (
          <View style={styles.interestItem}>
            <Text style={styles.interestText}>{item}</Text>
            <TouchableOpacity onPress={() => removeInterest(item)}>
              <Text style={styles.removeText}>X</Text>
            </TouchableOpacity>
          </View>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ marginBottom: 8 }}
      />
      <View style={styles.newInterestContainer}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={newInterest}
          onChangeText={setNewInterest}
          placeholder="Nuevo Interés"
          placeholderTextColor="#888"
        />
        <TouchableOpacity style={styles.addButton} onPress={addInterest}>
          <Text style={styles.addButtonText}>Agregar</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
        <Text style={styles.saveButtonText}>Guardar Cambios</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 12 },
  imageContainer: { alignSelf: 'center', marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#bb86fc' },
  input: { 
    borderWidth: 1, 
    borderColor: '#333', 
    borderRadius: 8, 
    padding: 8, 
    marginVertical: 4, 
    color: '#fff', 
    backgroundColor: '#1e1e1e',
    fontSize: 14
  },
  label: { color: '#fff', fontWeight: 'bold', marginVertical: 4, fontSize: 14 },
  interestItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginRight: 6, 
    backgroundColor: '#1e1e1e', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 16,
    height: 50
  },
  interestText: { color: '#fff', fontSize: 12 },
  removeText: { color: 'red', marginLeft: 4, fontSize: 12 },
  newInterestContainer: { flexDirection: 'row', alignItems: 'center' },
  addButton: { backgroundColor: '#6200ee', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, marginLeft: 6 },
  addButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  saveButton: { backgroundColor: '#6200ee', padding: 10, borderRadius: 8, marginTop: 12, alignItems: 'center', elevation: 2 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
