// app/(tabs)/extra/_layout.tsx
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, Platform, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRouter } from 'expo-router';
import { useNotifications } from '../../context/NotificationContext';
import { auth, firestore, database } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { collection, query, where, onSnapshot, getCountFromServer } from 'firebase/firestore';

export default function ExtraLayout() {
  const { notifications } = useNotifications();
  const navigation = useNavigation();
  const router = useRouter();
  const [isAnonymous, setIsAnonymous] = useState<boolean | null>(null);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);


  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
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
    <Stack screenOptions={{
            headerTitle: ForeignHeader,
            headerStyle: { backgroundColor: '#1e1e1e' },
            headerTintColor: '#fff',
            headerLeft: () => (
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }} onPress={goBack} >
                <Ionicons name="arrow-back" size={24} color="#fff" />
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

      <Stack.Screen name="notifications" />
      <Stack.Screen name="friendProfile" options={{ title: '' }} />
      <Stack.Screen name="chat" options={{ title: '' }} />
      <Stack.Screen name="createPost" options={{ title: '' }} />
      <Stack.Screen name="editProfile" options={{ title: '' }} />
      <Stack.Screen name="questionDetail" options={{ title: '' }} />
      <Stack.Screen name="answerDetail" options={{ title: '' }} />
      <Stack.Screen name="mentorList" options={{ title: '' }} />
      <Stack.Screen name="mentorChat" options={{ title: '' }} />
      <Stack.Screen name="chatbot" options={{ title: '' }} />
    </Stack>
  );
}
const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    maxWidth: 768,
    width: '100%',
  }
});
