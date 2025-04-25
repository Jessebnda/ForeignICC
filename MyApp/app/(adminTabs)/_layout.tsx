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
        tabBarStyle: { backgroundColor: '#1e1e1e', borderTopColor: '#333' },
        tabBarActiveTintColor: '#bb86fc',
        tabBarInactiveTintColor: '#888',
        
      }}
    >
      <Tabs.Screen
        name="index"
        
        options={{
         headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="school-outline" color={color} size={size} />
          ),
        }}
      />
     
    </Tabs>
  );
}
