import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../firebase';
import { TouchableOpacity, View, Text } from 'react-native';
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

  const ForeignHeader = () => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', width: '100%' }}>
      <Text style={{ fontSize: 22, fontStyle: 'italic', color: 'white', fontWeight: 'bold' }}>
        Admin
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
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }} onPress={openDrawer}>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: ForeignHeader,
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="school-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}