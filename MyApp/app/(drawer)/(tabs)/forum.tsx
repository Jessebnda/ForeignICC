import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { getAuth } from 'firebase/auth';

interface ForumUser {
  name: string;
  image: string;
}

interface ForumQuestion {
  id: string;
  title: string;
  timestamp: any;
  user: ForumUser;
}

export default function ForumScreen() {
  const router = useRouter();
  const [forumData, setForumData] = useState<ForumQuestion[]>([]);
  const [question, setQuestion] = useState('');
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const q = query(collection(firestore, 'forumQuestions'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const questions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ForumQuestion[];
      setForumData(questions);
    });
    return () => unsubscribe();
  }, []);

  const addQuestion = async () => {
    if (!question.trim() || !user) return;

    const newQuestion = {
      title: question.trim(),
      timestamp: Timestamp.now(),
      user: {
        name: user.displayName || 'Usuario sin nombre',
        image: user.photoURL || '',
      },
    };
    await addDoc(collection(firestore, 'forumQuestions'), newQuestion);
    setQuestion('');
  };

  const goToQuestionDetail = (item: ForumQuestion) => {
    router.push({
      pathname: '../extra/question-detail',
      params: { question: JSON.stringify(item) },
    });
  };

  const renderAvatar = (source: string) => {
    if (typeof source === 'string' && source.startsWith('data:')) {
      return { uri: source };
    } else if (typeof source === 'string') {
      return { uri: source };
    }
    return require('../../../assets/images/img7.jpg');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={forumData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => goToQuestionDetail(item)}>
            <View style={styles.cardHeader}>
              <View style={styles.userInfo}>
                <Image source={renderAvatar(item.user.image)} style={styles.avatar} />
                <View>
                  <Text style={styles.userName}>{item.user.name}</Text>
                  <Text style={styles.timestamp}>{new Date(item.timestamp?.toDate?.()).toLocaleString() || '...'}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.moreButton}>
                <Ionicons name="ellipsis-horizontal" size={20} color="#888" />
              </TouchableOpacity>
            </View>

            <Text style={styles.title}>{item.title}</Text>

            <View style={styles.cardFooter}>
              <View style={styles.stats}>
                <Ionicons name="chatbubble-outline" size={16} color="#888" />
                <Text style={styles.statText}>Ver respuestas</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe tu pregunta..."
          placeholderTextColor="#888"
          value={question}
          onChangeText={setQuestion}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !question.trim() && styles.sendButtonDisabled]}
          onPress={addQuestion}
          disabled={!question.trim()}
        >
          <Ionicons name="send" size={20} color={question.trim() ? '#fff' : '#888'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#121212' },
  card: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
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
  moreButton: {
    padding: 8,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#888',
    marginLeft: 6,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#fff',
    backgroundColor: '#1e1e1e',
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