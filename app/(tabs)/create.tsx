import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Event } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import { LocationPicker } from '@/components/LocationPicker';
import { DateTimePicker } from '@/components/DateTimePicker';

type PartyType = 'pre' | 'after';

export default function CreatePartyScreen() {
  const params = useLocalSearchParams<{ eventId?: string; partyType?: string }>();
  const { session } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showEventPicker, setShowEventPicker] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [partyType, setPartyType] = useState<PartyType>((params.partyType as PartyType) || 'pre');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [dateTime, setDateTime] = useState(new Date());
  const [minAge, setMinAge] = useState('18');
  const [maxAge, setMaxAge] = useState('30');
  const [maxCapacity, setMaxCapacity] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (params.eventId && events.length > 0) {
      const event = events.find(e => e.id === params.eventId);
      if (event) {
        setSelectedEvent(event);
      }
    }
  }, [params.eventId, events]);

  const fetchEvents = async () => {
    // Allow events from the past 24 hours (for afters)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .gte('event_date', twentyFourHoursAgo)
      .order('event_date', { ascending: true });

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!session?.user?.id) {
      Alert.alert('Error', 'Por favor inicia sesión para crear una fiesta');
      return;
    }

    if (!selectedEvent) {
      Alert.alert('Error', 'Por favor selecciona un evento');
      return;
    }

    // Check if event is more than 24 hours in the past
    const eventDate = new Date(selectedEvent.event_date);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (eventDate < twentyFourHoursAgo) {
      Alert.alert('Error', 'No puedes crear fiestas para eventos de hace más de 24 horas');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título para la fiesta');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Por favor ingresa una dirección');
      return;
    }

    const parsedMinAge = parseInt(minAge) || 18;
    const parsedMaxAge = parseInt(maxAge) || 99;

    if (parsedMinAge < 18) {
      Alert.alert('Error', 'La edad mínima debe ser 18 o mayor');
      return;
    }

    if (parsedMaxAge < parsedMinAge) {
      Alert.alert('Error', 'La edad máxima debe ser mayor que la mínima');
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase
      .from('parties')
      .insert({
        event_id: selectedEvent.id,
        host_id: session.user.id,
        type: partyType,
        title: title.trim(),
        description: description.trim() || null,
        address: address.trim(),
        latitude,
        longitude,
        start_time: dateTime.toISOString(),
        min_age: parsedMinAge,
        max_age: parsedMaxAge,
        max_capacity: maxCapacity ? parseInt(maxCapacity) : null,
      })
      .select()
      .single();

    setSubmitting(false);

    if (error) {
      Alert.alert('Error', 'No pudimos crear la fiesta. Por favor intenta de nuevo.');
      console.error('Error creating party:', error);
      return;
    }

    Alert.alert('¡Listo!', '¡Tu fiesta ha sido creada!', [
      { text: 'Ver Fiesta', onPress: () => router.replace(`/party/${data.id}`) },
    ]);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Crear Fiesta</Text>
          <Text style={styles.subtitle}>
            Organiza una previa o after para un evento
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Evento</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowEventPicker(!showEventPicker)}
            >
              <Ionicons name="musical-notes" size={20} color="#fff" />
              <Text
                style={[
                  styles.selectText,
                  !selectedEvent && styles.selectTextPlaceholder,
                ]}
                numberOfLines={1}
              >
                {selectedEvent?.title || 'Selecciona un evento'}
              </Text>
              <Ionicons
                name={showEventPicker ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#888"
              />
            </TouchableOpacity>

            {showEventPicker && (
              <View style={styles.eventList}>
                {events.map((event) => (
                  <TouchableOpacity
                    key={event.id}
                    style={[
                      styles.eventOption,
                      selectedEvent?.id === event.id && styles.eventOptionActive,
                    ]}
                    onPress={() => {
                      setSelectedEvent(event);
                      setShowEventPicker(false);
                    }}
                  >
                    <Text style={styles.eventOptionText}>{event.title}</Text>
                    <Text style={styles.eventOptionDate}>
                      {formatDate(new Date(event.event_date))}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tipo de Fiesta</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  partyType === 'pre' && styles.typeButtonActive,
                ]}
                onPress={() => setPartyType('pre')}
              >
                <Ionicons
                  name="sunny"
                  size={20}
                  color={partyType === 'pre' ? '#000' : '#888'}
                />
                <Text
                  style={[
                    styles.typeText,
                    partyType === 'pre' && styles.typeTextActive,
                  ]}
                >
                  Previa
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  partyType === 'after' && styles.typeButtonActive,
                ]}
                onPress={() => setPartyType('after')}
              >
                <Ionicons
                  name="moon"
                  size={20}
                  color={partyType === 'after' ? '#000' : '#888'}
                />
                <Text
                  style={[
                    styles.typeText,
                    partyType === 'after' && styles.typeTextActive,
                  ]}
                >
                  After
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Título</Text>
            <TextInput
              style={styles.input}
              placeholder="ej: Previa en la Terraza"
              placeholderTextColor="#555"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Descripción (Opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Cuéntales qué esperar..."
              placeholderTextColor="#555"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Ubicación</Text>
            <LocationPicker
              value={address}
              placeholder="¿Dónde es la fiesta?"
              onLocationSelect={(location) => {
                setAddress(location.address);
                setLatitude(location.latitude);
                setLongitude(location.longitude);
              }}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Fecha y Hora</Text>
            <DateTimePicker
              value={dateTime}
              onChange={setDateTime}
              minimumDate={new Date()}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Rango de Edad</Text>
            <View style={styles.ageRow}>
              <View style={styles.ageInput}>
                <Text style={styles.ageLabel}>Mín</Text>
                <TextInput
                  style={styles.ageValue}
                  value={minAge}
                  onChangeText={setMinAge}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <Text style={styles.ageDash}>-</Text>
              <View style={styles.ageInput}>
                <Text style={styles.ageLabel}>Máx</Text>
                <TextInput
                  style={styles.ageValue}
                  value={maxAge}
                  onChangeText={setMaxAge}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Capacidad Máxima (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Dejar vacío para ilimitado"
              placeholderTextColor="#555"
              value={maxCapacity}
              onChangeText={setMaxCapacity}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { opacity: submitting ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitText}>Crear Fiesta</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
    color: '#888',
  },
  form: {
    gap: 20,
  },
  field: {},
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#fff',
    letterSpacing: 0.5,
  },
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
  eventList: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#262626',
    overflow: 'hidden',
  },
  eventOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  eventOptionActive: {
    backgroundColor: '#1a1a1a',
  },
  eventOptionText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
    color: '#fff',
  },
  eventOptionDate: {
    fontSize: 13,
    color: '#888',
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#262626',
  },
  typeButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  typeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
  },
  typeTextActive: {
    color: '#000',
  },
  input: {
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: '#fff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ageInput: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#111',
  },
  ageLabel: {
    fontSize: 12,
    marginBottom: 4,
    color: '#888',
  },
  ageValue: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 50,
    color: '#fff',
  },
  ageDash: {
    fontSize: 24,
    fontWeight: '300',
    color: '#888',
  },
  submitButton: {
    marginTop: 32,
    backgroundColor: '#fff',
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '700',
  },
});
