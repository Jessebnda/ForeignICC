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
  ActivityIndicator,
  Platform
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

const LOCATION_TYPES = [
  { value: 'university', label: 'Universidad', icon: 'school-outline', color: '#4CAF50' },
  { value: 'restaurant', label: 'Restaurante', icon: 'restaurant-outline', color: '#FF9800' },
  { value: 'housing', label: 'Alojamiento', icon: 'home-outline', color: '#2196F3' },
  { value: 'entertainment', label: 'Entretenimiento', icon: 'game-controller-outline', color: '#E91E63' },
  { value: 'transport', label: 'Transporte', icon: 'bus-outline', color: '#9C27B0' },
  { value: 'other', label: 'Otro', icon: 'ellipsis-horizontal-outline', color: '#607D8B' },
];

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
  const [showTypePicker, setShowTypePicker] = useState(false);

  const selectedType = LOCATION_TYPES.find(t => t.value === type) || LOCATION_TYPES[5];

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

  const removeImage = () => {
    setImageUri(null);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Campo requerido', 'Por favor introduce un título para la ubicación');
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
        Alert.alert('¡Éxito!', 'La ubicación se ha agregado correctamente');
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
      {/* Header mejorado */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="location" size={24} color="#bb86fc" />
          </View>
          <View>
            <Text style={styles.title}>Nueva Ubicación</Text>
            <Text style={styles.subtitle}>Comparte un lugar interesante</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Campo de título */}
        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <Ionicons name="text-outline" size={20} color="#bb86fc" />
            <Text style={styles.label}>Título</Text>
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredText}>Requerido</Text>
            </View>
          </View>
          <TextInput
            style={[styles.input, !title.trim() && styles.inputError]}
            value={title}
            onChangeText={setTitle}
            placeholder="¿Cómo se llama este lugar?"
            placeholderTextColor="#666"
            maxLength={50}
          />
          <Text style={styles.charCount}>{title.length}/50</Text>
        </View>

        {/* Selector de tipo mejorado */}
        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <Ionicons name="apps-outline" size={20} color="#bb86fc" />
            <Text style={styles.label}>Categoría</Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.typeSelector}
            contentContainerStyle={styles.typeSelectorContent}
          >
            {LOCATION_TYPES.map((typeOption) => (
              <TouchableOpacity
                key={typeOption.value}
                style={[
                  styles.typeOption,
                  type === typeOption.value && styles.typeOptionSelected
                ]}
                onPress={() => setType(typeOption.value as any)}
              >
                <View style={[
                  styles.typeIconContainer,
                  { backgroundColor: type === typeOption.value ? typeOption.color : '#333' }
                ]}>
                  <Ionicons 
                    name={typeOption.icon as any} 
                    size={20} 
                    color="#fff" 
                  />
                </View>
                <Text style={[
                  styles.typeLabel,
                  type === typeOption.value && styles.typeLabelSelected
                ]}>
                  {typeOption.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Campo de descripción */}
        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <Ionicons name="document-text-outline" size={20} color="#bb86fc" />
            <Text style={styles.label}>Descripción</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Cuéntanos más sobre este lugar..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={200}
          />
          <Text style={styles.charCount}>{description.length}/200</Text>
        </View>

        {/* Información de ubicación mejorada */}
        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <Ionicons name="map-outline" size={20} color="#bb86fc" />
            <Text style={styles.label}>Ubicación</Text>
          </View>
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <View style={styles.locationIconContainer}>
                <Ionicons name="location" size={18} color="#bb86fc" />
              </View>
              <Text style={styles.locationText} numberOfLines={2}>
                {address || 'Ubicación seleccionada en el mapa'}
              </Text>
            </View>
            <View style={styles.coordinatesContainer}>
              <Text style={styles.coordinatesLabel}>Coordenadas:</Text>
              <Text style={styles.coordinates}>
                {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        </View>

        {/* Sección de imagen mejorada */}
        <View style={styles.section}>
          <View style={styles.fieldHeader}>
            <Ionicons name="camera-outline" size={20} color="#bb86fc" />
            <Text style={styles.label}>Imagen</Text>
            <Text style={styles.optionalText}>Opcional</Text>
          </View>
          
          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: imageUri }} 
                style={styles.previewImage} 
                resizeMode="cover"
              />
              <View style={styles.imageActions}>
                <TouchableOpacity 
                  style={styles.imageActionButton}
                  onPress={selectImage}
                >
                  <Ionicons name="refresh-outline" size={18} color="#bb86fc" />
                  <Text style={styles.imageActionText}>Cambiar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.imageActionButton, styles.removeButton]}
                  onPress={removeImage}
                >
                  <Ionicons name="trash-outline" size={18} color="#ff4757" />
                  <Text style={[styles.imageActionText, styles.removeText]}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.imageUploadButton} onPress={selectImage}>
              <View style={styles.imageUploadContent}>
                <View style={styles.imageUploadIcon}>
                  <Ionicons name="cloud-upload-outline" size={32} color="#bb86fc" />
                </View>
                <Text style={styles.imageUploadTitle}>Agregar imagen</Text>
                <Text style={styles.imageUploadSubtitle}>
                  Ayuda a otros a reconocer este lugar
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Footer mejorado */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            (!title.trim() || loading) && styles.disabledButton
          ]}
          onPress={handleSubmit}
          disabled={!title.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Crear Ubicación</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    width: '100%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  requiredText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  optionalText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#ff4757',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  typeSelector: {
    marginTop: 8,
  },
  typeSelectorContent: {
    paddingRight: 20,
  },
  typeOption: {
    alignItems: 'center',
    marginRight: 16,
    padding: 8,
  },
  typeOptionSelected: {
    transform: [{ scale: 1.05 }],
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    maxWidth: 60,
  },
  typeLabelSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  locationCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(187, 134, 252, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  locationText: {
    color: '#fff',
    fontSize: 15,
    flex: 1,
    lineHeight: 20,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  coordinatesLabel: {
    fontSize: 12,
    color: '#888',
    marginRight: 8,
  },
  coordinates: {
    fontSize: 12,
    color: '#bb86fc',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  imagePreviewContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#333',
  },
  imageActions: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    padding: 12,
  },
  imageActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
  },
  removeButton: {
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
  },
  imageActionText: {
    color: '#bb86fc',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  removeText: {
    color: '#ff4757',
  },
  imageUploadButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 24,
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  imageUploadContent: {
    alignItems: 'center',
  },
  imageUploadIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageUploadTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  imageUploadSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#555',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#bb86fc',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#555',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});