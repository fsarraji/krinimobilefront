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

export default function Select2({
  label,
  icon,
  value,
  options = [],
  placeholder = 'Sélectionner...',
  onSelect,
  searchable = true,
  disabled = false,
  fieldStyle,
  optionKey = (o) => String(o.value),
  renderOption,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => {
      const hay = [o.label, o.searchText, o.subtitle].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [options, query, searchable]);

  const handlePick = (opt) => {
    if (onSelect) onSelect(opt.value, opt);
    setOpen(false);
  };

  const renderItem = ({ item }) => {
    const active = String(item.value) === String(value);
    const content = renderOption ? renderOption(item, active) : (
      <View style={styles.optionRow}>
        <MaterialIcons
          name={active ? 'check-circle' : 'radio-button-unchecked'}
          size={20}
          color={active ? theme.colors.primary : theme.colors.outline}
        />
        <Text style={[styles.optionText, active && styles.optionTextActive]} numberOfLines={2}>
          {item.label}
        </Text>
      </View>
    );
    return (
      <TouchableOpacity style={[styles.option, active && styles.optionActive]} onPress={() => handlePick(item)} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={[styles.wrap]}>
        {label && (
          <Text style={styles.label}>{label}</Text>
        )}
        <TouchableOpacity
          style={[styles.field, disabled && styles.fieldDisabled, fieldStyle]}
          onPress={() => !disabled && setOpen(true)}
          activeOpacity={0.8}
        >
          {icon && <MaterialIcons name={icon} size={18} color={theme.colors.outline} />}
          <Text style={[styles.fieldValue, !selected && styles.fieldPlaceholder]} numberOfLines={1}>
            {selected ? selected.label : placeholder}
          </Text>
          <MaterialIcons name="expand-more" size={22} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

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

            {searchable && (
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
            )}

            <FlatList
              data={filtered}
              keyExtractor={(o) => optionKey(o)}
              renderItem={renderItem}
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
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: theme.spacing.md },
  label: {
    fontFamily: theme.fonts.label,
    fontSize: theme.fontSize.sm,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    height: 52,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  fieldDisabled: { opacity: 0.5 },
  fieldValue: {
    flex: 1,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: theme.fontSize.md,
    color: theme.colors.onSurface,
  },
  fieldPlaceholder: { color: theme.colors.onSurfaceVariant },
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
  sheetTitle: {
    fontFamily: theme.fonts.headlineBold,
    fontSize: theme.fontSize.lg,
    color: theme.colors.onSurface,
    flex: 1,
  },
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
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.body,
    color: theme.colors.onSurface,
    padding: 0,
  },
  list: { marginTop: theme.spacing.sm },
  listContent: { paddingHorizontal: theme.spacing.sm, paddingBottom: theme.spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 13,
    borderRadius: theme.borderRadius.md,
    marginBottom: 2,
  },
  optionActive: { backgroundColor: theme.colors.primaryLight },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flex: 1 },
  optionText: {
    flex: 1,
    fontFamily: theme.fonts.bodyMedium,
    fontSize: theme.fontSize.md,
    color: theme.colors.onSurface,
  },
  optionTextActive: { fontFamily: theme.fonts.bodyBold, color: theme.colors.primary },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.onSurfaceVariant,
  },
});