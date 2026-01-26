import React from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';

interface WebContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
}

export function WebContainer({ children, maxWidth = 480 }: WebContainerProps) {
  const { width } = useWindowDimensions();

  // Only apply container styling on web and when screen is wider than maxWidth
  if (Platform.OS !== 'web' || width <= maxWidth) {
    return <>{children}</>;
  }

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.innerContainer, { maxWidth }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
    // Add subtle border on sides for larger screens
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#1a1a1a',
  },
});
