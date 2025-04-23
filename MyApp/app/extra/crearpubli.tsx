import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert, Image, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';

export default function CrearPubli() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<any>(null);

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const uriToBlob = async (uri: string): Promise<Blob> => {
    const response = await fetch(uri);
    return await response.blob();
  };

  const uploadToFirebase = async (uri: string): Promise<string | null> => {
    try {
      setLoading(true);
      const blob = await uriToBlob(uri);
      const fileName = `images/${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      setLoading(false);
      return url;
    } catch (err: any) {
      setLoading(false);
      console.log("🔥 Upload Error:", err);
      Alert.alert('Error al subir imagen', err.message || 'Error desconocido');
      return null;
    }
  };

  const handleImage = async (uri: string) => {
    const processed = await ImageManipulator.manipulateAsync(uri, [], {
      compress: 1,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    const url = await uploadToFirebase(processed.uri);
    if (url) {
      setUploadedImageUrl(url);
    }
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      await handleImage(photo.uri);
    }
  };

  const pickImageFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      await handleImage(result.assets[0].uri);
    } else {
      Alert.alert('No seleccionaste ninguna imagen');
    }
  };

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Necesitamos tu permiso para usar la cámara</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.text}>Conceder permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.container}>
        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.controls}>
            <TouchableOpacity onPress={toggleCameraFacing} style={styles.flipButton}>
              <Text style={styles.text}>🔄</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={takePhoto} style={styles.captureButton}>
              <View style={styles.innerCircle} />
            </TouchableOpacity>

            <TouchableOpacity onPress={pickImageFromLibrary} style={styles.galleryButton}>
              <Text style={styles.text}>📁 Galería</Text>
            </TouchableOpacity>
          </View>
        </CameraView>

        {loading && <Text style={styles.loadingText}>Subiendo imagen...</Text>}

        {uploadedImageUrl && (
          <View style={styles.previewContainer}>
            <Text style={styles.text}>Imagen subida:</Text>
            <Image source={{ uri: uploadedImageUrl }} style={styles.imagePreview} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  message: {
    textAlign: 'center',
    padding: 20,
    color: 'white',
    fontSize: 16,
  },
  permissionButton: {
    backgroundColor: '#4f0c2e',
    padding: 12,
    marginHorizontal: 40,
    borderRadius: 8,
    alignItems: 'center',
  },
  camera: {
    height: 500,
  },
  controls: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
  },
  flipButton: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 10,
    borderRadius: 25,
    marginBottom: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    borderWidth: 4,
    borderColor: '#4f0c2e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  innerCircle: {
    width: 40,
    height: 40,
    backgroundColor: '#4f0c2e',
    borderRadius: 20,
  },
  galleryButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#4f0c2e',
  },
  text: {
    fontSize: 16,
    color: 'white',
  },
  loadingText: {
    color: '#ccc',
    textAlign: 'center',
    marginTop: 20,
  },
  previewContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  imagePreview: {
    width: 300,
    height: 300,
    borderRadius: 12,
    marginTop: 10,
  },
});
