import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Mentor } from '../../services/mentorService';

interface MentorCardProps {
  mentor: Mentor;
  onPress: (mentor: Mentor) => void;
}

export default function MentorCard({ mentor, onPress }: MentorCardProps) {
  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => onPress(mentor)}
      activeOpacity={0.8}
    >
      <View style={styles.contentRow}>
        <Image
          source={
            mentor.photo 
              ? { uri: mentor.photo } 
              : require('../../assets/images/img7.jpg')
          }
          style={styles.avatar}
        />
        
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{mentor.name}</Text>
          
          <View style={styles.universityRow}>
            <Ionicons name="school-outline" size={14} color="#bb86fc" />
            <Text style={styles.university}>{mentor.university}</Text>
          </View>
          
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.rating}>{mentor.rating || 4.5}</Text>
          </View>
        </View>
      </View>
      
      {mentor.topics && mentor.topics.length > 0 && (
        <View style={styles.tagsContainer}>
          {mentor.topics.slice(0, 3).map((topic, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{topic}</Text>
            </View>
          ))}
          {mentor.topics.length > 3 && (
            <Text style={styles.moreTag}>+{mentor.topics.length - 3}</Text>
          )}
        </View>
      )}
      
      <View style={styles.footer}>

        
        <View style={styles.chatButton}>
          <Ionicons name="chatbubble-outline" size={16} color="#fff" />
          <Text style={styles.chatButtonText}>Contactar</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#bb86fc',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  universityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  university: {
    fontSize: 14,
    color: '#bb86fc',
    marginLeft: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#FFD700',
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tag: {
    backgroundColor: '#2c2c2c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    color: '#ddd',
    fontSize: 12,
  },
  moreTag: {
    color: '#888',
    fontSize: 12,
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  status: {
    fontSize: 12,
    color: '#03dac6',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#bb86fc',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});