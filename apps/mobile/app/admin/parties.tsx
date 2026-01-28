import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Party, Event, User } from '@/types/database';

type PartyWithDetails = Party & {
  host: User;
  event: Event;
  attendee_count: number;
};

export default function AdminParties() {
  const [parties, setParties] = useState<PartyWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    const { data, error } = await supabase
      .from('parties')
      .select(`
        *,
        host:users!host_id(*),
        event:events!event_id(*),
        attendees:party_attendees(count)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const partiesWithCount = data.map((p: any) => ({
        ...p,
        attendee_count: p.attendees?.[0]?.count || 0,
      }));
      setParties(partiesWithCount);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchParties();
  };

  const deleteParty = (party: PartyWithDetails) => {
    Alert.alert(
      'Eliminar Fiesta',
      `¿Estás seguro de eliminar "${party.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('parties').delete().eq('id', party.id);
            if (!error) {
              setParties(parties.filter((p) => p.id !== party.id));
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
      }
    >
      {parties.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="sparkles-outline" size={48} color="#555" />
          <Text style={styles.emptyText}>No hay fiestas</Text>
        </View>
      ) : (
        <View style={styles.partiesList}>
          {parties.map((party) => (
            <View key={party.id} style={styles.partyCard}>
              <View style={styles.partyHeader}>
                <View
                  style={[
                    styles.typeBadge,
                    party.type === 'pre' ? styles.typePre : styles.typeAfter,
                  ]}
                >
                  <Text style={styles.typeText}>
                    {party.type === 'pre' ? 'PREVIA' : 'AFTER'}
                  </Text>
                </View>
                <Text style={styles.partyTitle}>{party.title}</Text>
              </View>

              <View style={styles.partyInfo}>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={16} color="#888" />
                  <Text style={styles.infoText}>{party.event?.title || 'Sin evento'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color="#888" />
                  <Text style={styles.infoText}>{formatDate(party.start_time)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={16} color="#888" />
                  <Text style={styles.infoText}>
                    {party.host?.full_name || party.host?.email || 'Host desconocido'}
                  </Text>
                </View>
                {party.address && (
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color="#888" />
                    <Text style={styles.infoText} numberOfLines={1}>
                      {party.address}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.partyStats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{party.attendee_count}</Text>
                  <Text style={styles.statLabel}>Asistentes</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>
                    {party.max_capacity || '-'}
                  </Text>
                  <Text style={styles.statLabel}>Capacidad</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>
                    {party.min_age}-{party.max_age}
                  </Text>
                  <Text style={styles.statLabel}>Edad</Text>
                </View>
              </View>

              <View style={styles.partyActions}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteParty(party)}
                >
                  <Ionicons name="trash-outline" size={18} color="#ff4444" />
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
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
  partiesList: {
    gap: 12,
  },
  partyCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  partyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typePre: {
    backgroundColor: '#8b5cf620',
  },
  typeAfter: {
    backgroundColor: '#f59e0b20',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  partyTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  partyInfo: {
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#888',
  },
  partyStats: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  partyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ff444420',
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ff4444',
  },
});
