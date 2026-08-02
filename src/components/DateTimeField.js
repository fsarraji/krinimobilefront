import { useState, createElement } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import theme from '../theme';

const pad = (n) => String(n).padStart(2, '0');

const fmtDateTime = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

const parseValue = (value) => {
  if (!value) return null;
  const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, y, m, d, h, min] = match;
  const date = new Date(y, m - 1, d, h, min);
  return Number.isNaN(date.getTime()) ? null : date;
};

export default function DateTimeField({ label, value, onChange, minimumDate }) {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState('date');
  const [pendingDate, setPendingDate] = useState(null);
  const base = parseValue(value) || new Date();

  if (Platform.OS === 'web') {
    return (
      <View>
        <Text style={styles.label}>{label}</Text>
        {createElement('input', {
          type: 'datetime-local',
          value: value ? value.replace(' ', 'T') : '',
          onChange: (e) => {
            const raw = e.target.value;
            onChange(raw ? raw.replace('T', ' ') : '');
          },
          style: styles.webInput,
        })}
      </View>
    );
  }

  const openPicker = () => {
    setPendingDate(base);
    setMode('date');
    setShow(true);
  };

  const onPickerChange = (event, selected) => {
    if (Platform.OS === 'android') {
      if (event.type !== 'set' || !selected) {
        setShow(false);
        return;
      }
      if (mode === 'date') {
        setPendingDate(selected);
        setMode('time');
      } else {
        const finalDate = new Date(pendingDate || base);
        finalDate.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        onChange(fmtDateTime(finalDate));
        setShow(false);
        setMode('date');
      }
      return;
    }
    if (event.type === 'set' && selected) onChange(fmtDateTime(selected));
    if (event.type === 'dismissed') setShow(false);
  };

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.dateField} onPress={openPicker} activeOpacity={0.7}>
        <Text style={[styles.dateValue, !value && styles.datePlaceholder]}>
          {value || 'Sélectionner'}
        </Text>
        <MaterialIcons name="calendar-today" size={18} color={theme.colors.onSurfaceVariant} />
      </TouchableOpacity>
      {show && (
        <View>
          <DateTimePicker
            value={base}
            mode={Platform.OS === 'ios' ? 'datetime' : mode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={minimumDate}
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
  input: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    fontSize: theme.fontSize.md,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.sm,
  },
  webInput: {
    width: '100%',
    border: '1px solid #dadce0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.surfaceContainerLowest,
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
