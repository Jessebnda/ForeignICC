// app/(tabs)/profile.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../firebase';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    name: 'Cargando...',
    origin: 'Cargando...',
    interests: [],
    profileImage: null,
    publications: [],
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.isAnonymous) {
        // Para usuario anónimo: mostrar "Anónimo", sin intereses ni origen y con imagen default.
        setProfile({
          name: "Anónimo",
          origin: "",
          interests: [],
          profileImage: require('../../assets/images/default-user.png'),
          publications: [],
        });
        return;
      }

      // Intentar cargar desde AsyncStorage para usuarios registrados
      const userData = await AsyncStorage.getItem('userProfile');
      
      if (userData) {
        const parsedData = JSON.parse(userData);
        setProfile(prevProfile => ({
          ...prevProfile,
          name: parsedData.name || auth.currentUser?.displayName || 'Usuario',
          origin: parsedData.origin || 'No especificado',
          interests: Array.isArray(parsedData.interests) ? parsedData.interests : [],
          profileImage: (parsedData.profileImage && parsedData.profileImage.trim() !== "")
            ? { uri: parsedData.profileImage }
            : auth.currentUser?.photoURL 
              ? { uri: auth.currentUser.photoURL }
              : require('../../assets/images/default-user.png'),
        }));
      } else if (auth.currentUser) {
        setProfile(prevProfile => ({
          ...prevProfile,
          name: auth.currentUser?.displayName || 'Usuario',
          profileImage: auth.currentUser?.photoURL 
            ? { uri: auth.currentUser.photoURL }
            : require('../../assets/images/default-user.png'),
        }));
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      setProfile(prevProfile => ({
        ...prevProfile,
        name: 'Usuario',
        origin: 'No especificado',
        interests: [],
        profileImage: require('../../assets/images/default-user.png'),
      }));
    }
  };

  const handleEditProfile = () => {
    router.push({
      pathname: '../extra/edit-profile',
      params: { profile: JSON.stringify(profile) },
    });
  };

  const goToPublicationDetail = (publication: any) => {
    const post = {
      ...publication,
      user: {
        name: profile.name,
        image: profile.profileImage
      }
    };
    
    router.push({
      pathname: '../extra/publication-detail',
      params: { post: JSON.stringify(post) },
    });
  };

  const renderPublication = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => goToPublicationDetail(item)}>
      <Image source={item.image} style={styles.pubImage} />
    </TouchableOpacity>
  );

  const renderAvatar = () => {
    if (profile.profileImage) {
      const source = typeof profile.profileImage === 'string' 
        ? { uri: profile.profileImage } 
        : profile.profileImage;
      return <Image source={source} style={styles.avatar} />;
    } else {
      return (
        <View style={[styles.avatar, { 
          backgroundColor: '#2a2a2a', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }]}>
          <Ionicons name="person" size={60} color="#888" />
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      {renderAvatar()}
      <Text style={styles.name}>{profile.name}</Text>
      {profile.origin ? <Text style={styles.origin}>{profile.origin}</Text> : null}
      <View style={styles.interestsContainer}>
        {profile.interests && profile.interests.length > 0 ? (
          profile.interests.map((interest, i) => (
            <View key={i} style={styles.chip}>
              <Text style={styles.chipText}>{interest}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noInterestsText}>Sin intereses seleccionados</Text>
        )}
      </View>
      <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
        <Text style={styles.editButtonText}>Editar Perfil</Text>
      </TouchableOpacity>
      
      <Text style={styles.sectionTitle}>Publicaciones</Text>
      
      {profile.publications && profile.publications.length > 0 ? (
        <FlatList
          data={profile.publications}
          renderItem={renderPublication}
          keyExtractor={(item, index) => item.id || `pub-${index}`}
          numColumns={3}
          contentContainerStyle={{ alignItems: 'center' }}
        />
      ) : (
        <Text style={styles.noPublicationsText}>No hay publicaciones</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', alignItems: 'center', padding: 16 },
  avatar: { width: 110, height: 110, borderRadius: 55, marginVertical: 12, borderWidth: 2, borderColor: '#bb86fc' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  origin: { fontSize: 16, color: '#ccc', marginBottom: 12 },
  interestsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginVertical: 8 },
  chip: { backgroundColor: '#1e1e1e', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, margin: 4 },
  chipText: { color: '#fff', fontSize: 14 },
  editButton: { backgroundColor: '#bb86fc', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, marginVertical: 12, elevation: 2 },
  editButtonText: { color: '#121212', fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginVertical: 12 },
  pubImage: { width: 100, height: 100, margin: 4, borderRadius: 8 },
  noInterestsText: { color: '#888', fontSize: 14, marginVertical: 8 },
  noPublicationsText: { color: '#888', fontSize: 14, marginTop: 12 },
});
