import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, getDocs, doc, getDoc, updateDoc, increment, where } from 'firebase/firestore';
import { firestore } from '../firebase';

export interface ForumUser {
  id: string;
  name: string;
  photo: string;
}

export interface ForumQuestion {
  id: string;
  title: string;
  timestamp: any;
  user: ForumUser;
  answerCount?: number;
}

export interface ForumAnswer {
  id: string;
  content: string;
  timestamp: any;
  user: ForumUser;
  likes: number;
  commentCount: number;
}

export interface ForumComment {
  id: string;
  content: string;
  timestamp: any;
  user: ForumUser;
  likes: number;
}

// Obtener preguntas con conteo de respuestas
export const getQuestions = (callback: (questions: ForumQuestion[]) => void) => {
  const q = query(collection(firestore, 'forumQuestions'), orderBy('timestamp', 'desc'));
  
  return onSnapshot(q, async (snapshot) => {
    const questionsPromises = snapshot.docs.map(async (doc) => {
      const questionData = { id: doc.id, ...doc.data() } as ForumQuestion;
      
      // Obtener conteo de respuestas
      const answersQuery = collection(firestore, 'forumQuestions', doc.id, 'answers');
      const answersSnapshot = await getDocs(answersQuery);
      questionData.answerCount = answersSnapshot.size;
      
      return questionData;
    });
    
    const questions = await Promise.all(questionsPromises);
    callback(questions);
  });
};

// Crear una nueva pregunta
export const createQuestion = async (questionText: string, user: ForumUser) => {
  const newQuestion = {
    title: questionText.trim(),
    timestamp: Timestamp.now(),
    user,
    answerCount: 0,
  };
  
  return await addDoc(collection(firestore, 'forumQuestions'), newQuestion);
};

// Obtener detalle de pregunta
export const getQuestionDetail = async (questionId: string) => {
  const questionDoc = await getDoc(doc(firestore, 'forumQuestions', questionId));
  if (questionDoc.exists()) {
    return { id: questionDoc.id, ...questionDoc.data() } as ForumQuestion;
  }
  return null;
};

// Obtener respuestas de una pregunta
export const getAnswers = (questionId: string, callback: (answers: ForumAnswer[]) => void) => {
  const q = query(
    collection(firestore, 'forumQuestions', questionId, 'answers'),
    orderBy('timestamp', 'desc')
  );
  
  return onSnapshot(q, async (snapshot) => {
    const answersPromises = snapshot.docs.map(async (doc) => {
      const answerData = { id: doc.id, ...doc.data() } as ForumAnswer;
      
      try {
        const commentsCollection = collection(
          firestore, 'forumQuestions', questionId, 'answers', doc.id, 'comments'
        );
        const commentsSnapshot = await getDocs(commentsCollection);
        answerData.commentCount = commentsSnapshot.size;
      } catch (e) {
        answerData.commentCount = 0;
      }
      
      return answerData;
    });
    
    const answers = await Promise.all(answersPromises);
    callback(answers);
  });
};

// Crear una respuesta
export const createAnswer = async (
  questionId: string, 
  answerText: string, 
  user: ForumUser
) => {
  const answer = {
    content: answerText.trim(),
    timestamp: Timestamp.now(),
    user,
    likes: 0,
    commentCount: 0,
  };
  
  const answerRef = await addDoc(
    collection(firestore, 'forumQuestions', questionId, 'answers'), 
    answer
  );
  
  // Incrementar contador de respuestas
  await updateDoc(doc(firestore, 'forumQuestions', questionId), {
    answerCount: increment(1)
  });
  
  return answerRef;
};

// Más funciones (comentarios, likes, etc.)