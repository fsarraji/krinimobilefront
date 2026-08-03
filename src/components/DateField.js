import { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import WebDatePicker from './WebDatePicker';
import theme from '../theme';

const pad = (n) => String(n).padStart(2, '0');

const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const parseValue = (value) => {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(y, m - 1, d, 12, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
};

export default function DateField({ label, value, onChange, minimumDate, maximumDate }) {
  const [show, setShow] = useState(false);
  const base = parseValue(value) || new Date();

  if (Platform.OS === 'web') {
    return (
      <View>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity style={styles.dateField} onPress={() => setShow(true)} activeOpacity={0.7}>
          <Text style={[styles.dateValue, !value && styles.datePlaceholder]}>
            {value || 'Sélectionner'}
          </Text>
          <MaterialIcons name="calendar-today" size={18} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
        {show && (
          <WebDatePicker
            value={base}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onSelect={(d) => onChange(fmtDate(d))}
            onClose={() => setShow(false)}
          />
        )}
      </View>
    );
  }

  const onPickerChange = (event, selected) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (event.type === 'set' && selected) onChange(fmtDate(selected));
      return;
    }
    if (event.type === 'set' && selected) onChange(fmtDate(selected));
    if (event.type === 'dismissed') setShow(false);
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.dateField} onPress={() => setShow(true)} activeOpacity={0.7}>
        <Text style={[styles.dateValue, !value && styles.datePlaceholder]}>
          {value || 'Sélectionner'}
        </Text>
        <MaterialIcons name="calendar-today" size={18} color={theme.colors.onSurfaceVariant} />
      </TouchableOpacity>
      {show && (
        <View>
          <DateTimePicker
            value={base}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={onPickerChange}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.doneButton} onPress={() => setShow(false)}>
              <Text style={styles.doneButtonText}>OK</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 6,
    marginTop: theme.spacing.sm,
  },
  dateField: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateValue: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.md, color: theme.colors.onSurface },
  datePlaceholder: { color: theme.colors.onSurfaceVariant },
  doneButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginTop: theme.spacing.sm,
  },
  doneButtonText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.primary },
});
