import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { formatTimeAgo } from '../../utils/formatters';

interface ChatbotMessageProps {
  text: string;
  timestamp: any;
  isUser: boolean;
}

export default function ChatbotMessage({ 
  text, 
  timestamp, 
  isUser 
}: ChatbotMessageProps) {
  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.botContainer
    ]}>
      {!isUser && (
        <Image 
          source={require('../../assets/images/img7.jpg')} 
          style={styles.botAvatar} 
        />
      )}
      
      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.botBubble
      ]}>
        <Text style={styles.messageText}>{text}</Text>
        <Text style={styles.timestamp}>
          {timestamp ? formatTimeAgo(timestamp) : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  botContainer: {
    alignSelf: 'flex-start',
  },
  botAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  bubble: {
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#bb86fc',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#2c2c2c',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#fff',
    fontSize: 15,
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
});