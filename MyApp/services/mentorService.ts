import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc,
  writeBatch,
  getDoc,
  orderBy,
  serverTimestamp,
  onSnapshot,
  limit
} from 'firebase/firestore';
import { firestore } from './firebase/config';
import { createNotification } from './notificationService';

// Interfaces
export interface Mentor {
  uid: string;
  email: string | null;
  name: string;
  university?: string;
  photo?: string;
  interests?: string[];
  origin?: string;
  createdAt?: any;
  isAdmin?: boolean;
  isMentor?: boolean;
  rating?: number; 
  topics?: string[];
}

export interface ChatSession {
  id: string;
  mentorId: string;
  studentId: string;
  lastMessage: string;
  lastMessageTimestamp: any;
  unreadCount: number;
  mentor?: Mentor;
  student?: {
    id: string;
    name: string;
    photo: string;
  };
}

export interface ChatMessage {
  id?: string;
  senderId: string;
  text: string;
  timestamp: any;
  isRead: boolean;
}

// Obtener todos los mentores
export const getMentors = async (): Promise<Mentor[]> => {
  try {
    const mentorsQuery = query(
      collection(firestore, 'users'),
      where('isMentor', '==', true),
    );
    
    const snapshot = await getDocs(mentorsQuery);
    
    return snapshot.docs.map(doc => ({
      uid: doc.id,
      email: doc.data().email || null,
      name: doc.data().name || 'Mentor sin nombre',
      university: doc.data().university || 'Universidad no especificada',
      photo: doc.data().photo || '',
      interests: doc.data().interests || [],
      origin: doc.data().origin || '',
      createdAt: doc.data().createdAt || null,
      isAdmin: doc.data().isAdmin || false,
      isMentor: doc.data().isMentor || false,
      topics: doc.data().topics || [],
    }));
  } catch (error) {
    console.error('Error obteniendo mentores:', error);
    throw error;
  }
};

// Filtrar mentores por universidad
export const getMentorsByUniversity = async (university: string): Promise<Mentor[]> => {
  try {
    const mentorsQuery = query(
      collection(firestore, 'users'),
      where('isMentor', '==', true),
      where('university', '==', university)
    );
    
    const snapshot = await getDocs(mentorsQuery);
    
    return snapshot.docs.map(doc => ({
      uid: doc.id,
      email: doc.data().email || null,
      name: doc.data().name || 'Mentor sin nombre',
      university: doc.data().university || 'Universidad no especificada',
      photo: doc.data().photo || '',
      interests: doc.data().interests || [],
      origin: doc.data().origin || '',
      createdAt: doc.data().createdAt || null,
      isAdmin: doc.data().isAdmin || false,
      isMentor: doc.data().isMentor || false,
      topics: doc.data().topics || [],
    }));
  } catch (error) {
    console.error('Error filtrando mentores:', error);
    throw error;
  }
};

// Iniciar sesión de chat
export const startChatSession = async (
  studentId: string,
  mentorId: string,
  initialMessage: string
): Promise<string> => {
  try {
    // Verificar si ya existe una sesión entre estos usuarios
    const existingSessionQuery = query(
      collection(firestore, 'chatSessions'),
      where('studentId', '==', studentId),
      where('mentorId', '==', mentorId)
    );
    
    const existingSnapshot = await getDocs(existingSessionQuery);
    
    // Si ya existe una sesión, solo agregar un nuevo mensaje
    if (!existingSnapshot.empty) {
      const sessionId = existingSnapshot.docs[0].id;
      
      // Agregar mensaje a la sesión existente
      await addDoc(collection(firestore, 'chatSessions', sessionId, 'messages'), {
        senderId: studentId,
        text: initialMessage,
        timestamp: serverTimestamp(),
        isRead: false
      });
      
      // Actualizar última actividad
      await updateDoc(doc(firestore, 'chatSessions', sessionId), {
        lastMessage: initialMessage,
        lastMessageTimestamp: serverTimestamp(),
        unreadCount: (existingSnapshot.docs[0].data().unreadCount || 0) + 1
      });
      
      return sessionId;
    }
    
    // Crear nueva sesión
    const sessionRef = await addDoc(collection(firestore, 'chatSessions'), {
      studentId,
      mentorId,
      lastMessage: initialMessage,
      lastMessageTimestamp: serverTimestamp(),
      unreadCount: 1,
      createdAt: serverTimestamp()
    });
    
    // Agregar primer mensaje
    await addDoc(collection(firestore, 'chatSessions', sessionRef.id, 'messages'), {
      senderId: studentId,
      text: initialMessage,
      timestamp: serverTimestamp(),
      isRead: false
    });
    
    // Obtener datos del estudiante para la notificación
    const studentDoc = await getDoc(doc(firestore, 'users', studentId));
    const studentData = studentDoc.data();
    
    // Crear notificación para el mentor
    await createNotification({
      type: 'post_comment', // Reutilizamos este tipo por ahora
      fromUserId: studentId,
      fromUserName: studentData?.name || 'Estudiante',
      fromUserPhoto: studentData?.photo || '',
      toUserId: mentorId,
      contentId: sessionRef.id,
      contentText: initialMessage.substring(0, 100)
    });
    
    return sessionRef.id;
  } catch (error) {
    console.error('Error iniciando sesión de chat:', error);
    throw error;
  }
};

