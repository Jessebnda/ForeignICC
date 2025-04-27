// app/(tabs)/edit-profile.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Image, Alert, ActivityIndicator } from 'react-native'; 
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '../../context/UserContext'; 
import { doc, updateDoc } from 'firebase/firestore';
import { firestore, storage } from '../../firebase'; 
import * as ImagePicker from 'expo-image-picker'; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; 
import * as ImageManipulator from 'expo-image-manipulator'; 
import * as FileSystem from 'expo-file-system'; 
import { Ionicons } from '@expo/vector-icons'; // <-- AÑADIR ESTA LÍNEA

// Función para convertir URI a Blob (necesaria para subir a Storage)
const uriToBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
};

// Función para comprimir imagen
const manipulateImage = async (uri: string) => {
  const manipulatedImage = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 800 } }], // Redimensiona a un ancho máximo de 800px
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } // Comprime a 70% calidad JPEG
  );
  return manipulatedImage;
};


export default function EditProfileScreen() {
  const router = useRouter();
  const { profile: profileParam } = useLocalSearchParams();
  const initialProfile = profileParam ? JSON.parse(profileParam as string) : {};
  
  // Destructure userProfile from useUser
  const { user, userProfile, refreshProfile } = useUser(); 

  const [name, setName] = useState(initialProfile.name || userProfile?.name || ''); // Also fallback name/origin to context if needed
  const [origin, setOrigin] = useState(initialProfile.origin || userProfile?.origin || '');
  // Initialize profileImage state: Prioritize context, then params, then empty string
  const [profileImage, setProfileImage] = useState(userProfile?.photo || initialProfile.photo || ''); 
  const [interests, setInterests] = useState<string[]>(initialProfile.interests || userProfile?.interests || []);
  const [newInterest, setNewInterest] = useState('');
  const [isUploading, setIsUploading] = useState(false); // Estado para carga de imagen

  // --- Función para seleccionar imagen ---
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Fuerza un aspect ratio cuadrado
      quality: 1, // Calidad máxima inicialmente, se comprimirá después
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri); // Actualiza el estado con la URI local
    }
  };
  // --- Fin Función para seleccionar imagen ---

  // --- Función para subir imagen (llamada desde saveProfile) ---
  const uploadImage = async (uri: string, userId: string): Promise<string | null> => {
     if (!uri.startsWith('file://')) { // Si no es una URI local, no subir de nuevo
       return uri; 
     }
     setIsUploading(true);
     try {
       const compressedImage = await manipulateImage(uri);
       const blob = await uriToBlob(compressedImage.uri);
       const storageRef = ref(storage, `profileImages/${userId}_${Date.now()}.jpg`);
       await uploadBytes(storageRef, blob);
       const downloadURL = await getDownloadURL(storageRef);
       return downloadURL;
     } catch (error) {
       console.error("Error subiendo imagen:", error);
       Alert.alert("Error", "No se pudo subir la nueva imagen de perfil.");
       return null; // Retorna null si falla la subida
     } finally {
       setIsUploading(false);
     }
  };
  // --- Fin Función para subir imagen ---

  const addInterest = () => {
    if (newInterest.trim()) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  // --- Modificar saveProfile ---
  const saveProfile = async () => {
    if (!user?.uid) {
      console.error("No hay usuario para guardar cambios");
      return;
    }

    let finalImageUrl = profileImage; // Usa la imagen actual por defecto

    // Si la imagen es una URI local (nueva imagen seleccionada), súbela
    if (profileImage && profileImage.startsWith('file://')) {
      const uploadedUrl = await uploadImage(profileImage, user.uid);
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl; // Usa la URL de Firebase si la subida fue exitosa
      } else {
        // Opcional: decidir si detener el guardado si la subida falla
         Alert.alert("Error", "No se pudo guardar la nueva imagen, se mantendrá la anterior si existe.");
         // Podrías buscar la URL anterior de initialProfile.photo si quieres revertir
         finalImageUrl = initialProfile.photo || ''; // Revertir a la original si falla
      }
    }
    
    const userRef = doc(firestore, 'users', user.uid);
    
    try {
      setIsUploading(true); // Muestra indicador general mientras guarda
      await updateDoc(userRef, {
        name: name,
        origin: origin, 
        photo: finalImageUrl, // Guarda la URL final (nueva o la anterior)
        interests: interests,
        // university: university // Descomenta si añades campo para editar universidad
      });
      
      await refreshProfile(); // Actualiza los datos en el contexto
      router.back(); // Regresa a la pantalla anterior (perfil)
      
    } catch (error) {
      console.error("Error al guardar perfil:", error);
      Alert.alert("Error", "No se pudieron guardar los cambios en el perfil.");
    } finally {
       setIsUploading(false);
    }
  };
  // --- Fin Modificar saveProfile ---

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        <Image
          // Use the state variable 'profileImage'. The source logic handles URI vs default.
          source={profileImage ? { uri: profileImage } : require('../../assets/images/img7.jpg')} 
          style={styles.avatar}
        />
         <View style={styles.cameraIconOverlay}>
            <Ionicons name="camera" size={20} color="#fff" /> 
         </View>
      </TouchableOpacity>
      
      {/* Indicador de carga */}
      {isUploading && <ActivityIndicator size="large" color="#bb86fc" style={{ marginVertical: 10 }} />}

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Nombre de Usuario"
        placeholderTextColor="#888"
        editable={!isUploading} // Deshabilita mientras carga
      />
      <TextInput
        style={styles.input}
        value={origin}
        onChangeText={setOrigin}
        placeholder="Origen"
        placeholderTextColor="#888"
        editable={!isUploading} // Deshabilita mientras carga
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
          editable={!isUploading} // Deshabilita mientras carga
        />
        <TouchableOpacity style={styles.addButton} onPress={addInterest}>
          <Text style={styles.addButtonText}>Agregar</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={[styles.saveButton, isUploading && styles.disabledButton]} onPress={saveProfile} disabled={isUploading}>
        <Text style={styles.saveButtonText}>Guardar Cambios</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 12 },
  imageContainer: { 
    alignSelf: 'center', 
    marginBottom: 12,
    position: 'relative', // Necesario para el icono overlay
  },
  avatar: { 
     width: 100, // Un poco más grande
     height: 100, 
     borderRadius: 50, 
     borderWidth: 2, 
     borderColor: '#bb86fc' 
  },
  cameraIconOverlay: {
     position: 'absolute',
     bottom: 0,
     right: 0,
     backgroundColor: 'rgba(0,0,0,0.6)',
     padding: 5,
     borderRadius: 15,
  },
  disabledButton: {
     opacity: 0.5,
  },
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
