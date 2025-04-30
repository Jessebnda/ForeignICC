import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, firestore, database } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  getCountFromServer, 
  writeBatch, 
  doc, 
  getDocs,
  updateDoc,
  Timestamp,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { ref, onValue, get, set, update, push } from 'firebase/database';
import { getDoc } from 'firebase/firestore';

// Añadir esta interfaz en la parte superior del archivo
interface ChatMessage {
  from: string;
  text: string;
  timestamp: number;
  read?: boolean;
}

export type NotificationType = 
  | 'message'
  | 'post_like'
  | 'post_comment'
  | 'forum_question_like'
  | 'forum_question_comment'
  | 'forum_answer_like'
  | 'forum_answer_comment'
  | 'raite_request'  // Nuevo tipo
  | 'raite_accepted' // Nuevo tipo
  | 'raite_cancelled'; // Nuevo tipo

export interface Notification {
  id: string;
  type: NotificationType;
  fromUserId: string;
  fromUserName: string;
  fromUserPhoto?: string;
  toUserId: string;
  contentId: string;   // ID del post, pregunta o respuesta
  contentText?: string; // Texto breve del contenido
  timestamp: number;
  read: boolean;
  relatedContentId?: string; // Para respuestas dentro de preguntas
  count?: number; // Para notificaciones agrupadas
}

// Para mensajes
export interface MessageNotification {
  chatId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  lastMessage: string;
  unreadCount: number;
  timestamp: number;
}

interface NotificationContextType {
  notifications: Notification[];
  messageNotifications: MessageNotification[];
  hasUnread: boolean;
  fetchNotifications: () => void;
  markAllAsRead: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  createNotification: (data: Omit<Notification, 'id' | 'read' | 'timestamp'>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  messageNotifications: [],
  hasUnread: false,
  fetchNotifications: () => {},
  markAllAsRead: async () => {},
  markAsRead: async () => {},
  createNotification: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messageNotifications, setMessageNotifications] = useState<MessageNotification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  // Agrupar notificaciones similares
  const groupNotifications = (notifs: Notification[]): Notification[] => {
    const grouped = new Map<string, Notification>();
    
    notifs.forEach(notif => {
      // Crear una clave para agrupar notificaciones similares
      // Ejemplo: "post_like_123" para likes en el post con ID 123
      const groupKey = `${notif.type}_${notif.contentId}_${notif.fromUserId}`;
      
      if (grouped.has(groupKey)) {
        // Si ya existe, incrementar el contador
        const existing = grouped.get(groupKey)!;
        grouped.set(groupKey, {
          ...existing,
          count: (existing.count || 1) + 1,
          timestamp: Math.max(existing.timestamp, notif.timestamp) // Usar el timestamp más reciente
        });
      } else {
        // Si no existe, añadirla con contador 1
        grouped.set(groupKey, {
          ...notif,
          count: 1
        });
      }
    });
    
    return Array.from(grouped.values()).sort((a, b) => b.timestamp - a.timestamp);
  };

  // Crear una notificación
  const createNotification = async (data: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
    try {
      const currentUser = auth.currentUser;
      
      // No crear notificaciones para uno mismo
      if (currentUser?.uid === data.toUserId) {
        return;
      }
      
      // Crear notificación en Realtime Database
      const notifRef = ref(database, `notifications/${data.toUserId}`);
      await push(notifRef, {
        ...data,
        timestamp: Date.now(),
        read: false
      });
      
      console.log('Notificación creada');
    } catch (error) {
      console.error('Error al crear notificación:', error);
    }
  };

  // Fetch y escucha de notificaciones
  const fetchNotifications = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return () => {};
    
