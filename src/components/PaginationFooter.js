import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';

export default function PaginationFooter({ page, totalPages, total, loading, onPrev, onNext }) {
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }
  if (totalPages == null || totalPages <= 1) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, !canPrev && styles.buttonDisabled]}
        onPress={onPrev}
        disabled={!canPrev}
      >
        <MaterialIcons name="chevron-left" size={20} color={canPrev ? theme.colors.primary : theme.colors.outlineVariant} />
        <Text style={[styles.buttonText, !canPrev && styles.buttonTextDisabled]}>Précédent</Text>
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.pageText}>Page {page} sur {totalPages}</Text>
        {total != null && <Text style={styles.totalText}>{total} résultat{(total > 1 || total === 0) ? 's' : ''}</Text>}
      </View>

      <TouchableOpacity
        style={[styles.button, !canNext && styles.buttonDisabled]}
        onPress={onNext}
        disabled={!canNext}
      >
        <Text style={[styles.buttonText, !canNext && styles.buttonTextDisabled]}>Suivant</Text>
        <MaterialIcons name="chevron-right" size={20} color={canNext ? theme.colors.primary : theme.colors.outlineVariant} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  buttonDisabled: { backgroundColor: 'transparent', borderColor: theme.colors.outlineVariant },
  buttonText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.primary },
  buttonTextDisabled: { color: theme.colors.outlineVariant },
  info: { alignItems: 'center' },
  pageText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.onSurface },
  totalText: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.xs, color: theme.colors.onSurfaceVariant, marginTop: 2 },
});
