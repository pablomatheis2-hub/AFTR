import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Party, User, Event } from '@/types/database';
import { PartyCard } from '@/components/PartyCard';
import { useAuth } from '@/context/AuthContext';

type PartyWithDetails = Party & {
  host: User;
  event: Event;
  attendee_count: number;
  male_count: number;
  female_count: number;
};

type FilterType = 'all' | 'pre' | 'after';

export default function ExploreScreen() {
  const [parties, setParties] = useState<PartyWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const { user } = useAuth();

  const fetchParties = async () => {
    try {
      let query = supabase
        .from('parties')
        .select(`
          *,
          host:users!host_id(*),
          event:events!event_id(*)
        `)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (filter !== 'all') {
        query = query.eq('type', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching parties:', error);
        return;
      }

      // Filter out parties with inactive events
      const activeParties = (data || []).filter((party: any) => 
        party.event && party.event.is_active
      );

      const partiesWithCounts = await Promise.all(
        activeParties.map(async (party: any) => {
          const { data: attendees } = await supabase
            .from('party_attendees')
            .select('user:users!user_id(gender)')
            .eq('party_id', party.id);

          const maleCount = attendees?.filter((a: any) => a.user?.gender === 'male').length || 0;
          const femaleCount = attendees?.filter((a: any) => a.user?.gender === 'female').length || 0;

          return {
            ...party,
            attendee_count: attendees?.length || 0,
            male_count: maleCount,
            female_count: femaleCount,
          };
        })
      );

      setParties(partiesWithCounts);
    } catch (err) {
      console.error('Error in fetchParties:', err);
    }
  };

  useEffect(() => {
    fetchParties().finally(() => setLoading(false));
  }, [filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchParties();
    setRefreshing(false);
  }, [filter]);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Explorar Fiestas</Text>
      <Text style={styles.subtitle}>
        Encuentra previas y afters cerca de ti
      </Text>

      <View style={styles.filterContainer}>
        {(['all', 'pre', 'after'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Todas' : f === 'pre' ? 'Previas' : 'Afters'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search" size={48} color="#888" />
      <Text style={styles.emptyText}>No hay fiestas disponibles</Text>
      <Text style={styles.emptySubtext}>¡Sé el primero en organizar una!</Text>
      <TouchableOpacity
        style={styles.hostButton}
        onPress={() => router.push('/(tabs)/create')}
      >
        <Ionicons name="add" size={20} color="#000" />
        <Text style={styles.hostButtonText}>Crear Fiesta</Text>
      </TouchableOpacity>
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
        data={parties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PartyCard
            party={item}
            onPress={() => router.push(`/party/${item.id}`)}
            showEvent
            eventTitle={item.event?.title}
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
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
    marginBottom: 16,
    color: '#888',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#111',
  },
  filterButtonActive: {
    backgroundColor: '#fff',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  filterTextActive: {
    color: '#000',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: '#888',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
    color: '#888',
  },
  hostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  hostButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
