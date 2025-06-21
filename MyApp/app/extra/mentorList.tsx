import React, { useState } from 'react';
import { 
  View, 
  FlatList, 
  TextInput, 
  StyleSheet, 
  ActivityIndicator, 
  Text,
  RefreshControl,
  TouchableOpacity,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUser } from '../../context/UserContext';
import { useMentors } from '../../hooks/useMentors';
import MentorCard from '../../components/mentor/MentorCard';
import { Mentor } from '../../services/mentorService';
import MentorDetailModal from '../../components/mentor/MentorDetailModal';

export default function MentorListScreen() {
  const router = useRouter();
  const { userProfile } = useUser();
  const userUniversity = userProfile?.university;
  
  const { 
    mentors, 
    loading, 
    refreshing, 
    filter, 
    updateFilter, 
    refreshMentors 
  } = useMentors(userUniversity);
  
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const handleSelectMentor = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setModalVisible(true);
  };
  
  const handleStartChat = (mentorId: string) => {
    setModalVisible(false);
    router.push({
      pathname: '/extra/mentorChat',
      params: { mentorId }
    });
  };
  
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#bb86fc" />
        <Text style={styles.loadingText}>Cargando mentores...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar mentores..."
          placeholderTextColor="#888"
          value={filter.searchTerm}
          onChangeText={(text) => updateFilter({ searchTerm: text })}
        />
      </View>
      
      <View style={styles.filterOptions}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter.university === null && styles.activeFilter
          ]}
          onPress={() => updateFilter({ university: null })}
        >
          <Text style={styles.filterText}>Todos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filter.university === userUniversity && styles.activeFilter
          ]}
          onPress={() => updateFilter({ university: userUniversity })}
        >
          <Text style={styles.filterText}>Mi universidad</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={mentors}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <MentorCard 
            mentor={item} 
            onPress={handleSelectMentor} 
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshMentors} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#555" />
            <Text style={styles.emptyText}>
              No se encontraron mentores disponibles
            </Text>
            <Text style={styles.emptySubText}>
              Intenta con otros filtros o vuelve más tarde
            </Text>
          </View>
        }
      />
      
      <MentorDetailModal
        isVisible={modalVisible}
        mentor={selectedMentor}
        onClose={() => setModalVisible(false)}
        onStartChat={(mentorId: string) => handleStartChat(mentorId)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    marginVertical: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: '#fff',
    fontSize: 16,
  },
  filterOptions: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#2c2c2c',
  },
  activeFilter: {
    backgroundColor: '#bb86fc',
  },
  filterText: {
    color: '#fff',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
