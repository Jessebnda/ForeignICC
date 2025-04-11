import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const ProfileTab = () => {
  const [userData, setUserData] = useState<any>(null);
  const userId = "1"; 
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  if (!userData) {
    return <Text style={styles.loading}>Cargando datos...</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: userData.photoURL }} style={styles.image} />
      <Text style={styles.name}>{userData.name}</Text>
      <Text style={styles.detail}>📧 {userData.email}</Text>
      <Text style={styles.detail}>🎓 {userData.career}</Text>
      <Text style={styles.detail}>📍 {userData.fromCity}</Text>
      <Text style={styles.detail}>🟢 Activo: {userData.isActive ? 'Sí' : 'No'}</Text>
      <Text style={styles.detail}>👀 Busca roomie: {userData.isLookingForRoomie ? 'Sí' : 'No'}</Text>
      <Text style={styles.subheader}>Intereses:</Text>
      {userData.interests?.map((interest: string, index: number) => (
        <Text key={index} style={styles.interest}>• {interest}</Text>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center'
  },
  loading: {
    marginTop: 100,
    textAlign: 'center',
    fontSize: 16,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  detail: {
    fontSize: 16,
    marginVertical: 2,
  },
  subheader: {
    marginTop: 10,
    fontWeight: 'bold',
    fontSize: 18,
  },
  interest: {
    fontSize: 16,
  }
});

export default ProfileTab;
