import { useState, useEffect } from 'react';
import { getQuestions, createQuestion, ForumQuestion, ForumUser } from '../services/forumService';

export function useForumQuestions() {
  const [questions, setQuestions] = useState<ForumQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = getQuestions((loadedQuestions) => {
      setQuestions(loadedQuestions);
      setLoading(false);
      setRefreshing(false);
    });
    
    return () => unsubscribe();
  }, []);

  const addQuestion = async (questionText: string, user: ForumUser) => {
    if (!questionText.trim() || !user) return null;
    
    try {
      return await createQuestion(questionText, user);
    } catch (error) {
      console.error('Error al crear pregunta:', error);
      return null;
    }
  };

  const refreshQuestions = () => {
    setRefreshing(true);
    // La recarga real se maneja en el efecto con onSnapshot
  };

  return {
    questions,
    loading,
    refreshing,
    addQuestion,
    refreshQuestions
  };
}