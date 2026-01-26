import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

interface LocationPickerProps {
  value: string;
  onLocationSelect: (location: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  placeholder?: string;
}

export function LocationPicker({
  value,
  onLocationSelect,
  placeholder = 'Seleccionar ubicación',
}: LocationPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: 40.4168, // Madrid default
    longitude: -3.7038,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (modalVisible) {
      getCurrentLocation();
    }
  }, [modalVisible]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      setLoading(true);
      const location = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      setLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      setLoading(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLoading(true);

    try {
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const formattedAddress = address
        ? [address.street, address.streetNumber, address.city]
            .filter(Boolean)
            .join(', ')
        : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

      setSelectedLocation({
        latitude,
        longitude,
        address: formattedAddress,
      });
    } catch (error) {
      setSelectedLocation({
        latitude,
        longitude,
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      });
    }

    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    Keyboard.dismiss();
    setLoading(true);

    try {
      const results = await Location.geocodeAsync(searchQuery);
      if (results.length > 0) {
        const { latitude, longitude } = results[0];
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 500);

        const [address] = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        const formattedAddress = address
          ? [address.street, address.streetNumber, address.city]
              .filter(Boolean)
              .join(', ')
          : searchQuery;

        setSelectedLocation({
          latitude,
          longitude,
          address: formattedAddress,
        });
      } else {
        Alert.alert('No encontrado', 'No se encontró la dirección');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      Alert.alert('Error', 'No se pudo buscar la ubicación');
    }

    setLoading(false);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      setModalVisible(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu ubicación');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 500);

      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const formattedAddress = address
        ? [address.street, address.streetNumber, address.city]
            .filter(Boolean)
            .join(', ')
        : 'Tu ubicación actual';

      setSelectedLocation({
        latitude,
        longitude,
        address: formattedAddress,
      });
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'No se pudo obtener tu ubicación');
    }
    setLoading(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="location" size={20} color="#fff" />
        <Text
          style={[styles.selectText, !value && styles.selectTextPlaceholder]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#888" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Seleccionar Ubicación</Text>
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!selectedLocation}
            >
              <Text
                style={[
                  styles.confirmText,
                  !selectedLocation && styles.confirmTextDisabled,
                ]}
              >
                Listo
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="#888" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar dirección..."
                placeholderTextColor="#555"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
            </View>
            <TouchableOpacity
              style={styles.currentLocationButton}
              onPress={handleUseCurrentLocation}
            >
              <Ionicons name="navigate" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              region={region}
              onRegionChangeComplete={setRegion}
              onPress={handleMapPress}
              showsUserLocation
              showsMyLocationButton={false}
            >
              {selectedLocation && (
                <Marker
                  coordinate={{
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                  }}
                  pinColor="#fff"
                />
              )}
            </MapView>

            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
          </View>

          {selectedLocation && (
            <View style={styles.selectedLocationContainer}>
              <Ionicons name="location" size={24} color="#fff" />
              <View style={styles.selectedLocationInfo}>
                <Text style={styles.selectedLocationLabel}>
                  Ubicación seleccionada
                </Text>
                <Text style={styles.selectedLocationAddress} numberOfLines={2}>
                  {selectedLocation.address}
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.helpText}>
            Toca en el mapa para seleccionar una ubicación o usa la barra de
            búsqueda
          </Text>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#111',
    gap: 12,
  },
  selectText: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
  },
  selectTextPlaceholder: {
    color: '#555',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  confirmTextDisabled: {
    color: '#555',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#fff',
  },
  currentLocationButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    margin: 16,
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 12,
  },
  selectedLocationInfo: {
    flex: 1,
  },
  selectedLocationLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  selectedLocationAddress: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  helpText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
});
