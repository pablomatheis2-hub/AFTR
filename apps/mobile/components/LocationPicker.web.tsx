import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await response.json();
      return data.display_name?.split(',').slice(0, 3).join(',') || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch {
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  };

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setCoordinates({ lat, lng });
    
    const address = await reverseGeocode(lat, lng);
    setSelectedLocation({
      latitude: lat,
      longitude: lng,
      address,
    });
    setManualAddress(address);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!modalVisible || !mapContainerRef.current) return;

    const initMap = async () => {
      // Dynamically load Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Dynamically load Leaflet JS
      if (!(window as any).L) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }

      const L = (window as any).L;

      // Clean up existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Create map
      const map = L.map(mapContainerRef.current).setView([coordinates.lat, coordinates.lng], 15);
      mapInstanceRef.current = map;

      // Add dark tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      // Add click handler
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        
        // Update or create marker
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'custom-marker',
              html: '<div style="width:24px;height:24px;background:#fff;border-radius:50%;border:3px solid #000;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            }),
          }).addTo(map);
        }
        
        handleMapClick(lat, lng);
      });

      // Add existing marker if there's a selected location
      if (selectedLocation) {
        markerRef.current = L.marker([selectedLocation.latitude, selectedLocation.longitude], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: '<div style="width:24px;height:24px;background:#fff;border-radius:50%;border:3px solid #000;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        }).addTo(map);
      }
    };

    // Small delay to ensure container is rendered
    const timer = setTimeout(initMap, 100);
    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [modalVisible]);

  // Update map view when coordinates change
  useEffect(() => {
    if (mapInstanceRef.current && coordinates) {
      mapInstanceRef.current.setView([coordinates.lat, coordinates.lng], 15);
      
      const L = (window as any).L;
      if (L && selectedLocation) {
        if (markerRef.current) {
          markerRef.current.setLatLng([selectedLocation.latitude, selectedLocation.longitude]);
        } else {
          markerRef.current = L.marker([selectedLocation.latitude, selectedLocation.longitude], {
            icon: L.divIcon({
              className: 'custom-marker',
              html: '<div style="width:24px;height:24px;background:#fff;border-radius:50%;border:3px solid #000;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            }),
          }).addTo(mapInstanceRef.current);
        }
      }
    }
  }, [coordinates, selectedLocation]);

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

        const address = await reverseGeocode(latitude, longitude);
        setSelectedLocation({
          latitude,
          longitude,
          address,
        });
        setManualAddress(address);
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
      onLocationSelect({
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        address: manualAddress,
      });
      setModalVisible(false);
    }
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
              <div
                ref={mapContainerRef as any}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 16,
                }}
              />
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
              Toca en el mapa para seleccionar una ubicación o usa la barra de búsqueda
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
  selectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
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
