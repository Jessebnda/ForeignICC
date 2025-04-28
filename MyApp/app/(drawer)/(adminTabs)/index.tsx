import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      

      
      {/* Subtitle */}
      <Text style={styles.subtitle}>Gestión de Estudiantes</Text>
      
      {/* Student Count Card */}
      <View style={styles.card}>
        <Ionicons name="person-outline" size={28} color="#b388ff" />
        <Text style={styles.countNumber}>0</Text>
        <Text style={styles.countLabel}>Total de Estudiantes</Text>
      </View>
      
      {/* Action Button */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Ir a la gestión de Estudiantes</Text>
      </TouchableOpacity>
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  menuIcon: {
    width: 40,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptySpace: {
    width: 40,
  },
  subtitle: {
    color: '#b388ff',
    marginTop: 20,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
  },
  countNumber: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  countLabel: {
    color: '#fff',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#b388ff',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomIconContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});