import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../firebase';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { DrawerActions } from '@react-navigation/native';

export default function TabsLayout() {
  const [isAnonymous, setIsAnonymous] = useState<boolean | null>(null);
  const navigation = useNavigation();

  const openDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.dispatch(DrawerActions.openDrawer());
  };

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
