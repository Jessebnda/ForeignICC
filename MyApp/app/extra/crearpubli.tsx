import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  // Selección desde galería
  const pickImageFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      Alert.alert('🖼 Imagen seleccionada', `URI: ${uri}`);
      console.log('🖼 URI de galería:', uri);
    } else {
      Alert.alert('No seleccionaste ninguna imagen');
    }
  };

  // Toma de foto
  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      Alert.alert('📸 Foto tomada', `URI: ${photo.uri}`);
      console.log('📷 URI de la foto:', photo.uri);
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
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
    </View>
  );
}

const styles = StyleSheet.create({
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
    flex: 1,
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
});
