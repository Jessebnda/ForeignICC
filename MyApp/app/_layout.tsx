// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as Analytics from 'expo-firebase-analytics';

export default function RootLayout() {
  useEffect(() => {
    // Registramos un evento "app_opened" cuando la app se inicia
    Analytics.logEvent('app_opened');
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#121212' },
        headerTintColor: '#fff',
        headerTitleStyle: { color: '#fff' },
        headerTitle: '' // Esto quita el título
      }}
    >
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="extra" 
        options={{ 
          headerShown: true,
          headerBackTitle: '',
        }} 
      />
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
