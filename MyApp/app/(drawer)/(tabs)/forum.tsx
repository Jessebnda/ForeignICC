import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { useUser } from '../../../context/UserContext';
import { formatTimeAgo } from '../../../utils/formatters';
import MaxWidthContainer from '../../../components/MaxWidthContainer';
import { ForumQuestion, ForumUser } from '../../../services/forumService';
import { useForumQuestions } from '../../../hooks/useForumQuestions';
import QuestionCard from '../../../components/forum/QuestionCard';
import EmptyForum from '../../../components/forum/EmptyForum';

export default function ForumScreen() {
  const router = useRouter();
  const [questionText, setQuestionText] = useState('');
  const auth = getAuth();
  const user = auth.currentUser;
  const { userProfile } = useUser();
  
  const { 
    questions, 
    loading, 
    refreshing, 
    addQuestion, 
    refreshQuestions 
  } = useForumQuestions();

  const handleAddQuestion = async () => {
    if (!questionText.trim() || !user) return;

    const forumUser: ForumUser = {
      id: user.uid,
      name: userProfile?.name || user.displayName || 'Usuario sin nombre',
      photo: userProfile?.photo || '',
    };

    await addQuestion(questionText, forumUser);
    setQuestionText('');
  };

  const navigateToQuestionDetail = (question: ForumQuestion) => {
    router.push({
      pathname: '/extra/questionDetail',
      params: { questionId: question.id }
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#bb86fc" />
        <Text style={styles.loadingText}>Cargando preguntas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MaxWidthContainer>
        <FlatList
          data={questions}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshQuestions} />
          }
          renderItem={({ item }) => (
            <QuestionCard 
              question={item} 
              onPress={() => navigateToQuestionDetail(item)} 
              onUserPress={(userId) => router.push(`/extra/friendProfile?uid=${userId}`)}
            />
          )}
          ListEmptyComponent={<EmptyForum />}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escribe tu pregunta..."
            placeholderTextColor="#888"
            value={questionText}
            onChangeText={setQuestionText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !questionText.trim() && styles.sendButtonDisabled]}
            onPress={handleAddQuestion}
            disabled={!questionText.trim()}
          >
            <Ionicons name="send" size={20} color={questionText.trim() ? '#fff' : '#888'} />
          </TouchableOpacity>
        </View>
      </MaxWidthContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: '#121212' 
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    backgroundColor: '#1e1e1e',
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#bb86fc',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
});