import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '../../services/userService';
interface MentorDetailModalProps {
  mentor: UserProfile | null;
  isVisible: boolean;
  onStartChat?: (mentorId: string) => void;
  onClose: () => void;
}

export default function MentorDetailModal({ mentor, isVisible, onClose }: MentorDetailModalProps) {
  if (!mentor) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <ScrollView contentContainerStyle={styles.contentWrapper}>
          <View style={styles.modalCard}>
            {/* Botón de cierre */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close-circle" size={32} color="#aaa" />
            </TouchableOpacity>

            {/* Imagen del mentor */}
            <Image
              source={
                mentor.photo
                  ? typeof mentor.photo === 'string'
                    ? { uri: mentor.photo }
                    : mentor.photo
                  : require('../../assets/images/img7.jpg')
              }
              style={styles.avatar}
            />

            {/* Nombre */}
            <Text style={styles.name}>{mentor.name}</Text>

            {/* Universidad */}
            {mentor.university && (
              <Text style={styles.detail}>🎓 Universidad: {mentor.university}</Text>
            )}

            {/* Origen */}
            {mentor.origin && (
              <Text style={styles.detail}>📍 Origen: {mentor.origin}</Text>
            )}

            {/* Intereses */}
            {mentor.interests && mentor.interests.length > 0 && (
              <View style={styles.interestsContainer}>
                <Text style={styles.sectionTitle}>Intereses:</Text>
                {mentor.interests.map((interest, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{interest}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Cerrar */}
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  contentWrapper: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderColor: '#bb86fc',
    borderWidth: 2,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  detail: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 5,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#bb86fc',
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    fontSize: 16,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tag: {
    backgroundColor: '#2a2a2a',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    margin: 4,
  },
  tagText: {
    color: '#fff',
    fontSize: 13,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#bb86fc',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
