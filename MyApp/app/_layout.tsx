// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: '#121212' },
      headerTintColor: '#fff',
      headerTitleStyle: { color: '#fff' },
      headerTitle: '' // This removes the title
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(adminTabs)" options={{ headerShown: false }} />

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
