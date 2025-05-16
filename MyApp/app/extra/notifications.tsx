import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  ActivityIndicator, RefreshControl, ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../../context/NotificationContext';
import * as Haptics from 'expo-haptics';
import MaxWidthContainer from '../../components/MaxWidthContainer';

// Define los tipos de notificación para TypeScript
interface MessageNotification {
  chatId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  lastMessage: string;
  unreadCount: number;
  timestamp: number;
  type: 'message';
}

interface SystemNotification {
  id: string;
  fromUserName: string;
  fromUserPhoto?: string;
  contentId: string;
  contentText?: string;
  timestamp: number;
  read: boolean;
  type: string;
}

// Funciones para verificar tipos
const isMessageNotification = (item: any): item is MessageNotification => {
  return item.type === 'message';
};

const isSystemNotification = (item: any): item is SystemNotification => {
  return item.type !== 'message';
};

const defaultUserImage = require('../../assets/images/img7.jpg');

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, messageNotifications, hasUnread, markAllAsRead, fetchNotifications, markAsRead } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Agregar esta función para renderizar los avatares
  const renderAvatar = (item: MessageNotification | SystemNotification) => {
    if (isMessageNotification(item)) {
      return item.userPhoto && (item.userPhoto.startsWith('http') || item.userPhoto.startsWith('data:')) 
        ? { uri: item.userPhoto } 
        : defaultUserImage;
    } 
    else {
      return item.fromUserPhoto && (item.fromUserPhoto.startsWith('http') || item.fromUserPhoto.startsWith('data:')) 
        ? { uri: item.fromUserPhoto } 
        : defaultUserImage;
    }
  };

  // Agregar esta función para renderizar los iconos de notificaciones
  const renderNotificationIcon = (item: any) => {
    if (item.type === 'message') {
      return <Ionicons name="chatbubble" size={20} color="#bb86fc" />;
    } 
    else if (item.type.endsWith('_like')) {
      return <Ionicons name="heart" size={20} color="#ff6b6b" />;
    }
    else if (item.type.endsWith('_comment')) {
      return <Ionicons name="chatbox" size={20} color="#4dabf7" />;
    }
    else if (item.type === 'raite_request') {
      return <Ionicons name="car" size={20} color="#4dabf7" />;
    }
    
    return <Ionicons name="notifications" size={20} color="#bb86fc" />;
  };

  // Cambiar la función renderNotificationTitle
  const renderNotificationTitle = (item: any) => {
    // Si hay senders, usar esos datos
    if (item.senders && item.senders.length > 0) {
      const mainUser = item.senders[0];
      const otherCount = item.senders.length - 1;
      
      switch (item.type) {
        case 'post_like':
          return (
            <Text style={styles.notificationTitle}>
              <Text style={styles.boldText}>{mainUser.name}</Text>
              <Text>{otherCount > 0 ? ` y ${otherCount} más` : ''} {otherCount > 0 ? 'han dado' : 'ha dado'} like a tu publicación</Text>
            </Text>
          );
        
        case 'post_comment':
          return (
            <Text style={styles.notificationTitle}>
              <Text style={styles.boldText}>{mainUser.name}</Text>
              <Text>{otherCount > 0 ? ` y ${otherCount} más` : ''} {otherCount > 0 ? 'han comentado' : 'ha comentado'} en tu publicación</Text>
            </Text>
          );

        case 'forum_question_like':
          return (
            <Text style={styles.notificationTitle}>
              <Text style={styles.boldText}>{mainUser.name}</Text>
              <Text>{otherCount > 0 ? ` y ${otherCount} más` : ''} {otherCount > 0 ? 'han dado' : 'ha dado'} like a tu pregunta</Text>
            </Text>
          );
        
        case 'forum_question_comment':
          return (
            <Text style={styles.notificationTitle}>
              <Text style={styles.boldText}>{mainUser.name}</Text>
              <Text>{otherCount > 0 ? ` y ${otherCount} más` : ''} {otherCount > 0 ? 'han respondido' : 'ha respondido'} a tu pregunta</Text>
            </Text>
          );
        
        case 'forum_answer_like':
          return (
            <Text style={styles.notificationTitle}>
              <Text style={styles.boldText}>{mainUser.name}</Text>
              <Text>{otherCount > 0 ? ` y ${otherCount} más` : ''} {otherCount > 0 ? 'han dado' : 'ha dado'} like a tu respuesta</Text>
            </Text>
          );
        
        case 'forum_answer_comment':
          return (
            <Text style={styles.notificationTitle}>
              <Text style={styles.boldText}>{mainUser.name}</Text>
              <Text>{otherCount > 0 ? ` y ${otherCount} más` : ''} {otherCount > 0 ? 'han comentado' : 'ha comentado'} en una respuesta en tu post</Text>
            </Text>
          );
        
        case 'raite_request':
          return (
            <Text style={styles.notificationTitle}>
              <Text style={styles.boldText}>{mainUser.name}</Text>
              <Text> te ha solicitado un raite</Text>
            </Text>
          );
        
        default:
          return <Text style={styles.notificationTitle}>Nueva notificación</Text>;
      }
    }
    
    // Código existente para notificaciones sin senders
    const userName = item.fromUserName || item.userName || 'Usuario';
    
    switch (item.type) {
      case 'message':
        return (
          <Text style={styles.notificationTitle}>
            <Text style={styles.boldText}>{userName}</Text>
            <Text> te ha enviado {item.unreadCount > 1 ? `${item.unreadCount} mensajes` : 'un mensaje'}</Text>
          </Text>
        );
      
      case 'post_like':
        return (
          <Text style={styles.notificationTitle}>
            <Text style={styles.boldText}>{userName}</Text>
            <Text>{item.count > 1 ? ` y ${item.count - 1} más` : ''} {item.count > 1 ? 'han dado' : 'ha dado'} like a tu publicación</Text>
          </Text>
        );
      
      case 'post_comment':
        return (
          <Text style={styles.notificationTitle}>
            <Text style={styles.boldText}>{userName}</Text>
            <Text>{item.count > 1 ? ` y ${item.count - 1} más` : ''} {item.count > 1 ? 'han comentado' : 'ha comentado'} en tu publicación</Text>
          </Text>
        );
      
      case 'forum_question_like':
        return (
          <Text style={styles.notificationTitle}>
            <Text style={styles.boldText}>{userName}</Text>
            <Text>{item.count > 1 ? ` y ${item.count - 1} más` : ''} {item.count > 1 ? 'han dado' : 'ha dado'} like a tu pregunta</Text>
          </Text>
        );
      
      case 'forum_question_comment':
        return (
          <Text style={styles.notificationTitle}>
            <Text style={styles.boldText}>{userName}</Text>
            <Text>{item.count > 1 ? ` y ${item.count - 1} más` : ''} {item.count > 1 ? 'han respondido' : 'ha respondido'} a tu pregunta</Text>
          </Text>
        );
      
      case 'forum_answer_like':
        return (
          <Text style={styles.notificationTitle}>
            <Text style={styles.boldText}>{userName}</Text>
            <Text>{item.count > 1 ? ` y ${item.count - 1} más` : ''} {item.count > 1 ? 'han dado' : 'ha dado'} like a tu respuesta</Text>
          </Text>
        );
      
      case 'forum_answer_comment':
        return (
          <Text style={styles.notificationTitle}>
            <Text style={styles.boldText}>{userName}</Text>
            <Text>{item.count > 1 ? ` y ${item.count - 1} más` : ''} {item.count > 1 ? 'han comentado' : 'ha comentado'} en una respuesta en tu post</Text>
          </Text>
        );
      
      case 'raite_request':
        return (
          <Text style={styles.notificationTitle}>
            <Text style={styles.boldText}>{userName}</Text>
            <Text> te ha solicitado un raite</Text>
          </Text>
        );
      
      default:
        return <Text style={styles.notificationTitle}>Nueva notificación</Text>;
    }
  };

  // Agregar esta función para renderizar el contenido de las notificaciones
  const renderNotificationContent = (item: any) => {
    if (item.type === 'message') {
      return <Text style={styles.notificationText}>Abre el chat para ver el mensaje.</Text>;
    } else if (item.type.startsWith('post_')) {
      return <Text style={styles.notificationText}>Tu publicación ha recibido una interacción.</Text>;
    } else if (item.type.startsWith('forum_')) {
      return <Text style={styles.notificationText}>Tu pregunta ha recibido una respuesta.</Text>;
    } else if (item.type === 'raite_request') {
      return <Text style={styles.notificationText}>{item.contentText}</Text>;
    }
    return null;
  };

  // Combinar notificaciones y mensajes no leídos
  const allNotifications = [...messageNotifications.map(msg => ({
    type: 'message' as const,
    ...msg
  })), ...notifications];

  // Ordenar por fecha (más recientes primero)
  allNotifications.sort((a, b) => b.timestamp - a.timestamp);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Marcar como leída si es una notificación de Firestore
    if (item.type !== 'message' && item.id) {
      await markAsRead(item.id);
    }
    
    if (item.type === 'message') {
      // Navegar al chat
      router.push({
        pathname: '/extra/chat',
        params: { 
          friendId: item.userId,
          friendName: item.userName || 'Usuario',
          friendPhotoURL: item.userPhoto || '',
        }
      });
    } else if (item.type.startsWith('post_')) {
      // Navegar al post
      router.push({
        pathname: '/(drawer)/(tabs)/feed',
        params: { showPostId: item.contentId }
      });
    } else if (item.type.startsWith('forum_question_')) {
      // Navegar a la pregunta del foro
      router.push({
        pathname: '/extra/question-detail',
        params: { questionId: item.contentId }
      });
    } else if (item.type.startsWith('forum_answer_')) {
      // Navegar a la respuesta dentro de la pregunta
      router.push({
        pathname: '/extra/question-detail',
        params: { 
          questionId: item.relatedContentId,
          scrollToAnswerId: item.contentId
        }
      });
    } else if (item.type === 'raite_request') {
      // Navegar al mapa y mostrar la solicitud de raite
      router.push({
        pathname: '/(drawer)/(tabs)/map',
        params: { 
          showRaiteRequest: item.contentId,
          fromUserId: item.fromUserId
        }
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    await markAllAsRead();
    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Resto del renderizado con ScrollView y RefreshControl
  return (
    <View style={styles.container}>
      <MaxWidthContainer style={{maxWidth: 800}}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          {hasUnread && (
            <TouchableOpacity 
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#bb86fc" />
              ) : (
                <Text style={styles.markAllText}>Marcar todo como leído</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
        
        <ScrollView
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={["#bb86fc"]}
              tintColor="#bb86fc"
            />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {allNotifications.length > 0 ? (
            allNotifications.map((item, index) => (
            <TouchableOpacity 
                key={isMessageNotification(item) ? `message-${item.chatId}-${index}` : `notification-${item.id}-${index}`}
              style={[
                styles.notificationItem, 
                (item.type === 'message' || !item.read) ? styles.unreadItem : null
              ]} 
              onPress={() => handleNotificationPress(item)}
            >
              <View style={styles.avatarContainer}>
                <Image 
                    source={renderAvatar(item)} 
                  style={styles.avatar} 
                />
                <View style={styles.iconOverlay}>
                  {renderNotificationIcon(item)}
                </View>
              </View>
              
              <View style={styles.notificationContent}>
                {renderNotificationTitle(item)}
                {renderNotificationContent(item)}
                <Text style={styles.notificationTime}>
                  {new Date(item.timestamp).toLocaleString()}
                </Text>
              </View>
              
              {(item.type === 'message' || !item.read) && (
                <View style={styles.unreadIndicator} />
              )}
            </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-outline" size={64} color="#555" />
              <Text style={styles.emptyText}>
                No tienes notificaciones
              </Text>
            </View>
          )}
        </ScrollView>
      </MaxWidthContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    color: '#bb86fc',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
    backgroundColor: '#1e1e1e',
  },
  unreadItem: {
    backgroundColor: '#2a1a3a',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  iconOverlay: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 2,
    borderWidth: 2,
    borderColor: '#1e1e1e',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 4,
  },
  boldText: {
    fontWeight: 'bold',
  },
  notificationText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  notificationTime: {
    color: '#888',
    fontSize: 12,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#bb86fc',
    alignSelf: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 12,
  }
});