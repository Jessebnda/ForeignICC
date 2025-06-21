import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatSession } from '../../services/mentorService';
import { formatTimeAgo } from '../../utils/formatters';

interface ChatSessionCardProps {
  session: ChatSession;
  isMentor: boolean;
  onPress: (session: ChatSession) => void;
}

export default function ChatSessionCard({ 
  session, 
  isMentor, 
  onPress 
}: ChatSessionCardProps) {
  const person = isMentor ? session.student : session.mentor;
  
  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => onPress(session)}
      activeOpacity={0.8}
    >
      <View style={styles.contentRow}>
        <Image
          source={
            person?.photo 
              ? { uri: person.photo } 
              : require('../../assets/images/img7.jpg')
          }
          style={styles.avatar}
        />
        
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{person?.name || 'Usuario'}</Text>
          
          <Text 
            style={styles.message} 
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {session.lastMessage}
          </Text>
          
          {session.lastMessageTimestamp && (
            <Text style={styles.timestamp}>
              {formatTimeAgo(session.lastMessageTimestamp)}
            </Text>
          )}
        </View>
        
        {session.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{session.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    marginHorizontal: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#bb86fc',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#ddd',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
  },
  unreadBadge: {
    backgroundColor: '#bb86fc',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadCount: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
});