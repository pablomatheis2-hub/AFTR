import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({
    lat: 40.4168,
    lng: -3.7038,
  });
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [manualAddress, setManualAddress] = useState('');

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('La geolocalización no está soportada en este navegador');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });

        // Try to get address from coordinates using a free geocoding service
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

          setSelectedLocation({
            latitude,
            longitude,
            address: address.split(',').slice(0, 3).join(','),
          });
          setManualAddress(address.split(',').slice(0, 3).join(','));
        } catch (error) {
          setSelectedLocation({
            latitude,
            longitude,
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          });
          setManualAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('No se pudo obtener tu ubicación. Por favor, ingresa la dirección manualmente.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        setCoordinates({ lat: latitude, lng: longitude });
        setSelectedLocation({
          latitude,
          longitude,
          address: display_name.split(',').slice(0, 3).join(','),
        });
        setManualAddress(display_name.split(',').slice(0, 3).join(','));
      } else {
        alert('No se encontró la dirección. Intenta con otra búsqueda.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      alert('Error al buscar la dirección');
    }
    setLoading(false);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect({
        ...selectedLocation,
        address: manualAddress || selectedLocation.address,
      });
      setModalVisible(false);
    } else if (manualAddress.trim()) {
      // Allow manual address entry without coordinates
      onLocationSelect({
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        address: manualAddress,
      });
      setModalVisible(false);
    }
  };

  // Use OpenStreetMap embed (no API key required)
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${coordinates.lng - 0.01},${coordinates.lat - 0.01},${coordinates.lng + 0.01},${coordinates.lat + 0.01}&layer=mapnik&marker=${coordinates.lat},${coordinates.lng}`;

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
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Seleccionar Ubicación</Text>
              <TouchableOpacity
                onPress={handleConfirm}
                disabled={!selectedLocation && !manualAddress.trim()}
              >
                <Text
                  style={[
                    styles.confirmText,
                    !selectedLocation && !manualAddress.trim() && styles.confirmTextDisabled,
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
                />
              </View>
              <TouchableOpacity
                style={styles.currentLocationButton}
                onPress={getCurrentLocation}
              >
                <Ionicons name="navigate" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.mapContainer}>
              <iframe
                src={mapUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: 16,
                }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              )}
            </View>

            <View style={styles.addressInputContainer}>
              <Text style={styles.addressLabel}>Dirección</Text>
              <TextInput
                style={styles.addressInput}
                placeholder="Ingresa o confirma la dirección..."
                placeholderTextColor="#555"
                value={manualAddress}
                onChangeText={setManualAddress}
                multiline
              />
            </View>

            <Text style={styles.helpText}>
              Usa el botón de ubicación para tu posición actual, o busca una dirección
            </Text>
          </View>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    backgroundColor: '#000',
    borderRadius: 24,
    overflow: 'hidden',
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
    outlineStyle: 'none',
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
    height: 250,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111',
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressInputContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
  },
  addressInput: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#fff',
    minHeight: 60,
    outlineStyle: 'none',
  },
  helpText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    paddingBottom: 24,
  },
});
