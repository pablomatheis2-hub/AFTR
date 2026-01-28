import React from 'react';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
      <ActivityIndicator size="large" color="#fff" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 24,
  },
  spinner: {
    marginTop: 16,
  },
});
