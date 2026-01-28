import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

type Stats = {
  totalUsers: number;
  totalEvents: number;
  totalParties: number;
  activeEvents: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [usersRes, eventsRes, partiesRes, activeEventsRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('parties').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    setStats({
      totalUsers: usersRes.count || 0,
      totalEvents: eventsRes.count || 0,
      totalParties: partiesRes.count || 0,
      activeEvents: activeEventsRes.count || 0,
    });
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const menuItems = [
    {
      title: 'Eventos',
      subtitle: 'Crear y gestionar eventos',
      icon: 'calendar',
      route: '/admin/events',
      color: '#8b5cf6',
    },
    {
      title: 'Usuarios',
      subtitle: 'Ver y gestionar usuarios',
      icon: 'people',
      route: '/admin/users',
      color: '#ec4899',
    },
    {
      title: 'Fiestas',
      subtitle: 'Moderar fiestas creadas',
      icon: 'sparkles',
      route: '/admin/parties',
      color: '#f59e0b',
    },
  ];

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
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="people" size={24} color="#8b5cf6" />
          <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
          <Text style={styles.statLabel}>Usuarios</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={24} color="#ec4899" />
          <Text style={styles.statValue}>{stats?.totalEvents || 0}</Text>
          <Text style={styles.statLabel}>Eventos</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="sparkles" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>{stats?.totalParties || 0}</Text>
          <Text style={styles.statLabel}>Fiestas</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
          <Text style={styles.statValue}>{stats?.activeEvents || 0}</Text>
          <Text style={styles.statLabel}>Activos</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Gestionar</Text>

      <View style={styles.menuList}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#555" />
          </TouchableOpacity>
        ))}
      </View>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262626',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  menuList: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 14,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
});
