// app/_layout.tsx
import { Stack } from 'expo-router';
import { AuthProvider } from '../lib/auth';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{
        headerStyle: { backgroundColor: '#121212' },
        headerTintColor: '#fff',
        headerTitleStyle: { color: '#fff' },
        headerTitle: '' // This removes the title
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
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
    </AuthProvider>
  );
}
