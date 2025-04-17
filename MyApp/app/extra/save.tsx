import React, { useState, useEffect } from 'react';
import { View, TextInput, Image, Button, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { firestore, auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import * as ImageManipulator from 'expo-image-manipulator';

const Save = () => {
  const { image } = useLocalSearchParams();
  const [caption, setCaption] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const [userInfo, setUserInfo] = useState({ name: '', photo: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("🟢 Usuario autenticado:", user.uid);
        setUserId(user.uid);
  
        // Guarda nombre y foto (URL o base64 si lo prefieres)
        setUserInfo({
          name: user.displayName ?? 'Usuario sin nombre',
          photo: user.photoURL ?? '', // puedes guardar base64 si lo tienes local
        });
  
      } else {
        console.log("🔴 Usuario NO autenticado");
        setUserId(null);
        setUserInfo({ name: '', photo: '' });
      }
    });
  
    return unsubscribe;
  }, []);
  
  // 🧠 Comprime y convierte la imagen a base64
  const compressAndConvertToBase64 = async (uri: string): Promise<string> => {
    try {
      const compressed = await ImageManipulator.manipulateAsync(
        uri,
        [],
        {
          compress: 0.3, // Ajusta este valor según el peso final (~0.3 = 30% calidad)
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );
      return compressed.base64!;
    } catch (error) {
      console.error("Error al comprimir/convertir imagen:", error);
      throw error;
    }
  };

  const uploadImageAsBase64 = async () => {
    try {
      if (!image || typeof image !== 'string') {
        Alert.alert("⚠️ Imagen inválida");
        return;
      }

      if (!userId) {
        Alert.alert("⚠️ Usuario no autenticado");
        return;
      }

      console.log("🧪 Comprimendo y convirtiendo imagen...");
      const base64Image = await compressAndConvertToBase64(image);

      await addDoc(collection(firestore, "feedPosts"), {
        base64Image,
        caption: caption,
        text: caption,
        createdAt: Timestamp.now(),
        location: "Culiacan",
        userId: userId,
        userName: userInfo.name,
        userPhoto: userInfo.photo, // puede ser base64 también
        postId: Date.now().toString(),
        likes: { [userId]: true },
        comments: [],
      });

      Alert.alert("✅ Publicación guardada correctamente (base64)");
      router.back();
    } catch (error) {
      console.error("❌ Error al guardar imagen:", error);
      Alert.alert("❌ Error al guardar la imagen");
    }
  };

  return (
    <View style={styles.container}>
      {image && <Image source={{ uri: image as string }} style={styles.image} />}
      <TextInput
        placeholder="Escribe un caption..."
        value={caption}
        onChangeText={setCaption}
        style={styles.input}
      />
      <Button title="Guardar como base64" onPress={uploadImageAsBase64} />
    </View>
  );
};

export default Save;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
  },
});
