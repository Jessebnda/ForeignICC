import { useState, useEffect } from 'react';
import { 
  getChatbotHistory, 
  getChatbotResponse, 
  saveChatbotConversation 
} from '../services/chatbotService';

interface ChatbotMessage {
  id?: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: any;
}

export function useChatbot(userId: string) {
  const [messages, setMessages] = useState<ChatbotMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  
  // Cargar historial
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const history = await getChatbotHistory(userId);
        
        if (history.length > 0) {
          setMessages(history);
        } else {
          // Mensaje de bienvenida si no hay historial
          setMessages([
            {
              text: '¡Hola! Soy el asistente virtual de Foreign. ¿En qué puedo ayudarte?',
              sender: 'bot',
              timestamp: new Date()
            }
          ]);
        }
      } catch (error) {
        console.error('Error cargando historial del chatbot:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      loadHistory();
    }
  }, [userId]);
  
  // Enviar mensaje al chatbot
  const sendMessage = async () => {
    if (!inputMessage.trim() || !userId) return;
    
    try {
      // Agregar mensaje del usuario
      const userMessage: ChatbotMessage = {
        text: inputMessage.trim(),
        sender: 'user',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      setResponding(true);
      
      // Obtener respuesta del bot
      const botResponse = await getChatbotResponse(inputMessage.trim(), userId);
      
      // Agregar respuesta del bot
      setMessages(prev => [...prev, botResponse]);
      
      // Guardar conversación
      await saveChatbotConversation(userId, [...messages, userMessage, botResponse]);
    } catch (error) {
      console.error('Error enviando mensaje al chatbot:', error);
    } finally {
      setResponding(false);
    }
  };
  
  // Limpiar conversación
  const clearConversation = () => {
    setMessages([
      {
        text: '¡Hola! Soy el asistente virtual de Foreign. ¿En qué puedo ayudarte?',
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  };
  
  return {
    messages,
    inputMessage,
    loading,
    responding,
    setInputMessage,
    sendMessage,
    clearConversation
  };
}