    // 1. Escuchar notificaciones de Firestore
    const unsubscribeNotifs = onSnapshot(
      query(
        collection(firestore, 'notifications'),
        where('toUserId', '==', currentUser.uid),
        orderBy('timestamp', 'desc')
      ),
      (snapshot) => {
        if (snapshot.empty) {
          setNotifications([]);
          return;
        }
        
        const notifs: Notification[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Notification[];
        
        // Agrupar notificaciones similares
        const groupedNotifs = groupNotifications(notifs);
        setNotifications(groupedNotifs);
        
        const hasUnreadFirestore = notifs.some(notif => !notif.read);
        setHasUnread(hasUnreadFirestore || messageNotifications.length > 0);
      }
    );
    
    // 2. Escuchar mensajes no leídos
    const messagesRef = ref(database, 'messages');
    const unsubscribeMessages = onValue(messagesRef, async (snapshot) => {
      if (!snapshot.exists()) return;
      
      const allChats = snapshot.val();
      const chatIds = Object.keys(allChats).filter(id => id.includes(currentUser.uid));
      
      const messageNotifs: MessageNotification[] = [];
      
      for (const chatId of chatIds) {
        const chatMessages = allChats[chatId];
        if (!chatMessages) continue;
        
        const messagesArray = Object.values(chatMessages) as ChatMessage[];
        const unreadMessages = messagesArray.filter((msg: ChatMessage) => 
          msg.from !== currentUser.uid && !msg.read
        );
        
        if (unreadMessages.length > 0) {
          // Encontrar el último mensaje y su timestamp
          const lastMessage = unreadMessages.reduce((latest: ChatMessage, msg: ChatMessage) => 
            msg.timestamp > latest.timestamp ? msg : latest
          , unreadMessages[0]); // Usar el primer mensaje como valor inicial
          
          // Obtener el ID del otro usuario
          const [user1, user2] = chatId.split('_');
          const otherUserId = user1 === currentUser.uid ? user2 : user1;
          
          // Obtener datos del otro usuario
          const userDoc = await getDoc(doc(firestore, 'users', otherUserId));
          const userData = userDoc.exists() ? userDoc.data() : null;
          
          messageNotifs.push({
            chatId,
            userId: otherUserId,
            userName: userData?.name || userData?.displayName || 'Usuario',
            userPhoto: userData?.photo || userData?.photoURL,
            lastMessage: lastMessage.text || 'Nuevo mensaje',
            unreadCount: unreadMessages.length,
            timestamp: lastMessage.timestamp || Date.now()
          });
        }
      }
      
      // Ordenar por timestamp descendente
      messageNotifs.sort((a, b) => b.timestamp - a.timestamp);
      
      setMessageNotifications(messageNotifs);
      setHasUnread(notifications.some(notif => !notif.read) || messageNotifs.length > 0);
    });
    
    return () => {
      unsubscribeNotifs();
      unsubscribeMessages();
    };
  };

  // Marcar todas las notificaciones como leídas
  const markAllAsRead = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    try {
      // 1. Marcar notificaciones de Realtime Database como leídas
      const notifRef = ref(database, `notifications/${currentUser.uid}`);
      const snapshot = await get(notifRef);
      
      if (snapshot.exists()) {
        const updates: Record<string, boolean> = {};
        
        snapshot.forEach(child => {
          if (!child.val().read) {
            updates[`notifications/${currentUser.uid}/${child.key}/read`] = true;
          }
        });
        
        if (Object.keys(updates).length > 0) {
          await update(ref(database), updates);
        }
      }
      
      // 2. Marcar mensajes como leídos
      for (const msgNotif of messageNotifications) {
        // Usar la implementación que ya tienes en chat.tsx
        const chatRef = ref(database, `messages/${msgNotif.chatId}`);
        const chatSnapshot = await get(chatRef);
        
        if (chatSnapshot.exists()) {
          const updates: Record<string, boolean> = {};
          
          chatSnapshot.forEach(messageSnapshot => {
            const message = messageSnapshot.val();
            if (message.from === msgNotif.userId && !message.read) {
              updates[`messages/${msgNotif.chatId}/${messageSnapshot.key}/read`] = true;
            }
          });
          
          if (Object.keys(updates).length > 0) {
            await update(ref(database), updates);
          }
        }
      }
      
      // Actualizar estado local inmediatamente sin esperar a los listeners
      setNotifications(prevNotifs => 
        prevNotifs.map(notif => ({...notif, read: true}))
      );
      setMessageNotifications([]);
      setHasUnread(false);
      
      // Resto del código...
    } catch (error) {
      console.error('Error al marcar notificaciones como leídas:', error);
    }
  };

  // Marcar una notificación específica como leída
  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(firestore, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };

  // Funciones de ayuda para crear tipos específicos de notificacionesiones de ayuda para crear tipos específicos de notificaciones

  useEffect(() => {
    const unsubscribe = fetchNotifications();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      messageNotifications,
      hasUnread,
      fetchNotifications,
      markAllAsRead,
      markAsRead,
      createNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};