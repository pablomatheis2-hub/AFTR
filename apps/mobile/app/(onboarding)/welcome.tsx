import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Image source={require('@/assets/images/logo.png')} style={styles.logoImage} />
          <Text style={styles.title}>Bienvenido a la fiesta</Text>
          <Text style={styles.subtitle}>
            Configura tu perfil para descubrir y unirte a increíbles previas y afters
          </Text>
        </View>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="search" size={24} color="#fff" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Descubre Fiestas</Text>
              <Text style={styles.featureDesc}>Encuentra previas y afters cerca de ti</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="people" size={24} color="#fff" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Conecta con Gente</Text>
              <Text style={styles.featureDesc}>Ve quién va y su Instagram</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="add-circle" size={24} color="#fff" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Organiza la Tuya</Text>
              <Text style={styles.featureDesc}>Crea y gestiona tus propias fiestas</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(onboarding)/profile')}
        >
          <Text style={styles.buttonText}>Comenzar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 48,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
  },
  logoImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
    paddingHorizontal: 20,
    color: '#888',
  },
  features: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  featureDesc: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    height: 56,
    borderRadius: 30,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
});
