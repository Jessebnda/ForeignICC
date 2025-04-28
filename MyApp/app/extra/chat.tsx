import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, Image, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Platform,
  KeyboardAvoidingView, useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // <-- importar
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase';              
import { useChatMessages, sendMessage, generateChatId, RealtimeChatMessage } from '../services/chatService';

const defaultUserImage = require('../../assets/images/img7.jpg');

export default function ChatScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();                                // <-- hook
  const navigation = useNavigation();
  const { friendId, friendName } = useLocalSearchParams<{ friendId: string; friendName: string }>();
  const currentUser = getAuth().currentUser;
  const [input, setInput] = useState('');
  const [photoUri, setPhotoUri] = useState<string>();

  // 1) Generar chatId, recoger mensajes, ordenarlos…
  const chatId = useMemo(() => {
    if (!currentUser || !friendId) return null;
    return generateChatId(currentUser.uid, friendId);
  }, [currentUser, friendId]);
  const messages = useChatMessages(chatId);
  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => a.timestamp - b.timestamp),
    [messages]
  );

  // 2) Recuperar foto del amigo directamente de Firestore
  useEffect(() => {
    if (!friendId) return;
    (async () => {
      const snap = await getDoc(doc(firestore, 'users', friendId));
      if (snap.exists()) {
        const data = snap.data();
        // tu campo podría llamarse 'photo' o 'photoURL'
        setPhotoUri(data.photo as string || data.photoURL as string);
      }
    })();
  }, [friendId]);

  const handleSend = () => {
    if (chatId && input.trim()) {
      sendMessage(chatId, input.trim());
      setInput('');
    }
  };

  const renderItem = ({ item }: { item: RealtimeChatMessage }) => {
    const isUser = item.from === currentUser?.uid;
    return (
      <View
        style={[
          styles.bubble,
          {
            maxWidth: width * 0.75,
            alignSelf: isUser ? 'flex-end' : 'flex-start',
            // Envíos en morado, recibidos en gris
            backgroundColor: isUser ? '#8B5CF6' : '#424242',
          },
        ]}
      >
        <Text style={[styles.text, { color: '#fff' }]}>
          {item.text}
        </Text>
      </View>
    );
  };

  // tras calcular sortedMessages:
  const uniqueMessages = useMemo(() => {
    const seen = new Set<string>();
    return sortedMessages.filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [sortedMessages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 70}
    >
      {/* header y FlatList… */}
      <View style={styles.profileHeader}>
        <Image
          source={photoUri ? { uri: photoUri } : defaultUserImage}
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>{friendName || 'Chat'}</Text>
      </View>
      <FlatList
        data={uniqueMessages}                // usa la lista deduplicada
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      {/* Footer: elevamos 2px la línea de separación */}
      <View
        style={[
          styles.inputRow,
          {
            paddingBottom: (insets.bottom || 0) + 2, // mantén algo de espacio al fondo
          
          }
        ]}
      >
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#888"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Text style={styles.sendText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // mismo negro que Feed
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#121212',
  },
  profileImage: {
    width: 80, height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#bb86fc',
  },
  profileName: {
    marginTop: 8,
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  list: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  bubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginVertical: 4,
    flexShrink: 1,
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderColor: '#333',
    backgroundColor: '#121212',
  },
  input: {
    flex: 1,
    backgroundColor: '#333',
    height: 44,
    borderRadius: 20,
    paddingHorizontal: 16,
    color: '#fff',
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: '#8B5CF6',
    height: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});