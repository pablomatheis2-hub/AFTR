import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import { Event } from '@/types/database';
import { BottomSheet } from '@/components/BottomSheet';
import { LocationPicker } from '@/components/LocationPicker';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState(new Date());
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const resetForm = () => {
    setTitle('');
    setVenue('');
    setDescription('');
    setAddress('');
    setLatitude(null);
    setLongitude(null);
    setImageUrl('');
    setSelectedImageUri(null);
    setSelectedImageBase64(null);
    setEventDate(new Date());
    setIsActive(true);
    setEditingEvent(null);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para seleccionar una imagen.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64 = result.assets[0].base64;
      // Validate image size (base64 is ~1.33x larger than binary)
      if (base64 && base64.length > 5 * 1024 * 1024 * 1.33) {
        Alert.alert('Imagen muy grande', 'La imagen debe ser menor a 5MB');
        return;
      }
      setSelectedImageUri(result.assets[0].uri);
      setSelectedImageBase64(base64 || null);
      setImageUrl(''); // Clear manual URL if picking an image
    }
  };

  const uploadEventImage = async (): Promise<string | null> => {
    if (!selectedImageBase64 || !selectedImageUri) return null;
    
    try {
      const fileExt = selectedImageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `events/${Date.now()}.${fileExt}`;
      const contentType = fileExt === 'png' ? 'image/png' : 'image/jpeg';

      const { error: uploadError } = await supabase.storage
        .from('events')
        .upload(fileName, decode(selectedImageBase64), {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Error', 'No se pudo subir la imagen.');
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('events')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Event image upload error:', error);
      return null;
    }
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (event: Event) => {
    setEditingEvent(event);
    setTitle(event.title);
    setVenue(event.venue);
    setDescription(event.description || '');
    setAddress(event.address || '');
    setLatitude(event.latitude);
    setLongitude(event.longitude);
    setImageUrl(event.image_url || '');
    setSelectedImageUri(null);
    setSelectedImageBase64(null);
    setEventDate(new Date(event.event_date));
    setIsActive(event.is_active);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !venue.trim()) {
      Alert.alert('Error', 'Titulo y lugar son requeridos');
      return;
    }

    setSaving(true);

    // Upload image if one was selected
    let finalImageUrl = imageUrl.trim() || null;
    if (selectedImageBase64) {
      const uploadedUrl = await uploadEventImage();
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      }
    }

    const eventData = {
      title: title.trim(),
      venue: venue.trim(),
      description: description.trim() || null,
      address: address.trim() || null,
      latitude,
      longitude,
      image_url: finalImageUrl,
      event_date: eventDate.toISOString(),
      is_active: isActive,
    };

    if (editingEvent) {
      const { error } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', editingEvent.id);

      if (error) {
        Alert.alert('Error', 'No se pudo actualizar el evento');
      } else {
        fetchEvents();
        setShowForm(false);
        resetForm();
      }
    } else {
      const { error } = await supabase.from('events').insert(eventData);

      if (error) {
        Alert.alert('Error', 'No se pudo crear el evento');
      } else {
        fetchEvents();
        setShowForm(false);
        resetForm();
      }
    }

    setSaving(false);
  };

  const toggleEventActive = async (event: Event) => {
    const { error } = await supabase
      .from('events')
      .update({ is_active: !event.is_active })
      .eq('id', event.id);

    if (!error) {
      setEvents(events.map(e => 
        e.id === event.id ? { ...e, is_active: !e.is_active } : e
      ));
    }
  };

  const deleteEvent = (event: Event) => {
    Alert.alert(
      'Eliminar Evento',
      `¿Estás seguro de eliminar "${event.title}"? Esto eliminará todas las fiestas asociadas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('events').delete().eq('id', event.id);
            if (!error) {
              setEvents(events.filter(e => e.id !== event.id));
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#555" />
            <Text style={styles.emptyText}>No hay eventos</Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {events.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventVenue}>{event.venue}</Text>
                    <Text style={styles.eventDate}>{formatDate(event.event_date)}</Text>
                  </View>
                  <View style={[styles.statusBadge, !event.is_active && styles.statusInactive]}>
                    <Text style={[styles.statusText, !event.is_active && styles.statusTextInactive]}>
                      {event.is_active ? 'Activo' : 'Inactivo'}
                    </Text>
                  </View>
                </View>
                <View style={styles.eventActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => toggleEventActive(event)}
                  >
                    <Ionicons
                      name={event.is_active ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#888"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openEditForm(event)}
                  >
                    <Ionicons name="pencil-outline" size={18} color="#888" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => deleteEvent(event)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={openCreateForm}>
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>

      <BottomSheet visible={showForm} onClose={() => setShowForm(false)}>
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.formTitle}>
            {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Titulo *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Nombre del evento"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Lugar *</Text>
            <TextInput
              style={styles.input}
              value={venue}
              onChangeText={setVenue}
              placeholder="Club, bar, etc."
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Descripcion</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descripcion del evento"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Ubicacion</Text>
            <LocationPicker
              value={address}
              onLocationSelect={(loc) => {
                setAddress(loc.address);
                setLatitude(loc.latitude);
                setLongitude(loc.longitude);
              }}
              placeholder="Seleccionar ubicacion en el mapa"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Imagen del Evento</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {selectedImageUri ? (
                <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
              ) : imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={32} color="#666" />
                  <Text style={styles.imagePlaceholderText}>Toca para seleccionar imagen</Text>
                </View>
              )}
            </TouchableOpacity>
            {(selectedImageUri || imageUrl) && (
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setSelectedImageUri(null);
                  setSelectedImageBase64(null);
                  setImageUrl('');
                }}
              >
                <Text style={styles.removeImageText}>Eliminar imagen</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Fecha y Hora</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#888" />
              <Text style={styles.dateButtonText}>{formatDate(eventDate.toISOString())}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={eventDate}
              mode="datetime"
              display="spinner"
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) setEventDate(date);
              }}
              textColor="#fff"
            />
          )}

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Evento Activo</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#333', true: '#a855f7' }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.saveButtonText}>
                {editingEvent ? 'Guardar Cambios' : 'Crear Evento'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowForm(false)}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#555',
    fontSize: 16,
    marginTop: 12,
  },
  eventsList: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  eventVenue: {
    fontSize: 14,
    color: '#a855f7',
    marginTop: 4,
  },
  eventDate: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: '#22c55e20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusInactive: {
    backgroundColor: '#ff444420',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22c55e',
  },
  statusTextInactive: {
    color: '#ff4444',
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#262626',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#a855f7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  formContainer: {
    paddingHorizontal: 24,
    maxHeight: 500,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#262626',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  imagePicker: {
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262626',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    color: '#666',
    fontSize: 14,
  },
  removeImageButton: {
    marginTop: 8,
    alignSelf: 'center',
  },
  removeImageText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '500',
  },
  dateButton: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#262626',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#262626',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#a855f7',
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
