import React, { useState, useEffect } from 'react';
import { View, TextInput, Image, Button, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { storage, firestore, auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const Save = () => {
  const { image } = useLocalSearchParams();
  const [caption, setCaption] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("🟢 Usuario autenticado:", user.uid);
        setUserId(user.uid);
      } else {
        console.log("🔴 Usuario NO autenticado");
        setUserId(null);
      }
    });
    return unsubscribe;
  }, []);

  // ✅ Blob compatible con React Native
  const uriToBlob = async (uri: string): Promise<Blob> => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  };

  const uploadImage = async () => {
    try {
      if (!image || typeof image !== 'string') {
        Alert.alert("⚠️ Imagen inválida");
        return;
      }

      if (!userId) {
        Alert.alert("⚠️ Usuario no autenticado");
        return;
      }

      const blob = await uriToBlob(image);
      console.log("Blob generado:", blob);
      const filename = `images/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);


      console.log("Subiendo imagen desde URI:", image);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(firestore, "feedPosts"), {
        imageUrl: downloadURL,
        caption: caption,
        text: caption,
        createdAt: Timestamp.now(),
        location: "Culiacan",
        userId: userId,
        postId: Date.now().toString(),
        likes: { [userId]: true },
        comments: [],
      });

      Alert.alert("✅ Publicación guardada correctamente");
      router.back();
    } catch (error) {
      console.error("Error al subir imagen:", error);
      Alert.alert("❌ Error al subir la imagen");
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
      <Button title="Guardar en Firebase" onPress={uploadImage} />
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
