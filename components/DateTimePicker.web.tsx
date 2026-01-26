import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
}

export function DateTimePicker({ value, onChange, minimumDate }: DateTimePickerProps) {
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatTimeForInput = (date: Date) => {
    return date.toTimeString().slice(0, 5);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(value);
    const [year, month, day] = e.target.value.split('-').map(Number);
    newDate.setFullYear(year);
    newDate.setMonth(month - 1);
    newDate.setDate(day);
    onChange(newDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(value);
    const [hours, minutes] = e.target.value.split(':').map(Number);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    onChange(newDate);
  };

  return (
    <View style={styles.container}>
      <View style={styles.dateButton}>
        <Ionicons name="calendar-outline" size={18} color="#fff" />
        <input
          type="date"
          value={formatDateForInput(value)}
          onChange={handleDateChange}
          min={minimumDate ? formatDateForInput(minimumDate) : undefined}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: 15,
            outline: 'none',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        />
      </View>

      <View style={styles.dateButton}>
        <Ionicons name="time-outline" size={18} color="#fff" />
        <input
          type="time"
          value={formatTimeForInput(value)}
          onChange={handleTimeChange}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: 15,
            outline: 'none',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        />
      </View>
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
});
