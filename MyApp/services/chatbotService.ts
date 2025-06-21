import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { firestore } from './firebase/firestore';

interface ChatbotMessage {
  id?: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: any;
}

// Función para comunicarse con el servicio de IA (simularemos respuestas)
const getBotResponse = async (userMessage: string): Promise<string> => {
  try {
    // En una implementación real, aquí harías una llamada a un API de IA
    // Por ahora simularemos respuestas básicas
    
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hola') || lowerMessage.includes('saludos')) {
      return '¡Hola! Soy el asistente virtual de Foreign. ¿En qué puedo ayudarte hoy?';
    }
    
    if (lowerMessage.includes('estudiar') || lowerMessage.includes('universidad')) {
      return 'Para información sobre estudios universitarios, te recomiendo consultar con los mentores disponibles. Ellos pueden darte consejos personalizados sobre tu carrera.';
    }
    
    if (lowerMessage.includes('mentor') || lowerMessage.includes('ayuda')) {
      return 'Los mentores son estudiantes con experiencia que pueden ayudarte a resolver dudas sobre la vida universitaria. Puedes contactar con uno desde la sección "Mentores".';
    }
    
    if (lowerMessage.includes('gracias')) {
      return '¡De nada! Estoy aquí para ayudarte. ¿Hay algo más en lo que pueda asistirte?';
    }
    
    // Respuesta por defecto
    return 'Entiendo. Si tienes dudas específicas sobre la vida universitaria, un mentor real podría ayudarte mejor. ¿Quieres que te explique cómo contactar con uno?';
    
  } catch (error) {
    console.error('Error generando respuesta del bot:', error);
    return 'Lo siento, estoy teniendo problemas para procesar tu solicitud. Por favor, intenta de nuevo más tarde.';
  }
};

// Guardar historial de chat con el bot
export const saveChatbotConversation = async (
  userId: string,
  messages: ChatbotMessage[]
): Promise<void> => {
  try {
    await addDoc(collection(firestore, 'chatbotHistory'), {
      userId,
      messages,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error guardando conversación con el chatbot:', error);
    throw error;
  }
};

// Obtener historial de conversaciones con el chatbot
export const getChatbotHistory = async (userId: string): Promise<ChatbotMessage[]> => {
  try {
    const q = query(
      collection(firestore, 'chatbotHistory'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return [];
    
    // Devolver los mensajes de la conversación más reciente
    return snapshot.docs[0].data().messages;
  } catch (error) {
    console.error('Error obteniendo historial del chatbot:', error);
    return [];
  }
};

// Obtener respuesta del chatbot
export const getChatbotResponse = async (
  userMessage: string,
  userId: string
): Promise<ChatbotMessage> => {
  try {
    const botResponse = await getBotResponse(userMessage);
    
    // Crear mensaje de respuesta
    const responseMessage: ChatbotMessage = {
      text: botResponse,
      sender: 'bot',
      timestamp: new Date()
    };
    
    return responseMessage;
  } catch (error) {
    console.error('Error obteniendo respuesta del chatbot:', error);
    
    return {
      text: 'Lo siento, estoy teniendo problemas para responder. Por favor, intenta de nuevo más tarde.',
      sender: 'bot',
      timestamp: new Date()
    };
  }
};