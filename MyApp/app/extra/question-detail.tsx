import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { firestore } from '../../firebase';
import { getAuth } from 'firebase/auth';

interface ForumUser {
  name: string;
  image: string;
}

interface ForumAnswer {
  id: string;
  content: string;
  timestamp: any;
  user: ForumUser;
}

export default function QuestionDetailScreen() {
  const { question } = useLocalSearchParams();
  const parsedQuestion = question ? JSON.parse(question as string) : null;
  const [answers, setAnswers] = useState<ForumAnswer[]>([]);
  const [newAnswer, setNewAnswer] = useState('');
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (!parsedQuestion?.id) return;
    const q = query(
      collection(firestore, 'forumQuestions', parsedQuestion.id, 'answers'),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ForumAnswer[];
      setAnswers(fetched);
    });
    return () => unsubscribe();
  }, [parsedQuestion?.id]);

  const sendAnswer = async () => {
    if (!newAnswer.trim() || !user) return;
    const answer = {
      content: newAnswer.trim(),
      timestamp: Timestamp.now(),
      user: {
        name: user.displayName || 'Usuario sin nombre',
        image: user.photoURL || '',
      },
    };
    await addDoc(collection(firestore, 'forumQuestions', parsedQuestion.id, 'answers'), answer);
    setNewAnswer('');
  };

  const renderAvatar = (source: string) => {
    if (source.startsWith('data:')) return { uri: source };
    if (source) return { uri: source };
    return require('../../assets/images/img7.jpg');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{parsedQuestion?.title}</Text>
      <FlatList
        data={answers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.answerCard}>
            <Image source={renderAvatar(item.user.image)} style={styles.avatar} />
            <View style={styles.answerContent}>
              <Text style={styles.userName}>{item.user.name}</Text>
              <Text style={styles.timestamp}>{new Date(item.timestamp?.toDate?.()).toLocaleString()}</Text>
              <Text style={styles.answerText}>{item.content}</Text>
            </View>
          </View>
        )}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe una respuesta..."
          placeholderTextColor="#888"
          value={newAnswer}
          onChangeText={setNewAnswer}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, !newAnswer.trim() && styles.sendButtonDisabled]} 
          onPress={sendAnswer}
          disabled={!newAnswer.trim()}
        >
          <Ionicons name="send" size={20} color={newAnswer.trim() ? '#fff' : '#888'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#121212' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  answerCard: {
    flexDirection: 'row',
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, borderWidth: 2, borderColor: '#bb86fc' },
  answerContent: { flex: 1 },
  userName: { color: '#fff', fontWeight: 'bold' },
  timestamp: { fontSize: 12, color: '#888', marginBottom: 4 },
  answerText: { color: '#fff', lineHeight: 20 },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1e1e1e',
  },
  input: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#fff',
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#bb86fc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
});
