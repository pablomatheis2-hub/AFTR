import { Stack, router } from 'expo-router';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#000' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Admin',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <View style={styles.headerTitle}>
              <Ionicons name="shield-checkmark" size={20} color="#a855f7" />
              <Text style={styles.headerTitleText}>Panel Admin</Text>
            </View>
          ),
        }}
      />
      <Stack.Screen
        name="events"
        options={{ title: 'Gestionar Eventos' }}
      />
      <Stack.Screen
        name="users"
        options={{ title: 'Gestionar Usuarios' }}
      />
      <Stack.Screen
        name="parties"
        options={{ title: 'Gestionar Fiestas' }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  backButton: {
    marginRight: 8,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
