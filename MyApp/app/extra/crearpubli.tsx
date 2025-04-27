import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert, Image, ScrollView, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import {  doc, setDoc, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firestore } from '../../firebase';


export default function CrearPubli() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<any>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');


  const savePostToFirestore = async (caption: string, location: string, imageUrl: string) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser || !imageUrl) {
      Alert.alert("Faltan datos", "No se puede guardar sin imagen o usuario.");
      return;
    }

    const postId = Date.now().toString();

    const postData = {
      postId,
      caption,
      text: caption,
      image: imageUrl,
      userId: currentUser.uid,
      userName: currentUser.displayName ?? "Usuario sin nombre",
      userPhoto: currentUser.photoURL ?? "",
      location,
      likes: {},
      comments: [],
      createdAt: serverTimestamp(),
    };

    try {
      // Guarda el post en la colección feedPosts
      await setDoc(doc(firestore, "feedPosts", postId), postData);
      
      // Actualiza las referencias del usuario
      const userRef = doc(firestore, "users", currentUser.uid);
      await updateDoc(userRef, {
        posts: arrayUnion(postId)
      });
      
      Alert.alert("✅ Publicación guardada");
    } catch (error) {
      console.error("❌ Error al guardar post:", error);
      Alert.alert("Error", "No se pudo guardar la publicación.");
    }
  };

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

  const manipulateImage = async (uri: string) => {
    return await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1000 } }],
      {
        compress: 0.6,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
  };
  
  const handleImage = async (uri: string) => {
    const processed = await manipulateImage(uri);
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

          <Text style={[styles.text, { marginTop: 10 }]}>Escribe un caption:</Text>
          <TextInput
            style={styles.input}
            placeholder="¿Qué estás pensando?"
            placeholderTextColor="#888"
            onChangeText={setCaption}
            value={caption}
          />

          <Text style={[styles.text, { marginTop: 10 }]}>Ubicación:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ciudad"
            placeholderTextColor="#888"
            onChangeText={setLocation}
            value={location}
          />

          <TouchableOpacity
            onPress={() => savePostToFirestore(caption, location, uploadedImageUrl)}
            style={[styles.galleryButton, { marginTop: 20 }]}
          >
            <Text style={styles.text}>📤 Publicar</Text>
          </TouchableOpacity>
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    color: '#fff',
    width: 300,
    marginTop: 8,
  },
  
});
