// app/_layout.tsx
import { Stack } from 'expo-router';
import { UserProvider } from '../context/UserContext';
import { NotificationProvider } from '../context/NotificationContext';
import { RaiteProvider } from '../context/RaiteContext';

export default function RootLayout() {
  return (
    <NotificationProvider>
      <UserProvider>
        <RaiteProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" options={{ gestureEnabled: false }} />
            <Stack.Screen name="(drawer)" options={{ gestureEnabled: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            <Stack.Screen name="index" options={{ gestureEnabled: false }} />
          </Stack>
        </RaiteProvider>
      </UserProvider>
    </NotificationProvider>
  );
}
