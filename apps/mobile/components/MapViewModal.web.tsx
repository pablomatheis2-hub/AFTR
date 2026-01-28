import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
} from 'react-native';
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
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${latitude},${longitude}&zoom=15`;
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=600x400&markers=color:white%7C${latitude},${longitude}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
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
            <Text style={styles.directionsButtonText}>Abrir en Google Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    backgroundColor: '#000',
    borderRadius: 24,
    overflow: 'hidden',
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
    height: 350,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111',
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
    marginBottom: 24,
    borderRadius: 30,
    height: 56,
  },
  directionsButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },
});
