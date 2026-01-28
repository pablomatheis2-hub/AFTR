import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '@/types/database';
import { formatDateParts } from '@/lib/utils';

interface EventCardProps {
  event: Event & { pre_party_count?: number; after_party_count?: number };
  onPress: () => void;
}

export const EventCard = memo(function EventCard({ event, onPress }: EventCardProps) {
  const dateInfo = formatDateParts(event.event_date);
  const totalParties = (event.pre_party_count || 0) + (event.after_party_count || 0);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {event.image_url ? (
          <Image source={{ uri: event.image_url }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="musical-notes" size={40} color="#333" />
          </View>
        )}
        <View style={styles.dateOverlay}>
          <Text style={styles.dateDay}>{dateInfo.day}</Text>
          <Text style={styles.dateNumber}>{dateInfo.date}</Text>
          <Text style={styles.dateMonth}>{dateInfo.month}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {event.title}
        </Text>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={14} color="#888" />
            <Text style={styles.detailText} numberOfLines={1}>
              {event.venue}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={14} color="#888" />
            <Text style={styles.detailText}>
              {dateInfo.time}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.partyCount}>
            <View style={styles.partyBadge}>
              <Ionicons name="people" size={14} color="#fff" />
              <Text style={styles.partyBadgeText}>
                {totalParties} {totalParties === 1 ? 'fiesta' : 'fiestas'}
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#555" />
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
    marginBottom: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#262626',
  },
  imageContainer: {
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  dateOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    minWidth: 50,
    borderWidth: 1,
    borderColor: '#262626',
  },
  dateDay: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
  },
  dateNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 26,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#fff',
    letterSpacing: 0.5,
  },
  details: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#888',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partyCount: {
    flexDirection: 'row',
    gap: 8,
  },
  partyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#262626',
  },
  partyBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});
