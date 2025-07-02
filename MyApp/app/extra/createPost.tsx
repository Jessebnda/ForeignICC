import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert, Image, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firestore } from '../../firebase';
import { useRouter } from 'expo-router';
import { Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MaxWidthContainer from '../../components/MaxWidthContainer';

export default function createPost() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const cameraRef = useRef<any>(null);
  const [caption, setCaption] = useState('');
  const router = useRouter();
  const { height, width } = Dimensions.get('window');

  const savePostToFirestore = async (caption: string, imageUrl: string) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser || !imageUrl) {
      Alert.alert("Faltan datos", "No se puede guardar sin imagen o usuario.");
      return;
    }

    setPublishing(true);
    const postId = Date.now().toString();

    const postData = {
      postId,
      caption,
      text: caption,
      image: imageUrl,
      userId: currentUser.uid,
      userName: currentUser.displayName ?? "Usuario sin nombre",
      userPhoto: currentUser.photoURL ?? "",
      likes: {},
      createdAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(firestore, "feedPosts", postId), postData);
      Alert.alert("¡Éxito!", "Tu publicación se ha compartido correctamente");
      router.replace('/(drawer)/(tabs)/feed');
    } catch (error) {
      console.error("❌ Error al guardar post:", error);
      Alert.alert("Error", "No se pudo guardar la publicación.");
    } finally {
      setPublishing(false);
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

  const retakePhoto = () => {
    setUploadedImageUrl(null);
    setCaption('');
  };

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <View style={styles.permissionIcon}>
            <Ionicons name="camera-outline" size={64} color="#bb86fc" />
          </View>
          <Text style={styles.permissionTitle}>Acceso a la cámara</Text>
          <Text style={styles.permissionMessage}>
            Necesitamos acceso a tu cámara para que puedas tomar fotos y compartir momentos increíbles
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.permissionButtonText}>Conceder permiso</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
    >
      <MaxWidthContainer style={{ maxWidth: 800 }}>
        <View style={styles.container}>
          {!uploadedImageUrl ? (
            <View style={styles.cameraContainer}>
              <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
              
              {loading && (
                <View style={styles.loadingOverlay}>
                  <View style={styles.loadingContent}>
                    <ActivityIndicator size="large" color="#bb86fc" />
                    <Text style={styles.loadingText}>Procesando imagen...</Text>
                  </View>
                </View>
              )}

              <View style={styles.bottomControls}>
                <TouchableOpacity onPress={toggleCameraFacing} style={styles.controlButton}>
                  <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity onPress={takePhoto} style={styles.captureButton} disabled={loading}>
                  <View style={styles.captureButtonInner}>
                    <Ionicons name="camera" size={32} color="#fff" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={pickImageFromLibrary} style={styles.controlButton} disabled={loading}>
                  <Ionicons name="images-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <ScrollView 
              style={styles.previewScroll}
              contentContainerStyle={styles.previewScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Header de previsualización */}
              <View style={styles.previewHeader}>
                <TouchableOpacity onPress={retakePhoto} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.previewTitle}>Nueva publicación</Text>
                <View style={styles.headerSpacer} />
              </View>

              {/* Imagen de previsualización */}
              <View style={styles.imageContainer}>
                <Image source={{ uri: uploadedImageUrl }} style={styles.previewImage} />
                <TouchableOpacity onPress={retakePhoto} style={styles.retakeButton}>
                  <Ionicons name="camera-outline" size={18} color="#bb86fc" />
                  <Text style={styles.retakeButtonText}>Cambiar foto</Text>
                </TouchableOpacity>
              </View>

              {/* Sección de descripción */}
              <View style={styles.captionSection}>
                <View style={styles.captionHeader}>
                  <Ionicons name="create-outline" size={20} color="#bb86fc" />
                  <Text style={styles.captionLabel}>Descripción</Text>
                </View>
                
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.captionInput}
                    placeholder="Comparte lo que estás pensando..."
                    placeholderTextColor="#666"
                    onChangeText={setCaption}
                    value={caption}
                    multiline
                    maxLength={500}
                    textAlignVertical="top"
                  />
                  <Text style={styles.charCount}>{caption.length}/500</Text>
                </View>

                {/* Sugerencias de hashtags */}
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>Sugerencias:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.suggestionsList}>
                      {['#momento', '#vida', '#feliz', '#recuerdos', '#hoy'].map((tag) => (
                        <TouchableOpacity
                          key={tag}
                          style={styles.suggestionTag}
                          onPress={() => setCaption(prev => prev + (prev ? ' ' : '') + tag)}
                        >
                          <Text style={styles.suggestionTagText}>{tag}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>

              {/* Botón de publicar */}
              <View style={styles.publishSection}>
                <TouchableOpacity
                  onPress={() => savePostToFirestore(caption, uploadedImageUrl)}
                  style={[
                    styles.publishButton,
                    publishing && styles.publishButtonDisabled
                  ]}
                  disabled={publishing}
                >
                  {publishing ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.publishButtonText}>Publicando...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="paper-plane" size={20} color="#fff" />
                      <Text style={styles.publishButtonText}>Compartir</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </MaxWidthContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  permissionIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#bb86fc',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 24,
    borderRadius: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#bb86fc',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#bb86fc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewScroll: {
    flex: 1,
  },
  previewScrollContent: {
    paddingBottom: 40,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerSpacer: {
    width: 40,
  },
  imageContainer: {
    padding: 20,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#333',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 12,
  },
  retakeButtonText: {
    color: '#bb86fc',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  captionSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  captionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  captionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 8,
  },
  inputContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  captionInput: {
    color: '#fff',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 8,
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  suggestionsList: {
    flexDirection: 'row',
    gap: 8,
  },
  suggestionTag: {
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(187, 134, 252, 0.3)',
  },
  suggestionTagText: {
    color: '#bb86fc',
    fontSize: 12,
    fontWeight: '500',
  },
  publishSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#bb86fc',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  publishButtonDisabled: {
    backgroundColor: '#555',
    opacity: 0.7,
  },
  publishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});