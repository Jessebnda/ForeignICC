import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImageService from '../../services/imageService';

interface ImagePickerProps {
  imageUri: string | null;
  onImageSelected: (uri: string | null) => void;
  title?: string;
}

export default function ImagePicker({ 
  imageUri, 
  onImageSelected,
  title = "Imagen:"
}: ImagePickerProps) {
  
  const handleSelectImage = async () => {
    try {
      const uri = await ImageService.pickImageFromLibrary({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      });
      
      if (uri) {
        onImageSelected(uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      {imageUri ? (
        <View style={styles.previewContainer}>
          <Image 
            source={{ uri: imageUri }} 
            style={styles.imagePreview} 
          />
          <TouchableOpacity 
            style={styles.changeButton}
            onPress={handleSelectImage}
          >
            <Text style={styles.changeButtonText}>Cambiar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.selectButton}
          onPress={handleSelectImage}
        >
          <Ionicons name="camera" size={24} color="#fff" />
          <Text style={styles.selectButtonText}>Seleccionar imagen</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  selectButton: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    marginTop: 8,
  },
  previewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#bb86fc',
  },
  changeButton: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  changeButtonText: {
    color: '#bb86fc',
    fontWeight: 'bold',
  },
});