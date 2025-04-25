import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';
import { TouchableOpacity, Platform, View } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

export default function TabsLayout() {
  const [isAnonymous, setIsAnonymous] = useState<boolean | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAnonymous(user.isAnonymous);
      }
    });

    return () => unsubscribe();
  }, []);

  const openDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.dispatch(DrawerActions.openDrawer());
  };

  if (isAnonymous === null) return null;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#1e1e1e', shadowColor: '#000', shadowOpacity: 0.3 },
        headerTintColor: '#fff',
        tabBarStyle: { backgroundColor: '#1e1e1e', borderTopColor: '#333' },
        tabBarActiveTintColor: '#bb86fc',
        tabBarInactiveTintColor: '#888',
        headerLeft: () => (
          <TouchableOpacity
            style={{
              padding: 4,
              marginLeft: 10,
              backgroundColor: '#f5f5f5',
              borderRadius: 50,
            }}
            onPress={openDrawer}
          >
            <Ionicons name="menu" size={24} color="#333" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={{ marginRight: 10 }}>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="mentor"
        options={{
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
