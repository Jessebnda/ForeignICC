// app/(tabs)/profile.tsx
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    name: 'Jesse Banda',
    origin: 'Mexicali',
    interests: ['gimnasio', 'programación', 'deportes'],
    profileImage: require('../../assets/images/img7.jpg'),
    publications: [
      {
        id: 'profile-post1',
        image: require('../../assets/images/img1.jpg'),
        content: 'Disfrutando de un gran día en la ciudad',
        likes: 15,
        comments: []
      },
      {
        id: 'profile-post2',
        image: require('../../assets/images/img2.jpg'),
        content: 'Nunca pares de aprender cosas nuevas',
        likes: 23,
        comments: []
      },
      {
        id: 'profile-post3',
        image: require('../../assets/images/img3.jpg'),
        content: 'Compartiendo buenos momentos',
        likes: 8,
        comments: []
      },
    ],
  });

  const handleEditProfile = () => {
    router.push({
      pathname: '../extra/edit-profile',
      params: { profile: JSON.stringify(profile) },
    });
  };

  const goToPublicationDetail = (publication: any) => {
    // Add the user information to the publication
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

  return (
    <View style={styles.container}>
      <Image source={profile.profileImage} style={styles.avatar} />
      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.origin}>{profile.origin}</Text>
      <View style={styles.interestsContainer}>
        {profile.interests.map((interest, i) => (
          <View key={i} style={styles.chip}>
            <Text style={styles.chipText}>{interest}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
        <Text style={styles.editButtonText}>Editar Perfil</Text>
      </TouchableOpacity>
      <Text style={styles.sectionTitle}>Publicaciones</Text>
      <FlatList
        data={profile.publications}
        renderItem={renderPublication}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ alignItems: 'center' }}
      />
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
});
