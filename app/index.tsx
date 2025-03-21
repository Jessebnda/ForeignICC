// app/index.tsx
import React from 'react';
import LoginScreen from './login';
import { StyleSheet, View } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <LoginScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
