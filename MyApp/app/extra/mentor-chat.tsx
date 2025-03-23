import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Platform, KeyboardAvoidingView, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import type { ChatMessage } from '../models/chat_message';

export default function MentorChatScreen() {
  const { mentor: mentorParam } = useLocalSearchParams();
  const mentor = mentorParam ? JSON.parse(mentorParam as string) : { name: '', image: require('../../assets/images/img7.jpg') };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { text: input, isUser: true }]);
    setInput('');
  };

  const renderItem = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.message, item.isUser ? styles.userMessage : styles.mentorMessage]}>
      <Text style={item.isUser ? styles.userText : styles.mentorText}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <View style={styles.mentorImageContainer}>
          <Image source={mentor.image} style={styles.mentorImage} />
        </View>
        <Text style={styles.mentorName}>{mentor.name}</Text>
      </View>
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(_, i) => `msg-${i}`}
        style={styles.messageList}
        contentContainerStyle={{ padding: 8 }}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Escribe tu mensaje..."
          placeholderTextColor="#888"
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', paddingTop: Platform.OS === 'ios' ? 50 : 20 },
  header: { alignItems: 'center', marginBottom: 12 },
  mentorImageContainer: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden', marginBottom: 8 },
  mentorImage: { width: '100%', height: '100%' },
  mentorName: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  messageList: { flex: 1 },
  message: { padding: 10, marginVertical: 4, borderRadius: 16, maxWidth: '75%' },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#D1C4E9' },
  mentorMessage: { alignSelf: 'flex-start', backgroundColor: '#424242' },
  userText: { color: '#000', fontSize: 15 },
  mentorText: { color: '#fff', fontSize: 15 },
  inputContainer: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#333', padding: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#333', borderRadius: 8, paddingHorizontal: 10, color: '#fff' },
  sendButton: { backgroundColor: '#6200ee', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginLeft: 8 },
  sendButtonText: { color: '#fff', fontWeight: 'bold' },
});
