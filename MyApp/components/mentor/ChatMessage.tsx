import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChatMessage as MessageType } from '../../services/mentorService';
import { formatTimeAgo } from '../../utils/formatters';

interface ChatMessageProps {
  message: MessageType;
  isOwnMessage: boolean;
}

export default function ChatMessage({ 
  message, 
  isOwnMessage 
}: ChatMessageProps) {
  return (
    <View style={[
      styles.container,
      isOwnMessage ? styles.ownContainer : styles.otherContainer
    ]}>
      <View style={[
        styles.bubble,
        isOwnMessage ? styles.ownBubble : styles.otherBubble
      ]}>
        <Text style={styles.messageText}>{message.text}</Text>
        <Text style={styles.timestamp}>
          {message.timestamp ? formatTimeAgo(message.timestamp) : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownContainer: {
    alignSelf: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    padding: 12,
    borderRadius: 18,
  },
  ownBubble: {
    backgroundColor: '#bb86fc',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
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