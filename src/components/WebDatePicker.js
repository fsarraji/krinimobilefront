import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';

const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

export default function WebDatePicker({ value, includeTime, minimumDate, maximumDate, onSelect, onClose }) {
  const base = value || new Date();
  const [view, setView] = useState({ year: base.getFullYear(), month: base.getMonth() });
  const [selected, setSelected] = useState(base);
  const [time, setTime] = useState({ h: base.getHours(), m: base.getMinutes() });

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const firstDow = new Date(view.year, view.month, 1).getDay();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const moveMonth = (delta) => {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const isDisabled = (day) => {
    const dt = new Date(view.year, view.month, day, 12);
    if (minimumDate && dt < startOfDay(minimumDate)) return true;
    if (maximumDate && dt > endOfDay(maximumDate)) return true;
    return false;
  };

  const isSelected = (day) =>
    selected.getFullYear() === view.year && selected.getMonth() === view.month && selected.getDate() === day;

  const isToday = (day) => {
    const now = new Date();
    return now.getFullYear() === view.year && now.getMonth() === view.month && now.getDate() === day;
  };

  const setTimePart = (key, raw) => {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) {
      setTime((t) => ({ ...t, [key]: 0 }));
      return;
    }
    const max = key === 'h' ? 23 : 59;
    setTime((t) => ({ ...t, [key]: Math.min(Math.max(n, 0), max) }));
  };

  const handleOk = () => {
    const final = new Date(view.year, view.month, selected.getDate(), time.h, time.m, 0, 0);
    if (includeTime) onSelect(final);
    else onSelect(new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), 12));
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.navBtn} onPress={() => moveMonth(-1)} activeOpacity={0.6}>
              <MaterialIcons name="chevron-left" size={22} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {MONTHS[view.month]} {view.year}
            </Text>
            <TouchableOpacity style={styles.navBtn} onPress={() => moveMonth(1)} activeOpacity={0.6}>
              <MaterialIcons name="chevron-right" size={22} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={styles.weekCell}>{w}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, i) =>
              day === null ? (
                <View key={`blank-${i}`} style={styles.dayCell} />
              ) : (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCell,
                    isDisabled(day) && styles.dayDisabled,
                    isSelected(day) && styles.daySelected,
                  ]}
                  disabled={isDisabled(day)}
                  onPress={() => setSelected(new Date(view.year, view.month, day, 12))}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected(day) && styles.dayTextSelected,
                      isToday(day) && !isSelected(day) && styles.dayTextToday,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          {includeTime && (
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Heure</Text>
              <View style={styles.timeInputWrap}>
                <TextInput
                  style={styles.timeInput}
                  value={String(time.h).padStart(2, '0')}
                  onChangeText={(v) => setTimePart('h', v)}
                  maxLength={2}
                  selectTextOnFocus
                />
                <Text style={styles.timeColon}>:</Text>
                <TextInput
                  style={styles.timeInput}
                  value={String(time.m).padStart(2, '0')}
                  onChangeText={(v) => setTimePart('m', v)}
                  maxLength={2}
                  selectTextOnFocus
                />
              </View>
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.okBtn} onPress={handleOk} activeOpacity={0.8}>
              <Text style={styles.okText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadow.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  headerTitle: {
    fontFamily: theme.fonts.headlineBold,
    fontSize: theme.fontSize.md,
    color: theme.colors.onSurface,
    textTransform: 'capitalize',
  },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekCell: {
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.fonts.label,
    fontSize: theme.fontSize.xs,
    color: theme.colors.onSurfaceVariant,
    paddingVertical: 6,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSize.sm,
    color: theme.colors.onSurface,
  },
  dayDisabled: { opacity: 0.3 },
  daySelected: { backgroundColor: theme.colors.primary },
  dayTextSelected: { color: theme.colors.onPrimary, fontFamily: theme.fonts.bodySemibold },
  dayTextToday: { color: theme.colors.primary, fontFamily: theme.fonts.bodySemibold },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
  },
  timeLabel: {
    fontFamily: theme.fonts.label,
    fontSize: theme.fontSize.sm,
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeInputWrap: { flexDirection: 'row', alignItems: 'center' },
  timeInput: {
    width: 48,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 8,
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.bodySemibold,
    color: theme.colors.onSurface,
  },
  timeColon: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onSurfaceVariant, marginHorizontal: 6 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: theme.spacing.md },
  cancelBtn: { paddingHorizontal: 18, paddingVertical: 10 },
  cancelText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onSurfaceVariant },
  okBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  okText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onPrimary },
});
