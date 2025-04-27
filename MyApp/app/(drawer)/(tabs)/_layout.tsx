import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../firebase';
import { Text, View } from 'react-native';

export default function TabsLayout() {
  const [isAnonymous, setIsAnonymous] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAnonymous(user.isAnonymous);
      }
    });
    return () => unsubscribe();
  }, []);

  if (isAnonymous === null) return null;

  const ForeignHeader = () => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
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
      }}
    >
      <Tabs.Screen 
        name="feed" 
        options={{
          headerTitle: ForeignHeader,
          title: 'Foreign',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen 
        name="mentor" 
        options={{
          headerTitle: ForeignHeader,
          title: 'Foreign',
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
          title: 'Foreign',
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
          title: 'Foreign',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
