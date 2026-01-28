import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Gender = 'male' | 'female' | 'other';

export default function ProfileScreen() {
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);

  const isValid = fullName.length >= 2 && age && parseInt(age) >= 18 && gender;

  const handleContinue = () => {
    router.push({
      pathname: '/(onboarding)/location',
      params: { fullName, age, gender },
    });
  };

  const genderLabels: Record<Gender, string> = {
    male: 'Hombre',
    female: 'Mujer',
    other: 'Otro',
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.progress}>
            <View style={[styles.progressDot, styles.progressActive]} />
            <View style={styles.progressLine} />
            <View style={styles.progressDot} />
            <View style={styles.progressLine} />
            <View style={styles.progressDot} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Cuéntanos sobre ti</Text>
            <Text style={styles.subtitle}>
              Esto ayuda a otros a saber quién viene a la fiesta
            </Text>
          </View>

          <View style={styles.form}>
            <View>
              <Text style={styles.label}>Nombre Completo</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu nombre"
                placeholderTextColor="#555"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <View>
              <Text style={styles.label}>Edad</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu edad"
                placeholderTextColor="#555"
                value={age}
                onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={2}
              />
              {age && parseInt(age) < 18 && (
                <Text style={styles.errorText}>Debes tener 18 años o más</Text>
              )}
            </View>

            <View>
              <Text style={styles.label}>Género</Text>
              <View style={styles.genderContainer}>
                {(['male', 'female', 'other'] as Gender[]).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderOption,
                      gender === g && styles.genderOptionActive,
                    ]}
                    onPress={() => setGender(g)}
                  >
                    <Ionicons
                      name={g === 'male' ? 'male' : g === 'female' ? 'female' : 'person'}
                      size={24}
                      color={gender === g ? '#000' : '#888'}
                    />
                    <Text
                      style={[
                        styles.genderText,
                        gender === g && styles.genderTextActive,
                      ]}
                    >
                      {genderLabels[g]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, { opacity: isValid ? 1 : 0.5 }]}
            onPress={handleContinue}
            disabled={!isValid}
          >
            <Text style={styles.buttonText}>Continuar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
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
  progressLine: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
    backgroundColor: '#333',
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
  form: {
    flex: 1,
    gap: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#fff',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    color: '#fff',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginTop: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#262626',
  },
  genderOptionActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  genderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  genderTextActive: {
    color: '#000',
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 30,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
});
