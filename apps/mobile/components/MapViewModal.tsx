import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

interface MapViewModalProps {
  visible: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  address?: string;
  title?: string;
}

export function MapViewModal({
  visible,
  onClose,
  latitude,
  longitude,
  address,
  title,
}: MapViewModalProps) {
  const openInMaps = () => {
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:',
    });
    const url = Platform.select({
      ios: `${scheme}?q=${latitude},${longitude}`,
      android: `${scheme}${latitude},${longitude}?q=${latitude},${longitude}(${title || 'Ubicacion'})`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ubicacion</Text>
          <TouchableOpacity onPress={openInMaps}>
            <Ionicons name="navigate" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude,
              longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
          >
            <Marker
              coordinate={{ latitude, longitude }}
              title={title}
              description={address}
              pinColor="#fff"
            />
          </MapView>
        </View>

        {address && (
          <View style={styles.addressContainer}>
            <Ionicons name="location" size={24} color="#fff" />
            <View style={styles.addressInfo}>
              {title && <Text style={styles.addressTitle}>{title}</Text>}
              <Text style={styles.addressText}>{address}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.directionsButton} onPress={openInMaps}>
          <Ionicons name="navigate-outline" size={20} color="#000" />
          <Text style={styles.directionsButtonText}>Abrir en Mapas</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 12,
    marginBottom: 16,
  },
  addressInfo: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#888',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 30,
    height: 56,
  },
  directionsButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },
});
