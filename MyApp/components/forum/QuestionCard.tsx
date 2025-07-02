import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ForumQuestion } from '../../services/forumService';
import { formatTimeAgo } from '../../utils/formatters';

interface QuestionCardProps {
  question: ForumQuestion;
  onPress: () => void;
  onUserPress: (userId: string) => void;
}

const renderAvatar = (source: any) => {
  try {
    if (source && typeof source === 'object' && source.uri) {
      return source;
    }
    
    if (source && typeof source === 'string' && 
        (source.startsWith('http') || source.startsWith('data:'))) {
      const cacheBuster = `?t=${Date.now()}`;
      const imageUri = source.includes('?') ? source : source + cacheBuster;
      return { uri: imageUri };
    }
    
    return require('../../assets/images/img7.jpg');
  } catch (e) {
    console.log('Error renderizando avatar:', e);
    return require('../../assets/images/img7.jpg');
  }
};

export default function QuestionCard({ question, onPress, onUserPress }: QuestionCardProps) {
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => onUserPress(question.user.id)}
          >
            <Image 
              source={renderAvatar(question.user.photo)} 
              style={styles.avatar} 
            />
            <View>
              <Text style={styles.userName}>{question.user.name}</Text>
              <Text style={styles.timestamp}>{formatTimeAgo(question.timestamp)}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.title}>{question.title}</Text>

      <View style={styles.cardFooter}>
        <View style={styles.stats}>
          <Ionicons name="chatbubble-outline" size={20} color="#bb86fc" />
          <Text style={styles.answerCount}>
            {question.answerCount || 0} {question.answerCount === 1 ? 'respuesta' : 'respuestas'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#bb86fc',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#bb86fc',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#fff',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  answerCount: {
    color: '#bb86fc',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  answerButton: {
    backgroundColor: '#2c1a47',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerButtonText: {
    color: '#bb86fc',
    fontSize: 14,
    fontWeight: '600',
  },
});