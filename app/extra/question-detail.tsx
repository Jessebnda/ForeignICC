import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function QuestionDetailScreen() {
  const router = useRouter();
  const { question: questionParam } = useLocalSearchParams();

  // Parsear el parámetro y asegurar que las propiedades necesarias tengan valores por defecto
  let parsedQuestion = questionParam ? JSON.parse(questionParam as string) : {};
  parsedQuestion.title = parsedQuestion.title || '';
  parsedQuestion.answers = parsedQuestion.answers || [];
  parsedQuestion.timestamp = parsedQuestion.timestamp || 'Hace 2 horas';
  // Si no se proporcionó usuario, se asigna un valor por defecto
  parsedQuestion.user = parsedQuestion.user || { 
    name: 'Usuario', 
    image: require('../../assets/images/img7.jpg') 
  };

  const question = parsedQuestion;
  const [answers, setAnswers] = useState<any[]>(question.answers);
  const [newAnswer, setNewAnswer] = useState('');

  const addAnswer = () => {
    if (!newAnswer.trim()) return;
    const answer = {
      id: `ans-${Date.now()}`,
      content: newAnswer.trim(),
      comments: [],
      user: { name: 'Tú', image: require('../../assets/images/img7.jpg') },
      timestamp: 'Ahora',
      likes: 0,
    };
    setAnswers([answer, ...answers]);
    setNewAnswer('');
  };

  const goToAnswerDetail = (answer: any) => {
    router.push({
      pathname: '../extra/answer-detail',
      params: { answer: JSON.stringify(answer) },
    });
  };

  const renderAnswer = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => goToAnswerDetail(item)}>
      <View style={styles.answerHeader}>
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
      <Text style={styles.answerContent}>{item.content}</Text>
      <View style={styles.answerFooter}>
        <View style={styles.stats}>
          <TouchableOpacity style={styles.statButton}>
            <Ionicons name="heart-outline" size={16} color="#888" />
            <Text style={styles.statText}>{item.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statButton}>
            <Ionicons name="chatbubble-outline" size={16} color="#888" />
            <Text style={styles.statText}>{item.comments.length}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.respondButton}>
          <Text style={styles.respondText}>Responder</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.questionHeader}>
        <View style={styles.userInfo}>
          <Image source={question.user.image} style={styles.avatar} />
          <View>
            <Text style={styles.userName}>{question.user.name}</Text>
            <Text style={styles.timestamp}>{question.timestamp}</Text>
          </View>
        </View>
        <Text style={styles.questionTitle}>{question.title}</Text>
      </View>

      <FlatList
        data={answers}
        keyExtractor={(item) => item.id}
        renderItem={renderAnswer}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe tu respuesta..."
          placeholderTextColor="#888"
          value={newAnswer}
          onChangeText={setNewAnswer}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, !newAnswer.trim() && styles.sendButtonDisabled]} 
          onPress={addAnswer}
          disabled={!newAnswer.trim()}
        >
          <Ionicons name="send" size={20} color={newAnswer.trim() ? '#fff' : '#888'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  questionHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1e1e1e',
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, borderWidth: 2, borderColor: '#bb86fc' },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  timestamp: { fontSize: 12, color: '#888', marginTop: 2 },
  questionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  listContent: { padding: 16 },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  answerContent: { fontSize: 16, color: '#fff', lineHeight: 24, marginBottom: 12 },
  answerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stats: { flexDirection: 'row', alignItems: 'center' },
  statButton: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  statText: { color: '#888', marginLeft: 4, fontSize: 14 },
  respondButton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#333' },
  respondText: { color: '#bb86fc', fontSize: 14 },
  inputContainer: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderColor: '#333', backgroundColor: '#1e1e1e' },
  input: { flex: 1, backgroundColor: '#333', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, color: '#fff', marginRight: 8, maxHeight: 100 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#bb86fc', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: '#333' },


  moreButton: {
    padding: 8,
    // Ajusta los estilos que necesites
    // por ejemplo:
    // backgroundColor: '#333',
    // borderRadius: 4,
  }
});
