import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import theme from '../theme';

const levels = ['0/8', '1/8', '2/8', '3/8', '4/8', '5/8', '6/8', '7/8', '8/8'];

export default function FuelGaugeSelector({ value = '4/8', onChange }) {
  return (
    <View style={styles.container}>
      <View style={styles.gauge}>
        {levels.map((level) => {
          const num = parseInt(level.split('/')[0]);
          const activeNum = parseInt(value.split('/')[0]);
          const isActive = activeNum >= num;
          const isLow = num <= 1;
          return (
            <TouchableOpacity
              key={level}
              style={[
                styles.segment,
                isActive && (isLow ? styles.segmentLow : styles.segmentActive),
                !isActive && styles.segmentInactive,
              ]}
              onPress={() => onChange(level)}
            >
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{num}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  gauge: { flexDirection: 'row', gap: 3 },
  segment: { width: 32, height: 36, borderRadius: theme.borderRadius.sm, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#dadce0' },
  segmentActive: { backgroundColor: theme.colors.onSurface, borderColor: theme.colors.onSurface },
  segmentLow: { backgroundColor: theme.colors.error, borderColor: theme.colors.error },
  segmentInactive: { backgroundColor: '#f5f5f5' },
  segmentText: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.xs, color: theme.colors.onSurfaceVariant, fontWeight: '500' },
  segmentTextActive: { color: '#ffffff' },
  value: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.lg, color: theme.colors.onSurface, minWidth: 36 },
});
