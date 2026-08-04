import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';

export default function SearchFilterBar({ placeholder, search, onSearchChange, options, filter, onFilterChange }) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === filter) || options[0];

  const handleSelect = (value) => {
    onFilterChange(value);
    setOpen(false);
  };

  return (
    <View style={[styles.wrap, open && styles.wrapOpen]}>
      <View style={styles.row}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color={theme.colors.onSurfaceVariant} />
          <TextInput
            style={styles.input}
            value={search}
            onChangeText={onSearchChange}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search ? (
            <TouchableOpacity onPress={() => onSearchChange('')} hitSlop={8}>
              <MaterialIcons name="close" size={18} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          ) : null}
        </View>

        {options && options.length > 0 && (
          <View style={styles.filterWrap}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setOpen((o) => !o)}
              activeOpacity={0.7}
            >
              <View style={[styles.dot, { backgroundColor: (current && current.dotColor) || theme.colors.primary }]} />
              <Text style={styles.filterLabel} numberOfLines={1}>
                {(current && current.label) || 'Tous'}
              </Text>
              <MaterialIcons name="expand-more" size={20} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
            {open && (
              <>
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)} />
                <View style={styles.menu}>
                  {options.map((opt) => (
                    <TouchableOpacity
                      key={String(opt.value)}
                      style={[styles.menuItem, opt.value === filter && styles.menuItemActive]}
                      onPress={() => handleSelect(opt.value)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.dot, { backgroundColor: opt.dotColor || theme.colors.primary }]} />
                      <Text style={[styles.menuText, opt.value === filter && styles.menuTextActive]} numberOfLines={1}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  wrapOpen: {
    zIndex: 1000,
    elevation: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    ...theme.shadow.card,
  },
  input: {
    flex: 1,
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.body,
    color: theme.colors.onSurface,
    padding: 0,
  },
  filterWrap: {
    position: 'relative',
    zIndex: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 48,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.borderRadius.md,
    maxWidth: 150,
    zIndex: 2,
    ...theme.shadow.card,
  },
  overlay: {
    position: 'absolute',
    top: -600,
    left: -600,
    right: -600,
    bottom: -600,
    zIndex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterLabel: {
    fontFamily: theme.fonts.bodySemibold,
    fontSize: theme.fontSize.sm,
    color: theme.colors.onSurface,
    flexShrink: 1,
  },
  menu: {
    position: 'absolute',
    top: 52,
    right: 0,
    minWidth: 190,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(197,197,211,0.35)',
    paddingVertical: 6,
    zIndex: 3,
    elevation: 12,
    ...theme.shadow.editorial,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 11,
  },
  menuItemActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  menuText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: theme.fontSize.sm,
    color: theme.colors.onSurface,
    flex: 1,
  },
  menuTextActive: {
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.primary,
  },
});
