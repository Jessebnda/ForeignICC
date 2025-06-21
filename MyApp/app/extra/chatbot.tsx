// app/(tabs)/chatbot.tsx
import React, { useRef, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { fetchChatbotAnswer } from '../../services/api_service';
import type { ChatMessage } from '../models/chat_message';
import MaxWidthContainer from '../../components/MaxWidthContainer';
import ChatbotMessage from '../../components/mentor/ChatbotMessage';

const CHATBOT_URL = 'https://magicloops.dev/api/loop/624ec5d5-053b-4ad4-a4fe-0b00bddc2a50/run';

export default function ChatbotScreen() {
  const auth = getAuth();
  const userId = auth.currentUser?.uid || 'anonymous';
  const flatListRef = useRef<FlatList>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [responding, setResponding] = useState(false);

  // Scroll al final cuando llegan nuevos mensajes
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    setMessages([...messages, { text: inputMessage, isUser: true }]);
    setLoading(true);
    const userText = inputMessage;
    setInputMessage('');
    try {
      setResponding(true);
      const answer = await fetchChatbotAnswer({ question: userText, chatbotUrl: CHATBOT_URL });
      setMessages((prev) => [...prev, { text: answer, isUser: false }]);
    } catch (err) {
      setMessages((prev) => [...prev, { text: 'Error al comunicarse con el chatbot.', isUser: false }]);
    } finally {
      setLoading(false);
      setResponding(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
  };
  
  const handleSend = () => {
    sendMessage();
  };
  
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#bb86fc" />
        <Text style={styles.loadingText}>Iniciando chatbot...</Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Asistente Foreign</Text>
        <TouchableOpacity onPress={clearConversation}>
          <Ionicons name="refresh" size={24} color="#888" />
        </TouchableOpacity>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <ChatbotMessage
            text={item.text}
            timestamp={item.timestamp}
            isUser={item.sender === 'user'}
          />
        )}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
      />
      
      {responding && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>El asistente está escribiendo...</Text>
          <ActivityIndicator size="small" color="#bb86fc" />
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe tu pregunta..."
          placeholderTextColor="#888"
          value={inputMessage}
          onChangeText={setInputMessage}
          multiline
          maxLength={500}
          editable={!responding}
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!inputMessage.trim() || responding) && styles.sendButtonDisabled
          ]} 
          onPress={handleSend}
          disabled={!inputMessage.trim() || responding}
        >
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    color: '#888',
    fontSize: 14,
    marginRight: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1e1e1e',
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#bb86fc',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#555',
  },
});
