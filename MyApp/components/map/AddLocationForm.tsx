import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { MapLocation } from '../../services/locationService';

interface AddLocationFormProps {
  coordinates: { latitude: number; longitude: number };
  address?: string;
  onSubmit: (location: Omit<MapLocation, 'id' | 'createdAt' | 'createdBy'>) => Promise<string | null>;
  onCancel: () => void;
}

export default function AddLocationForm({
  coordinates,
  address,
  onSubmit,
  onCancel
}: AddLocationFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'university' | 'restaurant' | 'housing' | 'entertainment' | 'transport' | 'other'>('other');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const selectImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };
  
  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Por favor introduce un título para la ubicación');
      return;
    }
    
    setLoading(true);
    
    try {
      const newLocation: Omit<MapLocation, 'id' | 'createdAt' | 'createdBy'> = {
        title: title.trim(),
        description: description.trim() || undefined,
        coordinates,
        type,
        address,
        imageUrl: imageUri || undefined,
      };
      
      const locationId = await onSubmit(newLocation);
      
      if (locationId) {
        Alert.alert('Ubicación agregada', 'La ubicación se ha agregado correctamente');
        onCancel();
      } else {
        Alert.alert('Error', 'No se pudo agregar la ubicación');
      }
    } catch (error) {
      console.error('Error guardando ubicación:', error);
      Alert.alert('Error', 'No se pudo guardar la ubicación');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agregar Ubicación</Text>
        
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Nombre de la ubicación"
            placeholderTextColor="#888"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Tipo de lugar</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={type}
              onValueChange={(value) => setType(value as any)}
              style={styles.picker}
              dropdownIconColor="#888"
            >
              <Picker.Item label="Universidad" value="university" />
              <Picker.Item label="Restaurante" value="restaurant" />
              <Picker.Item label="Alojamiento" value="housing" />
              <Picker.Item label="Entretenimiento" value="entertainment" />
              <Picker.Item label="Transporte" value="transport" />
              <Picker.Item label="Otro" value="other" />
            </Picker>
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe este lugar..."
            placeholderTextColor="#888"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Ubicación</Text>
          <View style={styles.locationInfo}>
            <Ionicons name="location-outline" size={18} color="#bb86fc" />
            <Text style={styles.locationText}>
              {address || 'Ubicación seleccionada en el mapa'}
            </Text>
          </View>
          <Text style={styles.coordinates}>
            Lat: {coordinates.latitude.toFixed(6)}, Lng: {coordinates.longitude.toFixed(6)}
          </Text>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Imagen</Text>
          <TouchableOpacity style={styles.imageButton} onPress={selectImage}>
            <Ionicons name="image-outline" size={24} color="#fff" />
            <Text style={styles.imageButtonText}>Seleccionar imagen</Text>
          </TouchableOpacity>
          
          {imageUri && (
            <Image 
              source={{ uri: imageUri }} 
              style={styles.previewImage} 
              resizeMode="cover"
            />
          )}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.submitButton, !title.trim() && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={!title.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={styles.submitButtonText}>Guardar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2c2c2c',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
  },
  pickerContainer: {
    backgroundColor: '#2c2c2c',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    color: '#fff',
    height: 50,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2c2c',
    borderRadius: 8,
    padding: 12,
  },
  locationText: {
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  coordinates: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2c2c',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
  },
  imageButtonText: {
    color: '#fff',
    marginLeft: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555',
  },
  cancelButtonText: {
    color: '#fff',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#bb86fc',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#555',
  },
  submitButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
});