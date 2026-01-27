import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';

interface WebContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
}

export function WebContainer({ children, maxWidth = 480 }: WebContainerProps) {
  // Track if we're mounted to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  const { width } = useWindowDimensions();

  useEffect(() => {
    setMounted(true);
  }, []);

  // On native, just render children directly
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  // On web, always render the container structure for consistency
  // Use mounted state to determine actual width-based styling
  const shouldApplyContainer = mounted && width > maxWidth;

  return (
    <View style={styles.outerContainer}>
      <View style={[
        styles.innerContainer,
        shouldApplyContainer && { maxWidth, borderLeftWidth: 1, borderRightWidth: 1 }
      ]}>
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
    borderColor: '#1a1a1a',
  },
});
