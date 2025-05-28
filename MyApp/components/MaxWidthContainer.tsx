import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';

type MaxWidthContainerProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function MaxWidthContainer({ children, style }: MaxWidthContainerProps) {
  if (Platform.OS !== 'web') {
    return <View style={[styles.nativeContainer, style]}>{children}</View>;
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
    backgroundColor: 'transparent',
  },
  nativeContainer: {
    flex: 1,
    width: '100%',
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 800,
    paddingHorizontal: Platform.OS === 'web' ? 16 : 0,
  },
});