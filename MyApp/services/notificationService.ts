import { firestore } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { database } from '../firebase';
import { ref, push } from 'firebase/database';
import { getAuth } from 'firebase/auth';

export type NotificationType = 
  | 'post_like'
  | 'post_comment'
  | 'forum_question_like'
  | 'forum_question_comment'
  | 'forum_answer_like'
  | 'forum_answer_comment'
  | 'raite_request';  // Añadir este nuevo tipo

export const createNotification = async (data: {
  type: string;
  fromUserId: string;
  fromUserName: string;
  fromUserPhoto?: string;
  toUserId: string;
  contentId: string;
  contentText?: string;
  relatedContentId?: string;
}) => {
  try {
    // Crear un objeto con valores por defecto para los campos opcionales
    const notificationData = {
      ...data,
      fromUserPhoto: data.fromUserPhoto || '',
      contentText: data.contentText || '',
      relatedContentId: data.relatedContentId || '',
      timestamp: serverTimestamp(),
      read: false
    };
    
    // Validar que ningún campo requerido sea undefined
    if (!notificationData.type || !notificationData.fromUserId || 
        !notificationData.toUserId || !notificationData.contentId) {
      console.error("Datos de notificación incompletos:", notificationData);
      return false;
    }
    
    console.log("Creando notificación:", notificationData);
    
    const notificationRef = collection(firestore, 'notifications');
    await addDoc(notificationRef, notificationData);
    
    console.log("Notificación creada con éxito");
    return true;
  } catch (error) {
    console.error("Error al crear notificación:", error);
    return false;
  }
};