import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NativeDateTimePicker from '@react-native-community/datetimepicker';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
}

export function DateTimePicker({ value, onChange, minimumDate }: DateTimePickerProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(value);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      onChange(newDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(value);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      onChange(newDate);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar-outline" size={18} color="#fff" />
        <Text style={styles.dateText}>{formatDate(value)}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowTimePicker(true)}
      >
        <Ionicons name="time-outline" size={18} color="#fff" />
        <Text style={styles.dateText}>{formatTime(value)}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <NativeDateTimePicker
          value={value}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
          minimumDate={minimumDate}
        />
      )}

      {showTimePicker && (
        <NativeDateTimePicker
          value={value}
          mode="time"
          display="spinner"
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#111',
  },
  dateText: {
    fontSize: 15,
    color: '#fff',
  },
});
