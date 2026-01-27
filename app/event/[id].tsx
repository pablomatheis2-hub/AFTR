import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Event, Party, User } from '@/types/database';
import { PartyCard } from '@/components/PartyCard';
import { formatFullDate, formatTime, calculateGenderCounts } from '@/lib/utils';

type PartyWithHost = Party & { host: User; attendee_count: number; male_count: number; female_count: number };
type TabType = 'pre' | 'after';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [parties, setParties] = useState<PartyWithHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('pre');

  useEffect(() => {
    if (id) {
      fetchEventData();
    }
  }, [id]);

  const fetchEventData = async () => {
    try {
      setError(null);
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventError) throw eventError;

    setEvent(eventData);

    const { data: partiesData, error: partiesError } = await supabase
      .from('parties')
      .select('*, host:users!host_id(*)')
      .eq('event_id', id)
      .order('start_time', { ascending: true });

    if (!partiesError && partiesData && partiesData.length > 0) {
      // Fetch all attendees for all parties in ONE query
      const partyIds = partiesData.map((p: any) => p.id);
      const { data: allAttendees } = await supabase
        .from('party_attendees')
        .select('party_id, user:users!user_id(gender)')
        .in('party_id', partyIds);

      // Group attendees by party
      const attendeesByParty = new Map<string, Array<{ user?: { gender?: string } | null }>>();
      for (const attendee of allAttendees || []) {
        const list = attendeesByParty.get(attendee.party_id) || [];
        list.push(attendee);
        attendeesByParty.set(attendee.party_id, list);
      }

      const partiesWithCounts = partiesData.map((party: any) => {
        const attendees = attendeesByParty.get(party.id) || [];
        const counts = calculateGenderCounts(attendees);
        return {
          ...party,
          attendee_count: counts.total,
          male_count: counts.male,
          female_count: counts.female,
        };
      });

      setParties(partiesWithCounts);
    }
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('No se pudo cargar el evento');
    } finally {
      setLoading(false);
    }
  };

  const filteredParties = parties.filter((p) => p.type === activeTab);
  const prePartiesCount = parties.filter((p) => p.type === 'pre').length;
  const afterPartiesCount = parties.filter((p) => p.type === 'after').length;
  
  // Check if event is more than 24 hours in the past
  const isEventTooOld = event ? new Date(event.event_date) < new Date(Date.now() - 24 * 60 * 60 * 1000) : false;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#888" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchEventData}>
          <Text style={styles.retryText}>Toca para reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="calendar-outline" size={48} color="#888" />
        <Text style={styles.errorText}>Evento no encontrado</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerBackTitle: 'Atrás',
          headerTintColor: '#fff',
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          {event.image_url ? (
            <Image source={{ uri: event.image_url }} style={styles.headerImage} />
          ) : (
            <View style={styles.headerPlaceholder}>
              <Ionicons name="musical-notes" size={64} color="#333" />
            </View>
          )}
          <View style={styles.headerOverlay} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{event.title}</Text>

          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={18} color="#fff" />
              <Text style={styles.metaText}>{formatFullDate(event.event_date)}</Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={18} color="#fff" />
              <Text style={styles.metaText}>{formatTime(event.event_date)}</Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={18} color="#fff" />
              <Text style={styles.metaText}>{event.venue}</Text>
            </View>
          </View>

          {event.description && (
            <Text style={styles.description}>{event.description}</Text>
          )}

          <View style={styles.partiesSection}>
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'pre' && styles.tabActive]}
                onPress={() => setActiveTab('pre')}
              >
                <Ionicons
                  name="sunny"
                  size={18}
                  color={activeTab === 'pre' ? '#000' : '#888'}
                />
                <Text
                  style={[styles.tabText, activeTab === 'pre' && styles.tabTextActive]}
                >
                  Previas ({prePartiesCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === 'after' && styles.tabActive]}
                onPress={() => setActiveTab('after')}
              >
                <Ionicons
                  name="moon"
                  size={18}
                  color={activeTab === 'after' ? '#000' : '#888'}
                />
                <Text
                  style={[styles.tabText, activeTab === 'after' && styles.tabTextActive]}
                >
                  Afters ({afterPartiesCount})
                </Text>
              </TouchableOpacity>
            </View>

            {filteredParties.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name={activeTab === 'pre' ? 'sunny-outline' : 'moon-outline'}
                  size={48}
                  color="#888"
                />
                <Text style={styles.emptyTitle}>
                  No hay {activeTab === 'pre' ? 'previas' : 'afters'} aún
                </Text>
                {isEventTooOld ? (
                  <Text style={styles.emptySubtitle}>
                    Este evento ya pasó hace más de 24 horas
                  </Text>
                ) : (
                  <>
                    <Text style={styles.emptySubtitle}>
                      ¡Sé el primero en organizar una!
                    </Text>
                    <TouchableOpacity
                      style={styles.createButton}
                      onPress={() =>
                        router.push({
                          pathname: '/(tabs)/create',
                          params: { eventId: event.id, partyType: activeTab },
                        })
                      }
                    >
                      <Ionicons name="add" size={20} color="#000" />
                      <Text style={styles.createButtonText}>
                        Crear {activeTab === 'pre' ? 'Previa' : 'After'}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ) : (
              <View style={styles.partiesList}>
                {filteredParties.map((party) => (
                  <PartyCard
                    key={party.id}
                    party={party}
                    onPress={() => router.push(`/party/${party.id}`)}
                  />
                ))}

                {!isEventTooOld && (
                  <TouchableOpacity
                    style={styles.hostPartyButton}
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/create',
                        params: { eventId: event.id, partyType: activeTab },
                      })
                    }
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#000" />
                    <Text style={styles.hostPartyButtonText}>
                      Organizar {activeTab === 'pre' ? 'Previa' : 'After'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
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
    marginTop: 16,
    textAlign: 'center',
  },
  retryText: {
    fontSize: 14,
    color: '#fff',
    marginTop: 12,
    textDecorationLine: 'underline',
  },
  header: {
    height: 280,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(transparent, #000)',
  },
  content: {
    padding: 20,
    paddingTop: 0,
    marginTop: -40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 16,
    color: '#fff',
    letterSpacing: 0.5,
  },
  metaContainer: {
    gap: 10,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaText: {
    fontSize: 15,
    color: '#fff',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 24,
    color: '#888',
  },
  partiesSection: {},
  tabsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#111',
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
  },
  tabTextActive: {
    color: '#000',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 4,
    color: '#fff',
  },
  emptySubtitle: {
    fontSize: 14,
    marginBottom: 20,
    color: '#888',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  createButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  partiesList: {
    gap: 0,
    paddingBottom: 100,
  },
  hostPartyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 12,
    backgroundColor: '#fff',
  },
  hostPartyButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
