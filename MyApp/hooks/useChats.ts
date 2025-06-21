import { useState, useEffect } from 'react';
import { 
  getReceivedChatSessions, 
  getSentChatSessions,
  getChatMessages,
  sendChatMessage,
  startChatSession,
  markMessagesAsRead,
  ChatSession,
  ChatMessage
} from '../services/mentorService';

export function useChats(userId: string, isMentor: boolean) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState({
    sessions: true,
    messages: false
  });
  const [newMessage, setNewMessage] = useState('');
  
  // Cargar sesiones de chat
  useEffect(() => {
    if (!userId) return;
    
    setLoading(prev => ({ ...prev, sessions: true }));
    
    const unsubscribe = isMentor
      ? getReceivedChatSessions(userId, (sessions) => {
          setChatSessions(sessions);
          setLoading(prev => ({ ...prev, sessions: false }));
        })
      : getSentChatSessions(userId, (sessions) => {
          setChatSessions(sessions);
          setLoading(prev => ({ ...prev, sessions: false }));
        });
    
    return unsubscribe;
  }, [userId, isMentor]);
  
  // Cargar mensajes cuando cambia la sesión activa
  useEffect(() => {
    if (!activeSession) {
      setMessages([]);
      return;
    }
    
    setLoading(prev => ({ ...prev, messages: true }));
    
    // Marcar mensajes como leídos
    markMessagesAsRead(activeSession.id, userId);
    
    const unsubscribe = getChatMessages(activeSession.id, (loadedMessages) => {
      setMessages(loadedMessages);
      setLoading(prev => ({ ...prev, messages: false }));
    });
    
    return unsubscribe;
  }, [activeSession, userId]);
  
  // Enviar mensaje
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeSession) return;
    
    try {
      await sendChatMessage(activeSession.id, userId, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };
  
  // Iniciar nuevo chat
  const startNewChat = async (mentorId: string, initialMessage: string) => {
    if (!initialMessage.trim()) return null;
    
    try {
      const sessionId = await startChatSession(userId, mentorId, initialMessage.trim());
      return sessionId;
    } catch (error) {
      console.error('Error iniciando chat:', error);
      return null;
    }
  };
  
  return {
    chatSessions,
    activeSession,
    messages,
    loading,
    newMessage,
    setActiveSession,
    setNewMessage,
    handleSendMessage,
    startNewChat
  };
}