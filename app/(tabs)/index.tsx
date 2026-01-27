import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Event } from '@/types/database';
import { EventCard } from '@/components/EventCard';

type EventWithCounts = Event & {
  pre_party_count: number;
  after_party_count: number;
};

export default function EventsScreen() {
  const [events, setEvents] = useState<EventWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setError(null);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Fetch events and parties in parallel (2 queries instead of 2n+1)
      const [eventsResult, partiesResult] = await Promise.all([
        supabase
          .from('events')
          .select('*')
          .eq('is_active', true)
          .gte('event_date', twentyFourHoursAgo)
          .order('event_date', { ascending: true }),
        supabase
          .from('parties')
          .select('event_id, type'),
      ]);

      if (eventsResult.error) throw eventsResult.error;
      if (partiesResult.error) throw partiesResult.error;

      // Count parties per event locally
      const partyCounts = new Map<string, { pre: number; after: number }>();
      for (const party of partiesResult.data || []) {
        const counts = partyCounts.get(party.event_id) || { pre: 0, after: 0 };
        if (party.type === 'pre') counts.pre++;
        else if (party.type === 'after') counts.after++;
        partyCounts.set(party.event_id, counts);
      }

      const eventsWithCounts = (eventsResult.data || []).map((event) => {
        const counts = partyCounts.get(event.id) || { pre: 0, after: 0 };
        return {
          ...event,
          pre_party_count: counts.pre,
          after_party_count: counts.after,
        };
      });

      setEvents(eventsWithCounts);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('No se pudieron cargar los eventos');
    }
  };

  useEffect(() => {
    fetchEvents().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  }, []);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>AFTR</Text>
      <Text style={styles.headerSubtitle}>Próximos Eventos</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No hay eventos próximos</Text>
      <Text style={styles.emptySubtext}>
        Vuelve más tarde para ver nuevos eventos
      </Text>
    </View>
  );

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
        <Text style={styles.errorRetry} onPress={onRefresh}>
          Toca para reintentar
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => router.push(`/event/${item.id}`)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      />
    </View>
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
  header: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 6,
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
    color: '#888',
    letterSpacing: 1,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#888',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    color: '#555',
  },
  errorText: {
    fontSize: 16,
    color: '#888',
    marginTop: 16,
    textAlign: 'center',
  },
  errorRetry: {
    fontSize: 14,
    color: '#fff',
    marginTop: 12,
    textDecorationLine: 'underline',
  },
});
