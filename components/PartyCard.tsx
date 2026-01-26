import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Party, User } from '@/types/database';

interface PartyCardProps {
  party: Party & {
    host?: User;
    attendee_count?: number;
    male_count?: number;
    female_count?: number;
  };
  onPress: () => void;
  showEvent?: boolean;
  eventTitle?: string;
}

export function PartyCard({ party, onPress, showEvent, eventTitle }: PartyCardProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const attendeeCount = party.attendee_count || 0;
  const maleCount = party.male_count || 0;
  const femaleCount = party.female_count || 0;
  const genderRatio = attendeeCount > 0 ? (femaleCount / attendeeCount) * 100 : 50;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={[styles.typeBadge, party.type === 'pre' ? styles.typePre : styles.typeAfter]}>
          <Text style={[styles.typeText, party.type === 'pre' ? styles.typeTextPre : styles.typeTextAfter]}>
            {party.type === 'pre' ? 'Previa' : 'After'}
          </Text>
        </View>

        {party.max_capacity && (
          <View style={styles.capacityBadge}>
            <Ionicons name="people-outline" size={12} color="#888" />
            <Text style={styles.capacityText}>
              {attendeeCount}/{party.max_capacity}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {party.title}
      </Text>

      {showEvent && eventTitle && (
        <View style={styles.eventRow}>
          <Ionicons name="musical-notes" size={14} color="#fff" />
          <Text style={styles.eventText} numberOfLines={1}>
            {eventTitle}
          </Text>
        </View>
      )}

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={14} color="#888" />
          <Text style={styles.detailText}>
            {formatDate(party.start_time)} a las {formatTime(party.start_time)}
          </Text>
        </View>

        {party.address && (
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={14} color="#888" />
            <Text style={styles.detailText} numberOfLines={1}>
              {party.address}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.stats}>
          <View style={styles.ageBadge}>
            <Text style={styles.ageText}>
              {party.min_age}-{party.max_age}
            </Text>
          </View>

          {attendeeCount > 0 && (
            <View style={styles.genderRatioContainer}>
              <View style={styles.genderBar}>
                <View style={[styles.genderFemale, { width: `${genderRatio}%` }]} />
              </View>
              <Text style={styles.genderText}>
                {femaleCount}M / {maleCount}H
              </Text>
            </View>
          )}
        </View>

        {party.host && (
          <View style={styles.hostInfo}>
            {party.host.avatar_url ? (
              <Image source={{ uri: party.host.avatar_url }} style={styles.hostAvatar} />
            ) : (
              <View style={styles.hostAvatarPlaceholder}>
                <Text style={styles.hostAvatarText}>
                  {party.host.full_name?.charAt(0) || '?'}
                </Text>
              </View>
            )}
            <Text style={styles.hostName} numberOfLines={1}>
              {party.host.full_name}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#262626',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typePre: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  typeAfter: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  typeTextPre: {
    color: '#fff',
  },
  typeTextAfter: {
    color: '#fff',
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#111',
  },
  capacityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#fff',
    letterSpacing: 0.5,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  eventText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    color: '#fff',
  },
  details: {
    gap: 6,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    flex: 1,
    color: '#888',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#262626',
  },
  ageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  genderRatioContainer: {
    alignItems: 'center',
    gap: 4,
  },
  genderBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  genderFemale: {
    height: '100%',
    backgroundColor: '#fff',
  },
  genderText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#888',
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 120,
  },
  hostAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#fff',
  },
  hostAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  hostAvatarText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  hostName: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    color: '#888',
  },
});
