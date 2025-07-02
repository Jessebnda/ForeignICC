// app/(tabs)/extra/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { getForeignHeaderOptions } from '../../components/ForeignHeader';

export default function ExtraLayout() {
  const { notifications } = useNotifications();

  const hasUnreadNotifications = notifications.some(
    notif => !notif.read
  );

  return (
    <Stack screenOptions={getForeignHeaderOptions(hasUnreadNotifications)}>
      <Stack.Screen name="notifications" />
      <Stack.Screen name="friendProfile" />
      <Stack.Screen name="chat"/> 
      <Stack.Screen name="createPost"/>
      <Stack.Screen name="editProfile"/>
      <Stack.Screen name="questionDetail" />
      <Stack.Screen name="answerDetail"/>
      <Stack.Screen name="mentorList"/>
      <Stack.Screen name="mentorChat"/>
      <Stack.Screen name="chatbot"/>
    </Stack>
  );
}
