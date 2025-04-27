// app/_layout.tsx
import { Stack } from 'expo-router';
import { UserProvider } from '../context/UserContext'; // Adjust path if needed

export default function RootLayout() {
  return (
    // Wrap the entire app with the UserProvider
    <UserProvider>
      <Stack 
        screenOptions={{
          headerShown: false, // Hide header for the root stack by default
        }}
      >
        {/* Define screens/groups managed by this stack */}
        {/* This screen points to your main drawer navigation */}
        <Stack.Screen name="(drawer)" /> 
        
        {/* This screen points to your initial loading/redirect screen */}
        <Stack.Screen name="index" /> 

        {/* If 'extra' screens should be presented modally over everything, 
            you might define them here too, or handle them within (drawer) */}
        {/* Example for modal presentation: */}
        {/* <Stack.Screen name="extra" options={{ presentation: 'modal' }} /> */}

        {/* Add other top-level screens/groups if necessary */}
        
      </Stack>
    </UserProvider>
  );
}
