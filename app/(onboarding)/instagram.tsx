import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function InstagramScreen() {
  const params = useLocalSearchParams<{
    fullName: string;
    age: string;
    gender: string;
    radius: string;
    latitude: string;
    longitude: string;
  }>();
  const [instagram, setInstagram] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { updateProfile } = useAuth();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string, userId: string): Promise<string | null> => {
    try {
      const file = new File(uri);
      const base64 = await file.base64();
      
      const filePath = `${userId}/avatar.jpg`;
      const contentType = 'image/jpeg';

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64), {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }
  };

  const handleComplete = async () => {
    setLoading(true);

    const profileData: any = {
      full_name: params.fullName,
      age: parseInt(params.age),
      gender: params.gender as 'male' | 'female' | 'other',
      radius_km: parseInt(params.radius) || 25,
      onboarding_complete: true,
    };

    if (params.latitude && params.longitude) {
      profileData.latitude = parseFloat(params.latitude);
      profileData.longitude = parseFloat(params.longitude);
    }

    if (instagram) {
      profileData.instagram_handle = instagram.replace('@', '');
    }

    // Upload avatar if selected
    if (avatar) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const avatarUrl = await uploadAvatar(avatar, session.user.id);
        if (avatarUrl) {
          profileData.avatar_url = avatarUrl;
        }
      }
    }

    const { error } = await updateProfile(profileData);
    setLoading(false);

    if (error) {
      Alert.alert('Error', 'No pudimos guardar tu perfil. Por favor intenta de nuevo.');
      return;
    }

    router.replace('/(onboarding)/complete');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.progress}>
          <View style={[styles.progressDot, styles.progressComplete]} />
          <View style={[styles.progressLine, styles.progressLineComplete]} />
          <View style={[styles.progressDot, styles.progressComplete]} />
          <View style={[styles.progressLine, styles.progressLineComplete]} />
          <View style={[styles.progressDot, styles.progressActive]} />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>¡Casi listo!</Text>
          <Text style={styles.subtitle}>
            Agrega tu Instagram para que otros puedan conectar contigo
          </Text>
        </View>

        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatarButton} onPress={pickImage}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="camera" size={32} color="#888" />
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Ionicons name="add" size={16} color="#000" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarText}>Agregar foto (opcional)</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Usuario de Instagram</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputPrefix}>@</Text>
            <TextInput
              style={styles.input}
              placeholder="tu_usuario"
              placeholderTextColor="#555"
              value={instagram}
              onChangeText={(text) => setInstagram(text.replace(/[^a-zA-Z0-9._]/g, ''))}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <Text style={styles.inputHint}>Esto será visible para otros asistentes</Text>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleComplete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>Completar Registro</Text>
            )}
          </TouchableOpacity>

          {!instagram && (
            <TouchableOpacity onPress={handleComplete} disabled={loading}>
              <Text style={styles.skipText}>Omitir por ahora</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#333',
  },
  progressActive: {
    backgroundColor: '#fff',
  },
  progressComplete: {
    backgroundColor: '#30d158',
  },
  progressLine: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
    backgroundColor: '#333',
  },
  progressLineComplete: {
    backgroundColor: '#30d158',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    lineHeight: 24,
    color: '#888',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarButton: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
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
    borderWidth: 1,
    borderColor: '#262626',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  avatarText: {
    fontSize: 14,
    color: '#888',
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#fff',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 20,
  },
  inputPrefix: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 4,
    color: '#888',
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 16,
    color: '#fff',
  },
  inputHint: {
    fontSize: 14,
    marginTop: 8,
    color: '#888',
  },
  footer: {
    gap: 16,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
});
