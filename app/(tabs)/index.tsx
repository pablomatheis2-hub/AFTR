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

  const fetchEvents = async () => {
    const { data: eventsData, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return;
    }

    const eventsWithCounts = await Promise.all(
      (eventsData || []).map(async (event) => {
        const { count: preCount } = await supabase
          .from('parties')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('type', 'pre');

        const { count: afterCount } = await supabase
          .from('parties')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('type', 'after');

        return {
          ...event,
          pre_party_count: preCount || 0,
          after_party_count: afterCount || 0,
        };
      })
    );

    setEvents(eventsWithCounts);
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
});
