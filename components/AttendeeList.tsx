import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '@/types/database';
import { getInstagramUrl } from '@/lib/utils';

interface AttendeeListProps {
  attendees: User[];
  maxDisplay?: number;
}

export function AttendeeList({ attendees, maxDisplay = 20 }: AttendeeListProps) {
  const displayedAttendees = useMemo(() => attendees.slice(0, maxDisplay), [attendees, maxDisplay]);
  const remainingCount = attendees.length - maxDisplay;

  const openInstagram = (handle: string | null | undefined) => {
    const url = getInstagramUrl(handle);
    if (!url) return;

    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  if (attendees.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Nadie se ha unido aún. ¡Sé el primero!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {displayedAttendees.map((attendee) => (
          <TouchableOpacity
            key={attendee.id}
            style={styles.attendeeCard}
            onPress={() => attendee.instagram_handle && openInstagram(attendee.instagram_handle)}
            disabled={!attendee.instagram_handle}
          >
            {attendee.avatar_url ? (
              <Image source={{ uri: attendee.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {attendee.full_name?.charAt(0) || '?'}
                </Text>
              </View>
            )}
            <Text style={styles.name} numberOfLines={1}>
              {attendee.full_name || 'Anónimo'}
            </Text>
            {attendee.instagram_handle && (
              <View style={styles.instagramRow}>
                <Ionicons name="logo-instagram" size={12} color="#888" />
                <Text style={styles.instagram} numberOfLines={1}>
                  @{attendee.instagram_handle}
                </Text>
              </View>
            )}
            <View style={styles.metaRow}>
              <View style={[
                styles.genderBadge,
                attendee.gender === 'female' ? styles.femaleBadge : styles.maleBadge
              ]}>
                <Ionicons
                  name={attendee.gender === 'female' ? 'female' : 'male'}
                  size={10}
                  color={attendee.gender === 'female' ? '#fff' : '#000'}
                />
              </View>
              {attendee.age && (
                <Text style={styles.age}>
                  {attendee.age} años
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {remainingCount > 0 && (
        <Text style={styles.moreText}>
          +{remainingCount} más asistiendo
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  attendeeCard: {
    width: '31%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#111',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#333',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
    color: '#fff',
  },
  instagramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  instagram: {
    fontSize: 10,
    fontWeight: '500',
    color: '#888',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  genderBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  femaleBadge: {
    backgroundColor: '#333',
  },
  maleBadge: {
    backgroundColor: '#fff',
  },
  age: {
    fontSize: 11,
    fontWeight: '500',
    color: '#888',
  },
  moreText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
  },
});
