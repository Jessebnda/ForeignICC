// app/(tabs)/profile.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, Alert, ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../firebase';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

// Define interfaces for better type safety
interface ProfileData {
  name: string;
  origin: string;
  interests: string[];
  profileImage: ImageSourcePropType;
  publications: Publication[];
}

interface Publication {
  id?: string;
  imageUrl: string;
  title: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>({
    name: 'Cargando...',
    origin: 'Cargando...',
    interests: [],
    profileImage: require('../../assets/images/default-user.png'),
    publications: [],
  });

  useEffect(() => {
    loadUserProfile();
    
    // Set up real-time subscription
    let cleanupFunction: (() => void) | null = null;
    
    const setupRealtimeSubscription = async () => {
      const user = await supabase.auth.getUser();
      const userId = user.data?.user?.id;
      
      if (!userId) return null;
      
      const subscription = supabase
        .channel('profile-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'profiles',
            filter: `id=eq.${userId}`
          },
          (payload) => {
            console.log('Real-time update received:', payload);
            // Update profile state with new data
            if (payload.new) {
              // Use type assertion to help TypeScript understand the structure
              const newData = payload.new as any;
              setProfile(prevProfile => ({
                ...prevProfile,
                name: newData.name || 'Usuario',
                origin: newData.origin || 'No especificado',
                interests: newData.interests || [],
                profileImage: newData.profile_image 
                  ? { uri: newData.profile_image } 
                  : require('../../assets/images/default-user.png'),
              }));
            }
          }
        )
        .subscribe();
        
      // Return cleanup function
      return () => {
        subscription.unsubscribe();
      };
    };
    
    // Setup subscription and save cleanup function
    setupRealtimeSubscription().then(cleanup => {
      if (cleanup) cleanupFunction = cleanup;
    });
    
    // Cleanup subscription on unmount
    return () => {
      if (cleanupFunction) cleanupFunction();
    };
  }, []);

  const loadUserProfile = async () => {
    try {
      const user = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.data?.user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          name: data.name || 'Usuario',
          origin: data.origin || 'No especificado',
          interests: data.interests || [],
          profileImage: data.profile_image 
            ? { uri: data.profile_image } 
            : require('../../assets/images/default-user.png'),
          publications: [], // Update this with actual publications if needed
        });
      }
    } catch (error) {
      console.error('Error loading profile from Supabase:', error);
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

  const renderPublication = ({ item }: { item: Publication }) => {
    return (
      <TouchableOpacity style={styles.publicationItem}>
        <Image source={{ uri: item.imageUrl }} style={styles.publicationImage} />
        <Text style={styles.publicationTitle}>{item.title}</Text>
      </TouchableOpacity>
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro que deseas cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Sí, cerrar sesión",
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              await AsyncStorage.removeItem('userToken');
              router.replace('/login');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Hubo un problema al cerrar sesión');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileHeader}>
          <Image 
            source={profile.profileImage} 
            style={styles.profileImage} 
          />
          <Text style={styles.userName}>{profile.name}</Text>
          <Text style={styles.userOrigin}>{profile.origin}</Text>
        </View>
        
        <View style={styles.interestsContainer}>
          <Text style={styles.interestsTitle}>Intereses</Text>
          {profile.interests && profile.interests.length > 0 ? (
            profile.interests.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noInterests}>No hay intereses añadidos</Text>
          )}
        </View>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="pencil" size={18} color="#fff" />
            <Text style={styles.editButtonText}>Editar Perfil</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out" size={18} color="#fff" />
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.publicationsContainer}>
        <Text style={styles.publicationsTitle}>Mis Publicaciones</Text>
        {profile.publications && profile.publications.length > 0 ? (
          <FlatList
            data={profile.publications}
            renderItem={renderPublication}
            keyExtractor={(item, index) => item.id || `pub-${index}`}
            horizontal={false}
            numColumns={2}
            contentContainerStyle={styles.publicationsList}
          />
        ) : (
          <Text style={styles.noPublications}>No tienes publicaciones todavía</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userOrigin: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  interestsContainer: {
    marginVertical: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  interestsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
    marginBottom: 5,
  },
  interestTag: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: '#333',
  },
  noInterests: {
    color: '#999',
    fontStyle: 'italic',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  editButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 10,
  },
  editButtonText: {
    color: '#fff',
    marginLeft: 5,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoutButtonText: {
    color: '#fff',
    marginLeft: 5,
  },
  publicationsContainer: {
    flex: 1,
    padding: 15,
  },
  publicationsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  publicationsList: {
    padding: 5,
  },
  publicationItem: {
    flex: 1,
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  publicationImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  publicationTitle: {
    padding: 10,
    fontWeight: 'bold',
  },
  noPublications: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 30,
  }
});