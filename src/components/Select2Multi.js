import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';

export default function Select2Multi({
  label,
  icon,
  value = [],
  options = [],
  placeholder = 'Sélectionner...',
  onChange,
  disabled = false,
  optionKey = (o) => String(o.value),
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedSet = new Set(value.map((v) => String(v)));

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => String(o.label).toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (opt) => {
    const key = String(opt.value);
    const next = selectedSet.has(key) ? value.filter((v) => String(v) !== key) : [...value, opt.value];
    onChange(next);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.field, disabled && styles.fieldDisabled]}
        onPress={() => !disabled && setOpen(true)}
        activeOpacity={0.8}
      >
        {icon && <MaterialIcons name={icon} size={18} color={theme.colors.outline} />}
        <View style={styles.fieldTextWrap}>
          {value.length === 0 ? (
            <Text style={styles.fieldValue} numberOfLines={1}>{placeholder}</Text>
          ) : (
            <View style={styles.selectedChips}>
              {value.slice(0, 3).map((v) => {
                const o = options.find((x) => String(x.value) === String(v));
                return o ? <View key={String(v)} style={styles.selectedChip}><Text style={styles.selectedChipText} numberOfLines={1}>{o.label}</Text></View> : null;
              })}
              {value.length > 3 && (
                <Text style={styles.moreText}>+{value.length - 3}</Text>
              )}
            </View>
          )}
        </View>
        <MaterialIcons name="expand-more" size={22} color={theme.colors.onSurfaceVariant} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.backdropOverlay} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle} numberOfLines={1}>{label || placeholder}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8}>
                <MaterialIcons name="close" size={24} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={20} color={theme.colors.onSurfaceVariant} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Rechercher..."
                placeholderTextColor={theme.colors.onSurfaceVariant}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {query ? (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                  <MaterialIcons name="close" size={18} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              ) : null}
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(o) => optionKey(o)}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <MaterialIcons name="search-off" size={28} color={theme.colors.outline} />
                  <Text style={styles.emptyText}>Aucun résultat</Text>
                </View>
              }
              renderItem={({ item }) => {
                const active = selectedSet.has(String(item.value));
                return (
                  <TouchableOpacity style={[styles.option, active && styles.optionActive]} onPress={() => toggle(item)} activeOpacity={0.7}>
                    <MaterialIcons
                      name={active ? 'check-box' : 'check-box-outline-blank'}
                      size={22}
                      color={active ? theme.colors.primary : theme.colors.outline}
                    />
                    <Text style={[styles.optionText, active && styles.optionTextActive]} numberOfLines={2}>{item.label}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  fieldDisabled: { opacity: 0.5 },
  fieldTextWrap: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  fieldValue: { fontFamily: theme.fonts.bodyMedium, fontSize: theme.fontSize.md, color: theme.colors.onSurfaceVariant },
  selectedChips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  selectedChip: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  selectedChipText: { color: theme.colors.primary, fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm },
  moreText: { color: theme.colors.onSurfaceVariant, fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  backdropOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,20,25,0.45)' },
  sheet: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingBottom: theme.spacing.lg,
    maxHeight: '65%',
    elevation: 16,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.outlineVariant,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  sheetTitle: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.lg, color: theme.colors.onSurface, flex: 1 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.borderRadius.md,
  },
  searchInput: { flex: 1, fontSize: theme.fontSize.md, fontFamily: theme.fonts.body, color: theme.colors.onSurface, padding: 0 },
  list: { marginTop: theme.spacing.sm },
  listContent: { paddingHorizontal: theme.spacing.sm, paddingBottom: theme.spacing.md },
  option: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.md, paddingVertical: 13, borderRadius: theme.borderRadius.md, marginBottom: 2 },
  optionActive: { backgroundColor: theme.colors.primaryLight },
  optionText: { flex: 1, fontFamily: theme.fonts.bodyMedium, fontSize: theme.fontSize.md, color: theme.colors.onSurface },
  optionTextActive: { fontFamily: theme.fonts.bodyBold, color: theme.colors.primary },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontFamily: theme.fonts.bodyMedium, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
});