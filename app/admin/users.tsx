import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/database';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (search.trim()) {
      const query = search.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.full_name?.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            u.instagram_handle?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [search, users]);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data);
      setFilteredUsers(data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('users')
      .update({ is_admin: !currentStatus })
      .eq('id', userId);

    if (!error) {
      setUsers(users.map((u) => (u.id === userId ? { ...u, is_admin: !currentStatus } : u)));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar usuarios..."
          placeholderTextColor="#666"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#555" />
            <Text style={styles.emptyText}>
              {search ? 'No se encontraron usuarios' : 'No hay usuarios'}
            </Text>
          </View>
        ) : (
          <View style={styles.usersList}>
            {filteredUsers.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userHeader}>
                  {user.avatar_url ? (
                    <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {user.full_name?.charAt(0) || user.email.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.full_name || 'Sin nombre'}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    {user.instagram_handle && (
                      <Text style={styles.userInstagram}>@{user.instagram_handle}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.userMeta}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Edad</Text>
                    <Text style={styles.metaValue}>{user.age || '-'}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Genero</Text>
                    <Text style={styles.metaValue}>
                      {user.gender === 'female' ? 'Mujer' : user.gender === 'male' ? 'Hombre' : '-'}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Registro</Text>
                    <Text style={styles.metaValue}>{formatDate(user.created_at)}</Text>
                  </View>
                </View>

                <View style={styles.userActions}>
                  <View
                    style={[
                      styles.statusBadge,
                      user.onboarding_complete ? styles.statusComplete : styles.statusPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        user.onboarding_complete ? styles.statusTextComplete : styles.statusTextPending,
                      ]}
                    >
                      {user.onboarding_complete ? 'Completo' : 'Pendiente'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.adminButton, user.is_admin && styles.adminButtonActive]}
                    onPress={() => toggleAdmin(user.id, user.is_admin)}
                  >
                    <Ionicons
                      name={user.is_admin ? 'shield-checkmark' : 'shield-outline'}
                      size={16}
                      color={user.is_admin ? '#a855f7' : '#888'}
                    />
                    <Text style={[styles.adminButtonText, user.is_admin && styles.adminButtonTextActive]}>
                      {user.is_admin ? 'Admin' : 'Usuario'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    margin: 20,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#262626',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
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
  usersList: {
    gap: 12,
  },
  userCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#a855f720',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#a855f7',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  userEmail: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  userInstagram: {
    fontSize: 13,
    color: '#ec4899',
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#262626',
    gap: 16,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 2,
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#262626',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusComplete: {
    backgroundColor: '#22c55e20',
  },
  statusPending: {
    backgroundColor: '#f59e0b20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextComplete: {
    color: '#22c55e',
  },
  statusTextPending: {
    color: '#f59e0b',
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
  },
  adminButtonActive: {
    backgroundColor: '#a855f720',
  },
  adminButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  adminButtonTextActive: {
    color: '#a855f7',
  },
});
