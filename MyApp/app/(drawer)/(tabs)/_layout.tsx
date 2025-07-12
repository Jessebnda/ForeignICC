import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firestore, database } from '../../../firebase';
import { Text, TouchableOpacity, View, Platform, StyleSheet } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { DrawerActions } from '@react-navigation/native';
import { RaiteProvider, useRaite } from '../../../context/RaiteContext'; 
import { ref, onValue } from 'firebase/database';
import { collection, query, where, onSnapshot, getCountFromServer } from 'firebase/firestore';
import { useNotifications } from '../../../context/NotificationContext';

export default function TabLayout() {
  const [isAnonymous, setIsAnonymous] = useState<boolean | null>(null);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const navigation = useNavigation();
  const router = useRouter();
  const { hasActiveRaiteRequest } = useRaite();
  const { notifications } = useNotifications();
  
  // Verificar si hay solicitudes de raite no leídas
  const hasUnreadRaiteRequests = notifications.some(
    notif => notif.type === 'raite_request' && !notif.read
  );

  const openDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.dispatch(DrawerActions.openDrawer());
  };

  // Comprobar mensajes no leídos y otras notificaciones
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.isAnonymous) return;

    // Listener para mensajes no leídos
    const messagesRef = ref(database, 'messages');
    const unsubscribeMessages = onValue(messagesRef, async (snapshot) => {
      if (!snapshot.exists()) {
        setHasUnreadNotifications(false);
        return;
      }
      
      let hasUnread = false;
      const allChats = snapshot.val();
      const chatIds = Object.keys(allChats).filter(id => id.includes(currentUser.uid));
      
      for (const chatId of chatIds) {
        const chatMessages = allChats[chatId];
        if (!chatMessages) continue;
        
        const messagesArray = Object.values(chatMessages);
        const hasUnreadMessages = messagesArray.some((msg: any) => 
          msg.from !== currentUser.uid && !msg.read
        );
        
        if (hasUnreadMessages) {
          hasUnread = true;
          break;
        }
      }
      
      // Verificar también notificaciones de Firestore
      const notifQuery = query(
        collection(firestore, 'notifications'),
        where('toUserId', '==', currentUser.uid),
        where('read', '==', false)
      );
      
      // Usar la consulta correcta para contar solo notificaciones no leídas
      const notifSnapshot = await getCountFromServer(notifQuery);
      const hasFirestoreNotifications = notifSnapshot.data().count > 0;
      
      // Solo mostrar el indicador si hay al menos una notificación
      setHasUnreadNotifications(hasUnread || hasFirestoreNotifications);
    });
    
    return () => {
      unsubscribeMessages();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAnonymous(user.isAnonymous);
      }
    });
    return () => unsubscribe();
  }, []);

  if (isAnonymous === null) return null;

  const navigateToNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/extra/notifications');
  };

  const ForeignHeader = () => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', width: '100%' }}>
      <Text style={{ fontSize: 22, fontStyle: 'italic', color: 'white', fontWeight: 'bold' }}>
        Foreign
      </Text>
    </View>
  );

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#1e1e1e', shadowColor: '#000', shadowOpacity: 0.3 },
        headerTintColor: '#fff',
        tabBarStyle: { backgroundColor: '#1e1e1e', borderTopColor: '#333' },
        tabBarActiveTintColor: '#bb86fc',
        tabBarInactiveTintColor: '#888',
        headerLeft: () => (
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }} onPress={openDrawer} >
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity 
            style={{ position: 'relative', marginRight: 15 }} 
            onPress={navigateToNotifications}
          >
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            {hasUnreadNotifications && (
              <View style={{
                position: 'absolute',
                top: -5,
                right: -5,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: '#FF3B30',
                borderWidth: 1,
                borderColor: '#1e1e1e'
              }} />
            )}
          </TouchableOpacity>
        ),
        ...(Platform.OS === 'web' ? {
          contentStyle: {
            alignItems: 'center',
          }
        } : {})
      }}
    >
      <Tabs.Screen 
        name="feed" 
        options={{
          headerTitle: ForeignHeader,
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen 
        name="map" 
        options={{
          headerTitle: ForeignHeader,
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" color={color} size={size} />
          ),
          tabBarBadge: hasUnreadRaiteRequests ? "!" : undefined,
          tabBarBadgeStyle: { backgroundColor: '#FF6B6B' }
        }}
      />


      <Tabs.Screen 
        name="mentor" 
        options={{
          headerTitle: ForeignHeader,
          title: 'Mentor',
          href: isAnonymous ? null : undefined,
          tabBarIcon: isAnonymous
            ? () => null
            : ({ color, size }) => (
                <Ionicons name="people" color={color} size={size} />
              ),
        }}
      />

      <Tabs.Screen 
        name="forum" 
        options={{
          headerTitle: ForeignHeader,
          title: 'Forum',
          href: isAnonymous ? null : undefined,
          tabBarIcon: isAnonymous
            ? () => null
            : ({ color, size }) => (
                <Ionicons name="chatbubble" color={color} size={size} />
              ),
        }}
      />

      <Tabs.Screen 
        name="profile" 
        options={{
          headerTitle: ForeignHeader,
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    maxWidth: 768,
    width: '100%',
  }
});
