import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GenderRatioProps {
  maleCount: number;
  femaleCount: number;
}

export function GenderRatio({ maleCount, femaleCount }: GenderRatioProps) {
  const total = maleCount + femaleCount;
  const femalePercentage = total > 0 ? (femaleCount / total) * 100 : 50;
  const malePercentage = total > 0 ? (maleCount / total) * 100 : 50;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Proporción de Género</Text>
        <Text style={styles.total}>{total} asistiendo</Text>
      </View>

      <View style={styles.barContainer}>
        <View style={styles.bar}>
          <View style={[styles.femaleBar, { width: `${femalePercentage}%` }]} />
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, styles.femaleIcon]}>
            <Ionicons name="female" size={16} color="#fff" />
          </View>
          <View>
            <Text style={styles.statValue}>{femaleCount}</Text>
            <Text style={styles.statLabel}>
              {femalePercentage.toFixed(0)}%
            </Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statIcon, styles.maleIcon]}>
            <Ionicons name="male" size={16} color="#000" />
          </View>
          <View>
            <Text style={styles.statValue}>{maleCount}</Text>
            <Text style={styles.statLabel}>
              {malePercentage.toFixed(0)}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#111',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  total: {
    fontSize: 13,
    color: '#888',
  },
  barContainer: {
    marginBottom: 16,
  },
  bar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#262626',
  },
  femaleBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  femaleIcon: {
    backgroundColor: '#333',
  },
  maleIcon: {
    backgroundColor: '#fff',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
});
