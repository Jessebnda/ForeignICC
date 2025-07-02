// components/ForeignHeaderOptions.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useNotifications } from '../context/NotificationContext';

export function getForeignHeaderOptions(hasUnreadNotifications: boolean) {
  const navigation = useNavigation();
  const router = useRouter();

  const openDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const navigateToNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/extra/notifications');
  };

  return {
    headerStyle: { backgroundColor: '#1e1e1e', shadowColor: '#000', shadowOpacity: 0.3 },
    headerTintColor: '#fff',
    headerTitle: () => (
      <View style={{ flexDirection: 'row', justifyContent: 'center', flex: 1 }}>
        <Text style={{ fontSize: 22, fontStyle: 'italic', color: 'white', fontWeight: 'bold' }}>
          Foreign
        </Text>
      </View>
    ),
    headerLeft: () => (
      <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }} onPress={openDrawer}>
        <Ionicons name="menu" size={24} color="#fff" />
      </TouchableOpacity>
    ),
    headerRight: () => (
      <TouchableOpacity style={{ position: 'relative', marginRight: 15 }} onPress={navigateToNotifications}>
        <Ionicons name="notifications-outline" size={24} color="#fff" />
        {hasUnreadNotifications && (
          <View style={{
            position: 'absolute',
            top: -5,
            right: -5,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: '#FF3B30',
            borderWidth: 1,
            borderColor: '#1e1e1e'
          }} />
        )}
      </TouchableOpacity>
    )
  };
}
