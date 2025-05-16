import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

type MaxWidthContainerProps = {
  children: React.ReactNode;
  style?: any;
};

export default function MaxWidthContainer({ children, style }: MaxWidthContainerProps) {
  if (Platform.OS !== 'web') {
    return <View style={{ flex: 1 }}>{children}</View>;
  }
  
  return (
    <View style={styles.container}>
      <View style={[styles.innerContainer, style]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 600, // Por defecto, similar a Instagram
  },
});