import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FilterOption {
  id: string;
  label: string;
  icon: string;
}

interface FilterButtonsProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

export default function FilterButtons({ selectedFilter, onFilterChange }: FilterButtonsProps) {
  const filters: FilterOption[] = [
    { id: 'all', label: 'Todos', icon: 'globe' },
    { id: 'university', label: 'Universidades', icon: 'school' },
    { id: 'restaurant', label: 'Restaurantes', icon: 'restaurant' },
    { id: 'housing', label: 'Alojamiento', icon: 'home' },
    { id: 'entertainment', label: 'Entretenimiento', icon: 'film' },
    { id: 'transport', label: 'Transporte', icon: 'bus' },
    { id: 'other', label: 'Otros', icon: 'location' },
  ];
  
  return (
    <ScrollView 
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {filters.map(filter => (
        <TouchableOpacity
          key={filter.id}
          style={[
            styles.filterButton,
            selectedFilter === filter.id && styles.selectedFilter
          ]}
          onPress={() => onFilterChange(filter.id)}
        >
          <Ionicons 
            name={filter.icon as any} 
            size={16} 
            color={selectedFilter === filter.id ? '#fff' : '#888'} 
          />
          <Text style={[
            styles.filterLabel,
            selectedFilter === filter.id && styles.selectedLabel
          ]}>
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  selectedFilter: {
    backgroundColor: '#bb86fc',
  },
  filterLabel: {
    marginLeft: 6,
    fontSize: 14,
    color: '#888',
  },
  selectedLabel: {
    color: '#fff',
    fontWeight: 'bold',
  },
});