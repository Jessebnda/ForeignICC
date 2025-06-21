import { useState, useEffect, useCallback } from 'react';
import { getMentors, getMentorsByUniversity, Mentor } from '../services/mentorService';

export function useMentors(userUniversity?: string) {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<{
    university: string | null;
    searchTerm: string;
  }>({
    university: userUniversity || null,
    searchTerm: ''
  });
  
  // Cargar mentores
  const loadMentors = useCallback(async () => {
    try {
      let loadedMentors: Mentor[];
      
      if (filter.university) {
        loadedMentors = await getMentorsByUniversity(filter.university);
      } else {
        loadedMentors = await getMentors();
      }
      
      setMentors(loadedMentors);
      applyFilters(loadedMentors, filter.searchTerm);
    } catch (error) {
      console.error('Error cargando mentores:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter.university]);
  
  // Aplicar filtros
  const applyFilters = (mentorsList: Mentor[], searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredMentors(mentorsList);
      return;
    }
    
    const term = searchTerm.toLowerCase().trim();
    const filtered = mentorsList.filter(mentor => 
      mentor.name.toLowerCase().includes(term) ||
      mentor.university.toLowerCase().includes(term) ||
      mentor.topics?.some(topic => topic.toLowerCase().includes(term))
    );
    
    setFilteredMentors(filtered);
  };
  
  // Efecto para cargar mentores iniciales
  useEffect(() => {
    loadMentors();
  }, [loadMentors]);
  
  // Efecto para aplicar filtros cuando cambia el término de búsqueda
  useEffect(() => {
    applyFilters(mentors, filter.searchTerm);
  }, [filter.searchTerm, mentors]);
  
  // Actualizar filtros
  const updateFilter = (newFilter: Partial<typeof filter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  };
  
  // Refrescar mentores
  const refreshMentors = () => {
    setRefreshing(true);
    loadMentors();
  };
  
  return {
    mentors: filteredMentors,
    loading,
    refreshing,
    filter,
    updateFilter,
    refreshMentors
  };
}