// Obtener sesiones de chat recibidas (para mentores)
export const getReceivedChatSessions = (
  mentorId: string,
  callback: (sessions: ChatSession[]) => void
) => {
  const q = query(
    collection(firestore, 'chatSessions'),
    where('mentorId', '==', mentorId),
    orderBy('lastMessageTimestamp', 'desc')
  );
  
  return onSnapshot(q, async (snapshot) => {
    const sessionsPromises = snapshot.docs.map(async (sessionDoc) => {
      const sessionData = { id: sessionDoc.id, ...sessionDoc.data() } as ChatSession;
      
      try {
        // Obtener datos del estudiante
        const studentDoc = await getDoc(doc(firestore, 'users', sessionData.studentId));
        if (studentDoc.exists()) {
          sessionData.student = {
            id: sessionData.studentId,
            name: studentDoc.data().name || 'Estudiante',
            photo: studentDoc.data().photo || ''
          };
        }
      } catch (error) {
        console.error('Error obteniendo datos del estudiante:', error);
      }
      
      return sessionData;
    });
    
    const sessions = await Promise.all(sessionsPromises);
    callback(sessions);
  });
};

// Obtener sesiones de chat enviadas (para estudiantes)
export const getSentChatSessions = (
  studentId: string,
  callback: (sessions: ChatSession[]) => void
) => {
  const q = query(
    collection(firestore, 'chatSessions'),
    where('studentId', '==', studentId),
    orderBy('lastMessageTimestamp', 'desc')
  );
  
  return onSnapshot(q, async (snapshot) => {
    const sessionsPromises = snapshot.docs.map(async (sessionDoc) => {
      const sessionData = { id: sessionDoc.id, ...sessionDoc.data() } as ChatSession;
      
      try {
        // Obtener datos del mentor
        const mentorDoc = await getDoc(doc(firestore, 'users', sessionData.mentorId));
        if (mentorDoc.exists()) {
          sessionData.mentor = {
            uid: sessionData.mentorId,
            email: mentorDoc.data().email || null,
            name: mentorDoc.data().name || 'Mentor',
            university: mentorDoc.data().university || '',
            photo: mentorDoc.data().photo || '',
            interests: mentorDoc.data().interests || [],
            origin: mentorDoc.data().origin || '',
            createdAt: mentorDoc.data().createdAt || null,
            isAdmin: mentorDoc.data().isAdmin || false,
            isMentor: mentorDoc.data().isMentor || false,
            rating: mentorDoc.data().rating || 4.5
          };
        }
      } catch (error) {
        console.error('Error obteniendo datos del mentor:', error);
      }
      
      return sessionData;
    });
    
    const sessions = await Promise.all(sessionsPromises);
    callback(sessions);
  });
};

// Obtener mensajes de una sesión
export const getChatMessages = (
  sessionId: string,
  callback: (messages: ChatMessage[]) => void
) => {
  const q = query(
    collection(firestore, 'chatSessions', sessionId, 'messages'),
    orderBy('timestamp', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChatMessage[];
    
    callback(messages);
  });
};

// Enviar mensaje
export const sendChatMessage = async (
  sessionId: string,
  senderId: string,
  text: string
): Promise<string> => {
  try {
    // Obtener la sesión para saber quién es el destinatario
    const sessionDoc = await getDoc(doc(firestore, 'chatSessions', sessionId));
    if (!sessionDoc.exists()) {
      throw new Error('Sesión no encontrada');
    }
    
    const sessionData = sessionDoc.data();
    const receiverId = senderId === sessionData.mentorId 
      ? sessionData.studentId 
      : sessionData.mentorId;
    
    // Agregar mensaje
    const messageRef = await addDoc(
      collection(firestore, 'chatSessions', sessionId, 'messages'), 
      {
        senderId,
        text,
        timestamp: serverTimestamp(),
        isRead: false
      }
    );
    
    // Actualizar última actividad de la sesión
    await updateDoc(doc(firestore, 'chatSessions', sessionId), {
      lastMessage: text,
      lastMessageTimestamp: serverTimestamp(),
      unreadCount: (sessionData.unreadCount || 0) + 1
    });
    
    // Obtener datos del remitente para la notificación
    const senderDoc = await getDoc(doc(firestore, 'users', senderId));
    const senderData = senderDoc.data();
    
    // Crear notificación
    await createNotification({
      type: 'post_comment', // Reutilizamos este tipo por ahora
      fromUserId: senderId,
      fromUserName: senderData?.name || 'Usuario',
      fromUserPhoto: senderData?.photo || '',
      toUserId: receiverId,
      contentId: sessionId,
      contentText: text.substring(0, 100)
    });
    
    return messageRef.id;
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    throw error;
  }
};

// Marcar mensajes como leídos
export const markMessagesAsRead = async (sessionId: string, userId: string): Promise<void> => {
  try {
    // Obtener la sesión
    const sessionDoc = await getDoc(doc(firestore, 'chatSessions', sessionId));
    if (!sessionDoc.exists()) return;
    
    const sessionData = sessionDoc.data();
    
    // Solo actualizar si el usuario es el destinatario
    const isMentor = userId === sessionData.mentorId;
    const isStudent = userId === sessionData.studentId;
    
    if (!isMentor && !isStudent) return;
    
    // Obtener mensajes no leídos enviados por la otra persona
    const unreadMessagesQuery = query(
      collection(firestore, 'chatSessions', sessionId, 'messages'),
      where('senderId', '==', isMentor ? sessionData.studentId : sessionData.mentorId),
      where('isRead', '==', false)
    );
    
    const unreadSnapshot = await getDocs(unreadMessagesQuery);
    
    // Marcar como leídos
    const batch = writeBatch(firestore);
    unreadSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isRead: true });
    });
    
    // Actualizar contador de no leídos
    batch.update(doc(firestore, 'chatSessions', sessionId), {
      unreadCount: 0
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error marcando mensajes como leídos:', error);
    throw error;
  }
};