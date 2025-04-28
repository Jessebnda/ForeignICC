import React, { useState, useEffect } from 'react';
import { Text, TextInput, TouchableOpacity, Alert, StyleSheet, View } from 'react-native';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function EditItem() {
  const params = useLocalSearchParams();
  // Garantizar que los parámetros sean strings
  const itemId = typeof params.itemId === 'string' ? params.itemId : '';
  const category = typeof params.category === 'string' ? params.category : '';
  
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [areasInput, setAreasInput] = useState('');

  useEffect(() => {
    if (!itemId || !category) return;
    
    (async () => {
      const path = category === 'mentors' ? 'users' : category;
      const snap = await getDoc(doc(firestore, path, itemId));
      const data = snap.data() as any;
      setName(data?.name || '');
      if (category === 'mentors') {
        setAreasInput((data?.areas as string[] || []).join(', '));
      }
    })();
  }, [itemId, category]);

  const handleUpdate = async () => {
    if (!name.trim()) return Alert.alert('El nombre es obligatorio');
    const updateData: any = { name, updatedAt: serverTimestamp() };
    if (category === 'mentors') {
      updateData.areas = areasInput
        .split(',')
        .map(a => a.trim())
        .filter(a => a);
    }
    await updateDoc(
      doc(firestore, category === 'mentors' ? 'users' : category, itemId),
      updateData
    );
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Campos comunes */}
      <Text style={styles.label}>Nombre</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      {/* Solo para mentores */}
      {category === 'mentors' && (
        <>
          <Text style={styles.label}>Áreas (coma separadas)</Text>
          <TextInput
            style={styles.input}
            value={areasInput}
            onChangeText={setAreasInput}
            placeholder="Ej. Deportes, Tecnología"
            placeholderTextColor="#666"
          />
        </>
      )}

      <TouchableOpacity style={styles.button} onPress={handleUpdate}>
        <Text style={styles.buttonText}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:'#000' },
  label: { color:'#fff', marginTop:12 },
  input: { borderWidth:1, borderColor:'#444', color:'#fff', padding:8, marginTop:4, borderRadius:4 },
  button: { backgroundColor:'#b388ff', padding:12, borderRadius:6, marginTop:20, alignItems:'center' },
  buttonText: { color:'#000', fontWeight:'bold' },
});