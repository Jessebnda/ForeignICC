import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  isSearching: boolean;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChangeText,
  onSubmit,
  onClear,
  isSearching,
  placeholder = 'Buscar lugares...'
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#888"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        
        {isSearching ? (
          <ActivityIndicator size="small" color="#bb86fc" />
        ) : value ? (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 24,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
});