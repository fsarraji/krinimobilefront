import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';
import LoadingSpinner from '../components/LoadingSpinner';
import { usePaginatedList } from '../hooks/usePaginatedList';

const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function CalendarScreen({ navigation }) {
  const { items: contracts, loading, refreshing, refresh } = usePaginatedList('contracts/', { pageSize: 500 });
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const getContractsForDay = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return contracts.filter(c => {
      const start = c.date_sortie?.slice(0, 10);
      const end = c.date_retour_prevue?.slice(0, 10);
      return start <= dateStr && end >= dateStr;
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.navButton}><Text style={styles.navButtonText}>◀</Text></TouchableOpacity>
        <Text style={styles.monthTitle}>{monthNames[currentMonth]} {currentYear}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navButton}><Text style={styles.navButtonText}>▶</Text></TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <View style={styles.weekDays}>
          {dayLabels.map(d => (
            <View key={d} style={styles.weekDayCell}><Text style={styles.weekDay}>{d}</Text></View>
          ))}
        </View>

        <View style={styles.calendarBody}>
          {Array.from({ length: firstDay }, (_, i) => <View key={`empty-${i}`} style={styles.dayCell} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dayContracts = getContractsForDay(day);
            const today = new Date();
            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const dotColors = dayContracts.map(c => c.statut === 'EN_COURS' ? theme.colors.primary : '#e6a800');
            return (
              <TouchableOpacity key={day} style={[styles.dayCell, isToday && styles.todayCell]}>
                <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>{day}</Text>
                <View style={styles.dotsRow}>
                  {dotColors.slice(0, 3).map((color, ci) => (
                    <View key={ci} style={[styles.contractDot, { backgroundColor: color }]} />
                  ))}
                  {dotColors.length > 3 && <Text style={styles.moreText}>+{dotColors.length - 3}</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
            <Text style={styles.legendText}>En cours</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#e6a800' }]} />
            <Text style={styles.legendText}>Réservation</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  monthNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surfaceContainerLowest,
    ...theme.shadow.card,
  },
  navButton: { padding: theme.spacing.sm },
  navButtonText: { fontSize: theme.fontSize.lg, color: theme.colors.primary },
  monthTitle: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.xl, color: theme.colors.onSurface },
  weekDays: {
    flexDirection: 'row', backgroundColor: theme.colors.surfaceContainerLowest,
    paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant,
  },
  weekDayCell: { flex: 1, alignItems: 'center' },
  weekDay: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.xs, color: theme.colors.onSurfaceVariant, textTransform: 'uppercase' },
  calendarBody: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: theme.colors.surfaceContainerLowest },
  dayCell: {
    width: '14.28%', minHeight: 64, padding: theme.spacing.xs,
    borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: theme.colors.outlineVariant,
  },
  todayCell: { backgroundColor: theme.colors.primaryLight },
  dayNumber: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurface, marginBottom: 2 },
  todayNumber: { fontFamily: theme.fonts.headlineBold, color: theme.colors.primary },
  dotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  contractDot: { width: 6, height: 6, borderRadius: 3 },
  moreText: { fontFamily: theme.fonts.body, fontSize: 8, color: theme.colors.onSurfaceVariant },
  legend: {
    flexDirection: 'row', padding: theme.spacing.md, gap: theme.spacing.lg,
    backgroundColor: theme.colors.surfaceContainerLowest, marginTop: 1,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
});
