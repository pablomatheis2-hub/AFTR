import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Party, Event } from '@/types/database';
import { BottomSheet } from '@/components/BottomSheet';

type PartyWithEvent = Party & { event: Event };

const RADIUS_OPTIONS = [5, 10, 15, 25, 50, 75, 100];

export default function ProfileScreen() {
  const { user, signOut, updateProfile, refreshUser } = useAuth();
  const [hostedParties, setHostedParties] = useState<PartyWithEvent[]>([]);
  const [joinedParties, setJoinedParties] = useState<PartyWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);
  
  // Edit Profile state
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editAvatarUri, setEditAvatarUri] = useState<string | null>(null);
  const [editAvatarBase64, setEditAvatarBase64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Search Radius state
  const [showRadiusSheet, setShowRadiusSheet] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(25);
  
  // Notifications state
  const [showNotificationsSheet, setShowNotificationsSheet] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchUserParties();
      setSelectedRadius(user.radius_km || 25);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotificationPreferences();
  }, []);

  // Refresh user data when screen is focused to get latest admin/ban status
  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [])
  );

  const loadNotificationPreferences = async () => {
    try {
      const value = await AsyncStorage.getItem('notifications_enabled');
      if (value !== null) {
        setNotificationsEnabled(value === 'true');
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const saveNotificationPreferences = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('notifications_enabled', enabled.toString());
      setNotificationsEnabled(enabled);
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  };

  const fetchUserParties = async () => {
    if (!user?.id) return;

    const { data: hosted } = await supabase
      .from('parties')
      .select('*, event:events!event_id(*)')
      .eq('host_id', user.id)
      .order('start_time', { ascending: false });

    const { data: joined } = await supabase
      .from('party_attendees')
      .select('party:parties!party_id(*, event:events!event_id(*))')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false });

    setHostedParties((hosted as PartyWithEvent[]) || []);
    setJoinedParties(
      joined?.map((j: any) => j.party).filter(Boolean) as PartyWithEvent[] || []
    );
    setLoading(false);
  };

  const openEditProfile = () => {
    setEditName(user?.full_name || '');
    setEditAge(user?.age?.toString() || '');
    setEditInstagram(user?.instagram_handle || '');
    setEditAvatarUri(null);
    setEditAvatarBase64(null);
    setShowEditProfile(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galeria para cambiar la foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setEditAvatarUri(result.assets[0].uri);
      setEditAvatarBase64(result.assets[0].base64 || null);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!editAvatarBase64 || !editAvatarUri || !user?.id) return null;
    
    try {
      const fileExt = editAvatarUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const contentType = fileExt === 'png' ? 'image/png' : 'image/jpeg';

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, decode(editAvatarBase64), {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Error', 'No se pudo subir la imagen.');
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Avatar upload error:', error);
      return null;
    }
  };

  const saveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);
    
    const age = editAge ? parseInt(editAge, 10) : null;
    if (editAge && (isNaN(age!) || age! < 18 || age! > 100)) {
      setSaving(false);
      return;
    }

    let avatarUrl = user.avatar_url;
    if (editAvatarBase64) {
      const newAvatarUrl = await uploadAvatar();
      if (newAvatarUrl) {
        avatarUrl = newAvatarUrl;
      }
    }

    await updateProfile({
      full_name: editName || null,
      age: age,
      instagram_handle: editInstagram || null,
      avatar_url: avatarUrl,
    });
    
    setSaving(false);
    setShowEditProfile(false);
  };

  const saveRadius = async (radius: number) => {
    if (!user?.id) return;
    setSelectedRadius(radius);
    await updateProfile({ radius_km: radius });
    setShowRadiusSheet(false);
  };

  const handleSignOut = () => {
    setShowLogoutSheet(true);
  };

  const confirmSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderPartyItem = (party: PartyWithEvent) => (
    <TouchableOpacity
      key={party.id}
      style={styles.partyItem}
      onPress={() => router.push(`/party/${party.id}`)}
    >
      <View
        style={styles.partyType}
      >
        <Text style={styles.partyTypeText}>
          {party.type === 'pre' ? 'PREVIA' : 'AFTER'}
        </Text>
      </View>
      <View style={styles.partyInfo}>
        <Text style={styles.partyTitle} numberOfLines={1}>
          {party.title}
        </Text>
        <Text style={styles.partyEvent} numberOfLines={1}>
          {party.event?.title} - {formatDate(party.start_time)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#555" />
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerContainer}>
        <View style={styles.profileSection}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{user.full_name || 'Anónimo'}</Text>
          {user.instagram_handle && (
            <View style={styles.instagramRow}>
              <Ionicons name="logo-instagram" size={16} color="#888" />
              <Text style={styles.instagram}>@{user.instagram_handle}</Text>
            </View>
          )}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{user.age || '-'}</Text>
              <Text style={styles.statLabel}>Edad</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{hostedParties.length}</Text>
              <Text style={styles.statLabel}>Creadas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{joinedParties.length}</Text>
              <Text style={styles.statLabel}>Unidas</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ajustes</Text>

          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingItem} onPress={openEditProfile}>
              <View style={styles.settingIcon}>
                <Ionicons name="person-outline" size={20} color="#fff" />
              </View>
              <Text style={styles.settingText}>Editar Perfil</Text>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingItem} onPress={() => setShowRadiusSheet(true)}>
              <View style={styles.settingIcon}>
                <Ionicons name="location-outline" size={20} color="#fff" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingText}>Radio de Búsqueda</Text>
                <Text style={styles.settingValue}>
                  {selectedRadius} km
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingItem} onPress={() => setShowNotificationsSheet(true)}>
              <View style={styles.settingIcon}>
                <Ionicons name="notifications-outline" size={20} color="#fff" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingText}>Notificaciones</Text>
                <Text style={styles.settingValue}>
                  {notificationsEnabled ? 'Activadas' : 'Desactivadas'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>

            {user.is_admin && (
              <>
                <View style={styles.settingDivider} />
                <TouchableOpacity 
                  style={styles.settingItem} 
                  onPress={() => router.push('/admin')}
                >
                  <View style={[styles.settingIcon, styles.adminIcon]}>
                    <Ionicons name="shield-checkmark" size={20} color="#a855f7" />
                  </View>
                  <Text style={[styles.settingText, styles.adminText]}>Panel de Admin</Text>
                  <Ionicons name="chevron-forward" size={18} color="#a855f7" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {hostedParties.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Tus Fiestas ({hostedParties.length})
            </Text>
            <View style={styles.partiesList}>
              {hostedParties.slice(0, 3).map(renderPartyItem)}
              {hostedParties.length > 3 && (
                <TouchableOpacity style={styles.showMore}>
                  <Text style={styles.showMoreText}>
                    Ver todas ({hostedParties.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {joinedParties.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Fiestas Unidas ({joinedParties.length})
            </Text>
            <View style={styles.partiesList}>
              {joinedParties.slice(0, 3).map(renderPartyItem)}
              {joinedParties.length > 3 && (
                <TouchableOpacity style={styles.showMore}>
                  <Text style={styles.showMoreText}>
                    Ver todas ({joinedParties.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color="#ff3b30" />
            <Text style={styles.signOutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>AFTR v1.0.0</Text>
      </View>

      <BottomSheet
        visible={showLogoutSheet}
        onClose={() => setShowLogoutSheet(false)}
        title="Cerrar Sesión"
        message="¿Estás seguro de que quieres cerrar sesión?"
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={confirmSignOut}
        destructive
      />

      <BottomSheet
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Editar Perfil</Text>
          
          <TouchableOpacity style={styles.avatarPicker} onPress={pickImage}>
            {editAvatarUri ? (
              <Image source={{ uri: editAvatarUri }} style={styles.avatarPickerImage} />
            ) : user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatarPickerImage} />
            ) : (
              <View style={styles.avatarPickerPlaceholder}>
                <Text style={styles.avatarPickerText}>
                  {user?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
                </Text>
              </View>
            )}
            <View style={styles.avatarPickerOverlay}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Toca para cambiar foto</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Tu nombre"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Edad</Text>
            <TextInput
              style={styles.input}
              value={editAge}
              onChangeText={setEditAge}
              placeholder="18-100"
              placeholderTextColor="#666"
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Instagram</Text>
            <TextInput
              style={styles.input}
              value={editInstagram}
              onChangeText={setEditInstagram}
              placeholder="username"
              placeholderTextColor="#666"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.sheetButtons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={saveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.primaryButtonText}>Guardar</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setShowEditProfile(false)}
            >
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>

      <BottomSheet
        visible={showRadiusSheet}
        onClose={() => setShowRadiusSheet(false)}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Radio de Búsqueda</Text>
          <Text style={styles.sheetSubtitle}>
            Solo verás eventos y fiestas dentro de este radio
          </Text>
          
          <View style={styles.radiusOptions}>
            {RADIUS_OPTIONS.map((radius) => (
              <TouchableOpacity
                key={radius}
                style={[
                  styles.radiusOption,
                  selectedRadius === radius && styles.radiusOptionActive,
                ]}
                onPress={() => saveRadius(radius)}
              >
                <Text
                  style={[
                    styles.radiusOptionText,
                    selectedRadius === radius && styles.radiusOptionTextActive,
                  ]}
                >
                  {radius} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </BottomSheet>

      <BottomSheet
        visible={showNotificationsSheet}
        onClose={() => setShowNotificationsSheet(false)}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Notificaciones</Text>
          <Text style={styles.sheetSubtitle}>
            Recibe alertas de nuevas fiestas y eventos
          </Text>
          
          <View style={styles.notificationRow}>
            <View style={styles.notificationInfo}>
              <Ionicons name="notifications" size={24} color="#fff" />
              <Text style={styles.notificationText}>Notificaciones Push</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={saveNotificationPreferences}
              trackColor={{ false: '#333', true: '#fff' }}
              thumbColor={notificationsEnabled ? '#000' : '#888'}
            />
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setShowNotificationsSheet(false)}
          >
            <Text style={styles.secondaryButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </ScrollView>
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
  headerContainer: {
    paddingTop: 20,
    paddingBottom: 32,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginTop: 16,
    letterSpacing: 1,
  },
  instagramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  instagram: {
    fontSize: 15,
    color: '#888',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: '#111',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#262626',
  },
  stat: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#262626',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#fff',
    letterSpacing: 0.5,
  },
  settingsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#262626',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  settingContent: {
    flex: 1,
  },
  settingText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    color: '#fff',
  },
  adminIcon: {
    backgroundColor: '#a855f720',
  },
  adminText: {
    color: '#a855f7',
  },
  settingValue: {
    fontSize: 13,
    marginTop: 2,
    color: '#888',
  },
  settingDivider: {
    height: 1,
    marginLeft: 70,
    backgroundColor: '#262626',
  },
  partiesList: {
    gap: 10,
  },
  partyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 12,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#262626',
  },
  partyType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
  },
  partyTypeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  partyInfo: {
    flex: 1,
  },
  partyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
    color: '#fff',
  },
  partyEvent: {
    fontSize: 13,
    color: '#888',
  },
  showMore: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#1a0a0a',
    borderWidth: 1,
    borderColor: '#ff3b3020',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff3b30',
  },
  version: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 16,
    color: '#555',
  },
  sheetContent: {
    paddingHorizontal: 24,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  avatarPicker: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  avatarPickerImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarPickerPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarPickerText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  avatarPickerOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  avatarHint: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#262626',
  },
  sheetButtons: {
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: '#fff',
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  radiusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 24,
  },
  radiusOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#262626',
  },
  radiusOptionActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  radiusOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  radiusOptionTextActive: {
    color: '#000',
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#262626',
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
