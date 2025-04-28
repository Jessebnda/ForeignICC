import React, { useState, useEffect } from 'react';
import { FlatList, View, Text, Image, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firestore } from '../../firebase';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';

// Interfaces
interface Mentor {
  id: string;
  name?: string;
  photo?: string;
  areas?: string[];
  email?: string;
}

const defaultUserImage = require('../../assets/images/img7.jpg');

export default function MentorListScreen() {
  const router = useRouter();
  const { userProfile } = useUser();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArea, setActiveArea] = useState<string | null>(null);

  // Áreas disponibles (combinación de intereses del usuario y áreas de mentores)
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);

  // Cargar mentores
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoading(true);
        // Consultar usuarios que son mentores
        const q = query(
          collection(firestore, 'users'),
          where('isMentor', '==', true)
        );
        
        const snapshot = await getDocs(q);
        const mentorsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as any
        })) as Mentor[];

        // Solo usar los intereses del usuario para filtrado
        // en lugar de combinar con todas las áreas de mentores
        const userInterests = userProfile?.interests || [];
        setAvailableAreas(userInterests.sort());
        setMentors(mentorsList);
        setFilteredMentors(mentorsList);
      } catch (error) {
        console.error('Error al cargar mentores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, [userProfile]);

  // Filtrar mentores cuando cambia la búsqueda o área seleccionada
  useEffect(() => {
    let filtered = [...mentors];
    
    // Filtrar por búsqueda de texto
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(mentor =>
        mentor.name?.toLowerCase().includes(lowercasedQuery) ||
        mentor.areas?.some(area => area.toLowerCase().includes(lowercasedQuery))
      );
    }
    
    // Filtrar por área seleccionada
    if (activeArea) {
      filtered = filtered.filter(mentor =>
        mentor.areas?.some(area => area.toLowerCase() === activeArea.toLowerCase())
      );
    }
    
    setFilteredMentors(filtered);
  }, [searchQuery, activeArea, mentors]);

  // Actualizar el método goToChat para usar el formato correcto de parámetros
  const goToChat = (mentor: Mentor) => {
    router.push({
      pathname: '/extra/mentor-chat',  // Asegúrate que esta sea la ruta correcta
      params: { 
        friendId: mentor.id,
        friendName: mentor.name || 'Mentor',
        friendPhotoURL: mentor.photo || '',
        mentorAreas: mentor.areas?.join(', ') || ''
      }
    });
  };

  const handleAreaSelect = (area: string) => {
    if (activeArea === area) {
      setActiveArea(null); // Desactivar filtro activo
    } else {
      setActiveArea(area); // Activar nuevo filtro
    }
  };

  // Componente para chips de áreas
  const renderAreaChips = () => (
    <FlatList
      horizontal
      data={availableAreas}
      keyExtractor={(item) => item}
      renderItem={({ item }) => (
        <TouchableOpacity 
          style={[
            styles.areaChip, 
            activeArea === item && styles.areaChipActive,
          ]}
          onPress={() => handleAreaSelect(item)}
        >
          <Text 
            style={[
              styles.areaChipText,
              activeArea === item && styles.areaChipTextActive
            ]}
          >
            {item}
          </Text>
        </TouchableOpacity>
      )}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.areaChipsContainer}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b388ff" />
        <Text style={styles.loadingText}>Cargando mentores...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar mentores..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {renderAreaChips()}

      <FlatList
        data={filteredMentors}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => goToChat(item)}>
            <Image 
              source={item.photo ? { uri: item.photo } : defaultUserImage} 
              style={styles.avatar} 
            />
            <View style={styles.mentorInfo}>
              <Text style={styles.name}>{item.name || 'Mentor sin nombre'}</Text>
              <Text style={styles.area}>
                {item.areas?.join(', ') || 'Sin áreas especificadas'}
              </Text>
            </View>
            <Ionicons name="chatbubble-outline" size={24} color="#b388ff" style={styles.chatIcon} />
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No se encontraron mentores{searchQuery || activeArea ? ' con esos criterios' : ''}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212',
    paddingTop: 8
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#fff',
    fontSize: 16,
  },
  areaChipsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  areaChip: { 
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bb86fc', // Color rosado/púrpura como en profile.tsx
    flexDirection: 'row',
    alignItems: 'center',
  },
  areaChipActive: {
    backgroundColor: '#b388ff33',
    borderColor: '#e91e63', // Rosa más intenso cuando está activo
  },
  areaChipText: { 
    color: '#fff',
    fontSize: 13,  // Igual que
  },
  areaChipTextActive: {
    color: '#b388ff',
    fontWeight: 'bold',
   
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
  },
  list: {
    padding: 16,
  },
  card: { 
    flexDirection: 'row', 
    padding: 16, 
    alignItems: 'center', 
    borderRadius: 10, 
    backgroundColor: '#1e1e1e', 
    marginBottom: 12, 
    elevation: 2 
  },
  avatar: { 
    width: 55, 
    height: 55, 
    borderRadius: 27.5, 
    marginRight: 12 
  },
  mentorInfo: {
    flex: 1,
  },
  name: { 
    fontWeight: 'bold', 
    color: '#fff', 
    fontSize: 16 
  },
  area: { 
    color: '#ccc', 
    fontSize: 14,
    marginTop: 4
  },
  chatIcon: {
    marginLeft: 8
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
});
