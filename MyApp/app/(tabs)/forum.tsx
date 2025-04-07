// app/tabs/forum.tsx
import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Button, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';



const initialForumData = [
  {
    id: 'q1',
    title: '¿Qué lugares recomiendas para salir de noche?',
    user: { name: 'María López', image: require('../../assets/images/img7.jpg') },
    timestamp: 'Hace 2 horas',
    answers: [
      {
        id: 'a1',
        user: { name: 'Ana', image: require('../../assets/images/img7.jpg') },
        timestamp: 'Hace 1 hora',
        content: 'Puedes ir al centro, hay varios bares y música en vivo.',
        likes: 5,
        comments: [
          { id: 'c1', user: { name: 'Luis', image: require('../../assets/images/img7.jpg') }, content: 'Suena interesante', timestamp: 'Hace 30 min' },
          { id: 'c2', user: { name: 'Elena', image: require('../../assets/images/img7.jpg') }, content: 'Me apunto!', timestamp: 'Hace 15 min' }
        ],
      },
      {
        id: 'a2',
        user: { name: 'Carlos', image: require('../../assets/images/img7.jpg') },
        timestamp: 'Hace 30 minutos',
        content: 'También hay eventos en la zona del malecón los fines de semana.',
        likes: 2,
        comments: [
          { id: 'c3', user: { name: 'Roberto', image: require('../../assets/images/img7.jpg') }, content: 'Gracias por la info', timestamp: 'Hace 20 min' },
          { id: 'c4', user: { name: 'Sofía', image: require('../../assets/images/img7.jpg') }, content: 'Me gusta la idea', timestamp: 'Hace 10 min' }
        ],
      },
    ],
  },
  {
    id: 'q2',
    title: '¿Algún restaurante imperdible en Mexicali?',
    user: { name: 'Javier Rodríguez', image: require('../../assets/images/img7.jpg') },
    timestamp: 'Hace 1 día',
    answers: [
      {
        id: 'a3',
        user: { name: 'Pedro', image: require('../../assets/images/img7.jpg') },
        timestamp: 'Hace 22 horas',
        content: 'Yo recomiendo "La Casa Sonora", carne asada increíble.',
        likes: 7,
        comments: [
          { id: 'c5', user: { name: 'Diana', image: require('../../assets/images/img7.jpg') }, content: '¿Dónde queda?', timestamp: 'Hace 21 horas' },
          { id: 'c6', user: { name: 'Miguel', image: require('../../assets/images/img7.jpg') }, content: 'Amo la carne asada!', timestamp: 'Hace 20 horas' }
        ],
      },
    ],
  },
];

export default function ForumScreen() {
  const router = useRouter();
  const [forumData, setForumData] = useState(initialForumData);
  const [question, setQuestion] = useState('');

  const addQuestion = () => {
    if (!question.trim()) return;
    const newQuestion = {
      id: `q-${Date.now()}`,
      user: { name: 'Tú', image: require('../../assets/images/img7.jpg') },
      timestamp: 'Ahora',
      title: question.trim(),
      answers: [],
    };
    setForumData([newQuestion, ...forumData]);
    setQuestion('');
  };

  const goToQuestionDetail = (item: any) => {
    router.push({
      pathname: '../extra/question-detail',
      params: { question: JSON.stringify(item) },
    });
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
                <Image source={item.user.image} style={styles.avatar} />
                <View>
                  <Text style={styles.userName}>{item.user.name}</Text>
                  <Text style={styles.timestamp}>{item.timestamp}</Text>
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
                <Text style={styles.statText}>{item.answers.length} respuestas</Text>
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
    elevation: 2 
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#bb86fc'
  },
  userName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  timestamp: { 
    fontSize: 12, 
    color: '#888', 
    marginTop: 2 
  },
  moreButton: {
    padding: 8,
  },
  title: { 
    fontWeight: 'bold', 
    fontSize: 16, 
    color: '#fff', 
    marginBottom: 12 
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  stats: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  statText: { 
    color: '#888', 
    marginLeft: 6, 
    fontSize: 14 
  },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 16 
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
    maxHeight: 100
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#bb86fc',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#333'
  },
});
