import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Party, User, Event } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import { AttendeeList } from '@/components/AttendeeList';
import { GenderRatio } from '@/components/GenderRatio';
import { MapViewModal } from '@/components/MapViewModal';
import { formatFullDate, formatTime, getInstagramUrl } from '@/lib/utils';

type PartyDetail = Party & {
  host: User;
  event: Event;
};

export default function PartyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, user } = useAuth();
  const [party, setParty] = useState<PartyDetail | null>(null);
  const [attendees, setAttendees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [joiningLeaving, setJoiningLeaving] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<string | null>(null);
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPartyData();
    }
  }, [id]);

  const fetchPartyData = async () => {
    const { data: partyData, error: partyError } = await supabase
      .from('parties')
      .select('*, host:users!host_id(*), event:events!event_id(*)')
      .eq('id', id)
      .single();

    if (partyError) {
      console.error('Error fetching party:', partyError);
      setLoading(false);
      return;
    }

    setParty(partyData as PartyDetail);

    const { data: attendeesData } = await supabase
      .from('party_attendees')
      .select('user:users!user_id(*)')
      .eq('party_id', id);

    const users = attendeesData?.map((a: any) => a.user).filter(Boolean) || [];
    setAttendees(users);

    if (session?.user?.id) {
      const isUserJoined = users.some((u: User) => u.id === session.user.id);
      setIsJoined(isUserJoined);
    }

    setLoading(false);
  };

  const handleJoinLeave = async () => {
    if (!session?.user?.id) {
      Alert.alert('Error', 'Por favor inicia sesión para unirte a fiestas');
      return;
    }

    if (!party) return;

    if (party.max_capacity && attendees.length >= party.max_capacity && !isJoined) {
      Alert.alert('Fiesta llena', 'Esta fiesta ha alcanzado su capacidad máxima');
      return;
    }

    if (user?.age && (user.age < party.min_age || user.age > party.max_age) && !isJoined) {
      Alert.alert(
        'Restricción de edad',
        `Esta fiesta es para edades ${party.min_age}-${party.max_age}`
      );
      return;
    }

    setJoiningLeaving(true);

    if (isJoined) {
      const { error } = await supabase
        .from('party_attendees')
        .delete()
        .eq('party_id', party.id)
        .eq('user_id', session.user.id);

      if (error) {
        Alert.alert('Error', 'No pudimos procesar tu solicitud');
      } else {
        setIsJoined(false);
        setAttendees(attendees.filter((a) => a.id !== session.user.id));
      }
    } else {
      const { error } = await supabase.from('party_attendees').insert({
        party_id: party.id,
        user_id: session.user.id,
      });

      if (error) {
        Alert.alert('Error', 'No pudimos procesar tu solicitud');
      } else {
        setIsJoined(true);
        if (user) {
          setAttendees([...attendees, user]);
        }
      }
    }

    setJoiningLeaving(false);
  };

  const maleCount = attendees.filter((a) => a.gender === 'male').length;
  const femaleCount = attendees.filter((a) => a.gender === 'female').length;

  const handleOpenInstagram = (handle: string | null | undefined) => {
    const url = getInstagramUrl(handle);
    if (!url) return;

    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const isHost = session?.user?.id === party?.host_id;

  const handleDeleteParty = async () => {
    if (!party) return;

    Alert.alert(
      'Eliminar Fiesta',
      '¿Estás seguro de que quieres eliminar esta fiesta? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('parties')
              .delete()
              .eq('id', party.id);

            if (error) {
              Alert.alert('Error', 'No pudimos eliminar la fiesta');
              return;
            }

            Alert.alert('Listo', 'La fiesta ha sido eliminada', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          },
        },
      ]
    );
  };

  const handleReport = async () => {
    if (!session?.user?.id || !party || !reportReason) return;

    setSubmittingReport(true);

    const { error } = await supabase.from('reports').insert({
      reporter_id: session.user.id,
      party_id: party.id,
      reason: reportReason,
      description: reportDescription || null,
    });

    setSubmittingReport(false);

    if (error) {
      Alert.alert('Error', 'No pudimos enviar el reporte. Intenta de nuevo.');
      return;
    }

    setShowReportModal(false);
    setReportReason(null);
    setReportDescription('');
    Alert.alert('Gracias', 'Tu reporte ha sido enviado y sera revisado por nuestro equipo.');
  };

  const reportReasons = [
    { value: 'inappropriate', label: 'Contenido inapropiado' },
    { value: 'spam', label: 'Spam' },
    { value: 'fake', label: 'Fiesta falsa' },
    { value: 'harassment', label: 'Acoso' },
    { value: 'other', label: 'Otro' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!party) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Fiesta no encontrada</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerBackTitle: 'Atrás',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerRight: () =>
            !isHost && session?.user?.id ? (
              <TouchableOpacity
                onPress={() => setShowReportModal(true)}
                style={styles.reportHeaderButton}
              >
                <Ionicons name="flag-outline" size={22} color="#888" />
              </TouchableOpacity>
            ) : null,
        }}
      />
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.typeBanner}>
            <Ionicons
              name={party.type === 'pre' ? 'sunny' : 'moon'}
              size={20}
              color="#000"
            />
            <Text style={styles.typeBannerText}>
              {party.type === 'pre' ? 'Previa' : 'After'}
            </Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>{party.title}</Text>

            {party.event && (
              <TouchableOpacity
                style={styles.eventBadge}
                onPress={() => router.push(`/event/${party.event.id}`)}
              >
                <Ionicons name="musical-notes" size={16} color="#fff" />
                <Text style={styles.eventBadgeText}>
                  {party.event.title}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#888" />
              </TouchableOpacity>
            )}

            <View style={styles.hostSection}>
              <TouchableOpacity
                style={styles.hostCard}
                onPress={() => handleOpenInstagram(party.host.instagram_handle)}
                disabled={!party.host.instagram_handle}
              >
                {party.host.avatar_url ? (
                  <Image source={{ uri: party.host.avatar_url }} style={styles.hostAvatar} />
                ) : (
                  <View style={styles.hostAvatarPlaceholder}>
                    <Text style={styles.hostAvatarText}>
                      {party.host.full_name?.charAt(0) || '?'}
                    </Text>
                  </View>
                )}
                <View style={styles.hostInfo}>
                  <Text style={styles.hostLabel}>Anfitrión</Text>
                  <Text style={styles.hostName}>
                    {party.host.full_name}
                  </Text>
                  {party.host.instagram_handle && (
                    <View style={styles.hostInstagram}>
                      <Ionicons name="logo-instagram" size={14} color="#888" />
                      <Text style={styles.hostInstagramText}>
                        @{party.host.instagram_handle}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.detailsSection}>
              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={20} color="#fff" />
                  <View>
                    <Text style={styles.detailLabel}>Fecha</Text>
                    <Text style={styles.detailValue}>
                      {formatFullDate(party.start_time)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={20} color="#fff" />
                  <View>
                    <Text style={styles.detailLabel}>Hora</Text>
                    <Text style={styles.detailValue}>
                      {formatTime(party.start_time)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailDivider} />

                <TouchableOpacity
                  style={styles.detailRow}
                  onPress={() => party.latitude && party.longitude && setShowMap(true)}
                  disabled={!party.latitude || !party.longitude}
                >
                  <Ionicons name="location-outline" size={20} color="#fff" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Ubicacion</Text>
                    <Text style={styles.detailValue}>
                      {party.address || 'Sin direccion'}
                    </Text>
                  </View>
                  {party.latitude && party.longitude && (
                    <Ionicons name="map-outline" size={18} color="#888" />
                  )}
                </TouchableOpacity>

                <View style={styles.detailDivider} />

                <View style={styles.detailRow}>
                  <Ionicons name="people-outline" size={20} color="#fff" />
                  <View>
                    <Text style={styles.detailLabel}>Rango de Edad</Text>
                    <Text style={styles.detailValue}>
                      {party.min_age} - {party.max_age} años
                    </Text>
                  </View>
                </View>

                {party.max_capacity && (
                  <>
                    <View style={styles.detailDivider} />
                    <View style={styles.detailRow}>
                      <Ionicons name="person-outline" size={20} color="#fff" />
                      <View>
                        <Text style={styles.detailLabel}>Capacidad</Text>
                        <Text style={styles.detailValue}>
                          {attendees.length} / {party.max_capacity}
                        </Text>
                      </View>
                    </View>
                  </>
                )}
              </View>
            </View>

            {party.description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>Descripción</Text>
                <Text style={styles.description}>
                  {party.description}
                </Text>
              </View>
            )}

            <View style={styles.ratioSection}>
              <GenderRatio maleCount={maleCount} femaleCount={femaleCount} />
            </View>

            <View style={styles.attendeesSection}>
              <Text style={styles.sectionTitle}>
                Asistentes ({attendees.length})
              </Text>
              <AttendeeList attendees={attendees} />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {isHost ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteParty}
            >
              <Ionicons name="trash-outline" size={20} color="#ff3b30" />
              <Text style={styles.deleteButtonText}>Eliminar Fiesta</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                isJoined ? styles.leaveButton : styles.joinButton,
                { opacity: joiningLeaving ? 0.7 : 1 },
              ]}
              onPress={handleJoinLeave}
              disabled={joiningLeaving}
            >
              {joiningLeaving ? (
                <ActivityIndicator color={isJoined ? '#fff' : '#000'} />
              ) : (
                <Text style={isJoined ? styles.leaveButtonText : styles.joinButtonText}>
                  {isJoined ? 'Salir de la Fiesta' : 'Unirse a la Fiesta'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {party.latitude && party.longitude && (
          <MapViewModal
            visible={showMap}
            onClose={() => setShowMap(false)}
            latitude={party.latitude}
            longitude={party.longitude}
            address={party.address || undefined}
            title={party.title}
          />
        )}

        <Modal
          visible={showReportModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowReportModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reportar Fiesta</Text>
                <TouchableOpacity onPress={() => setShowReportModal(false)}>
                  <Ionicons name="close" size={24} color="#888" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>Selecciona un motivo</Text>

              <View style={styles.reasonsList}>
                {reportReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason.value}
                    style={[
                      styles.reasonButton,
                      reportReason === reason.value && styles.reasonButtonActive,
                    ]}
                    onPress={() => setReportReason(reason.value)}
                  >
                    <Text
                      style={[
                        styles.reasonButtonText,
                        reportReason === reason.value && styles.reasonButtonTextActive,
                      ]}
                    >
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalSubtitle}>Descripcion (opcional)</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Describe el problema..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
                value={reportDescription}
                onChangeText={setReportDescription}
              />

              <TouchableOpacity
                style={[
                  styles.submitReportButton,
                  (!reportReason || submittingReport) && styles.submitReportButtonDisabled,
                ]}
                onPress={handleReport}
                disabled={!reportReason || submittingReport}
              >
                {submittingReport ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.submitReportButtonText}>Enviar Reporte</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </>
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
  errorText: {
    fontSize: 16,
    color: '#888',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  typeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  typeBannerText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    color: '#fff',
    letterSpacing: 0.5,
  },
  eventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#111',
  },
  eventBadgeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  hostSection: {
    marginBottom: 20,
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 14,
    backgroundColor: '#111',
  },
  hostAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#fff',
  },
  hostAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  hostAvatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  hostInfo: {
    flex: 1,
  },
  hostLabel: {
    fontSize: 12,
    marginBottom: 2,
    color: '#888',
  },
  hostName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  hostInstagram: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  hostInstagramText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
  },
  detailsSection: {
    marginBottom: 20,
  },
  detailCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#111',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  detailDivider: {
    height: 1,
    marginVertical: 14,
    marginLeft: 34,
    backgroundColor: '#262626',
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
    color: '#888',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  descriptionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
    color: '#fff',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#888',
  },
  ratioSection: {
    marginBottom: 20,
  },
  attendeesSection: {},
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    backgroundColor: '#0a0a0a',
    borderTopColor: '#262626',
  },
  joinButton: {
    backgroundColor: '#fff',
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '700',
  },
  leaveButton: {
    backgroundColor: '#000',
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  leaveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a0a0a',
    borderRadius: 30,
    height: 56,
    borderWidth: 1,
    borderColor: '#ff3b3020',
  },
  deleteButtonText: {
    color: '#ff3b30',
    fontSize: 17,
    fontWeight: '700',
  },
  reportHeaderButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  reasonsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  reasonButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#262626',
  },
  reasonButtonActive: {
    backgroundColor: '#fff',
  },
  reasonButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  reasonButtonTextActive: {
    color: '#000',
  },
  descriptionInput: {
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitReportButton: {
    backgroundColor: '#fff',
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitReportButtonDisabled: {
    opacity: 0.5,
  },
  submitReportButtonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '700',
  },
});
