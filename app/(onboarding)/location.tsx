import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function LocationScreen() {
  const params = useLocalSearchParams<{ fullName: string; age: string; gender: string }>();
  const [radius, setRadius] = useState(25);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);

  const requestLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso Denegado',
          'Necesitamos acceso a tu ubicación para mostrarte fiestas cercanas. Puedes habilitarlo después en ajustes.'
        );
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      setLocationEnabled(true);
    } catch (error) {
      Alert.alert('Error', 'No pudimos obtener tu ubicación. Por favor intenta de nuevo.');
    }
    setLoading(false);
  };

  const handleContinue = () => {
    router.push({
      pathname: '/(onboarding)/instagram',
      params: {
        ...params,
        radius: radius.toString(),
        latitude: location?.latitude?.toString() || '',
        longitude: location?.longitude?.toString() || '',
      },
    });
  };

  const radiusOptions = [10, 25, 50, 100];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.progress}>
          <View style={[styles.progressDot, styles.progressComplete]} />
          <View style={[styles.progressLine, styles.progressLineComplete]} />
          <View style={[styles.progressDot, styles.progressActive]} />
          <View style={styles.progressLine} />
          <View style={styles.progressDot} />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Tu ubicación</Text>
          <Text style={styles.subtitle}>
            Habilita la ubicación para encontrar fiestas cerca de ti
          </Text>
        </View>

        <View style={styles.locationSection}>
          <TouchableOpacity
            style={[
              styles.locationButton,
              locationEnabled && styles.locationButtonActive,
            ]}
            onPress={requestLocation}
            disabled={loading || locationEnabled}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <View
                  style={[
                    styles.locationIcon,
                    locationEnabled && styles.locationIconActive,
                  ]}
                >
                  <Ionicons
                    name={locationEnabled ? 'checkmark' : 'location'}
                    size={28}
                    color={locationEnabled ? '#000' : '#fff'}
                  />
                </View>
                <Text style={styles.locationText}>
                  {locationEnabled ? 'Ubicación habilitada' : 'Habilitar ubicación'}
                </Text>
                <Text style={styles.locationSubtext}>
                  {locationEnabled
                    ? 'Ahora podemos mostrarte fiestas cercanas'
                    : 'Toca para permitir acceso a la ubicación'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.radiusSection}>
          <Text style={styles.radiusTitle}>Radio de Búsqueda</Text>
          <Text style={styles.radiusSubtitle}>
            ¿Qué tan lejos buscamos fiestas?
          </Text>

          <View style={styles.radiusOptions}>
            {radiusOptions.map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.radiusOption,
                  radius === r && styles.radiusOptionActive,
                ]}
                onPress={() => setRadius(r)}
              >
                <Text
                  style={[
                    styles.radiusValue,
                    radius === r && styles.radiusValueActive,
                  ]}
                >
                  {r}
                </Text>
                <Text
                  style={[
                    styles.radiusUnit,
                    radius === r && styles.radiusUnitActive,
                  ]}
                >
                  km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>Continuar</Text>
          </TouchableOpacity>

          {!locationEnabled && (
            <TouchableOpacity onPress={handleContinue}>
              <Text style={styles.skipText}>Omitir por ahora</Text>
            </TouchableOpacity>
          )}
        </View>
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
    paddingTop: 60,
    paddingBottom: 32,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  progressActive: {
    backgroundColor: '#fff',
  },
  progressComplete: {
    backgroundColor: '#30d158',
  },
  progressLine: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
    backgroundColor: '#333',
  },
  progressLineComplete: {
    backgroundColor: '#30d158',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    lineHeight: 24,
    color: '#888',
  },
  locationSection: {
    marginBottom: 32,
  },
  locationButton: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#262626',
  },
  locationButtonActive: {
    borderColor: '#30d158',
  },
  locationIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#1a1a1a',
  },
  locationIconActive: {
    backgroundColor: '#fff',
  },
  locationText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    color: '#fff',
    letterSpacing: 0.5,
  },
  locationSubtext: {
    fontSize: 14,
    color: '#888',
  },
  radiusSection: {
    flex: 1,
  },
  radiusTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    color: '#fff',
    letterSpacing: 0.5,
  },
  radiusSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    color: '#888',
  },
  radiusOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  radiusOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    borderRadius: 12,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#262626',
  },
  radiusOptionActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  radiusValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  radiusValueActive: {
    color: '#000',
  },
  radiusUnit: {
    fontSize: 14,
    marginTop: 2,
    color: '#888',
  },
  radiusUnitActive: {
    color: '#666',
  },
  footer: {
    gap: 16,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
});
