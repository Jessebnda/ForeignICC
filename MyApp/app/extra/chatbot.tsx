// app/(tabs)/chatbot.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { fetchChatbotAnswer } from '../services/api_service';
import type { ChatMessage } from '../models/chat_message';
import MaxWidthContainer from '../../components/MaxWidthContainer';

const CHATBOT_URL = 'https://magicloops.dev/api/loop/624ec5d5-053b-4ad4-a4fe-0b00bddc2a50/run';

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { text: input, isUser: true }]);
    setLoading(true);
    const userText = input;
    setInput('');
    try {
      const answer = await fetchChatbotAnswer({ question: userText, chatbotUrl: CHATBOT_URL });
      setMessages((prev) => [...prev, { text: answer, isUser: false }]);
    } catch (err) {
      setMessages((prev) => [...prev, { text: 'Error al comunicarse con el chatbot.', isUser: false }]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.messageContainer, item.isUser ? styles.userMessage : styles.botMessage]}>
      <Text style={item.isUser ? styles.userText : styles.botText}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 100}
    >
      <MaxWidthContainer style={{maxWidth: 768}}>
        <FlatList
          data={messages}
          keyExtractor={(_, i) => `msg-${i}`}
          renderItem={renderItem}
          style={styles.messageList}
          contentContainerStyle={{ padding: 8 }}
        />
        {loading && <ActivityIndicator style={{ margin: 8 }} color="#bb86fc" />}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Escribe tu mensaje..."
            placeholderTextColor="#888"
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={loading}>
            <Text style={styles.sendButtonText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </MaxWidthContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  messageList: { flex: 1 },
  messageContainer: { padding: 10, marginVertical: 4, borderRadius: 16, maxWidth: '80%' },
  userMessage: { alignSelf: 'flex-end', backgroundColor: '#D1C4E9' },
  botMessage: { alignSelf: 'flex-start', backgroundColor: '#424242' },
  userText: { color: '#000', fontSize: 15 },
  botText: { color: '#fff', fontSize: 15 },
  inputContainer: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#333', padding: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#333', borderRadius: 8, paddingHorizontal: 10, color: '#fff' },
  sendButton: { backgroundColor: '#6200ee', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, marginLeft: 8 },
  sendButtonText: { color: '#fff', fontWeight: 'bold' },
});
