import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';
import LoadingSpinner from '../components/LoadingSpinner';
import { useData } from '../hooks/useData';


export default function DashboardScreen({ navigation }) {
  const { data: dashData, loading, refreshing, refresh } = useData('dashboard/');
  const stats = dashData?.stats || {};
  const alerts = dashData?.alerts || [];

  const totalVehicles = stats?.total_vehicles || 0;
  const rented = stats?.active_contracts || 0;
  const totalRevenue = stats?.total_revenue || 0;
  const utilization = stats?.utilization || [70, 65, 80, 75, 60];

  if (loading) return <LoadingSpinner />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHead}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="dashboard" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Tableau de bord</Text>
          </View>
          <Text style={styles.liveLabel}>Temps réel</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricsRow}
          style={{ marginLeft: 24 }}
        >
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Véhicules</Text>
            <Text style={styles.metricValue}>{totalVehicles}</Text>
            <View style={styles.trendRow}>
              <MaterialIcons name="directions-car" size={14} color={theme.colors.primary} />
              <Text style={styles.trendText}>Flotte</Text>
            </View>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Loués</Text>
            <Text style={styles.metricValue}>
              {rented}<Text style={styles.metricSub}>/{totalVehicles}</Text>
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: totalVehicles > 0 ? `${(rented / totalVehicles) * 100}%` : '0%' }]} />
            </View>
          </View>
          <View style={[styles.metricCard, styles.metricCardRevenue]}>
            <Text style={styles.metricLabelRevenue}>Revenu Mensuel</Text>
            <Text style={styles.metricValueRevenue}>
              {(totalRevenue / 1000).toFixed(1)}k DH
            </Text>
            <View style={styles.trendRow}>
              <MaterialIcons name="payments" size={14} color={theme.colors.tertiaryFixed} />
              <Text style={styles.trendTextRevenue}>Mois en cours</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="warning" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Alertes Urgentes</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.viewAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.alertList}>
            <View style={styles.alertCardError}>
              <View style={styles.alertIconError}>
                <MaterialIcons name="build" size={20} color={theme.colors.onErrorContainer} />
              </View>
              <View style={styles.alertContent}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertTitle}>Maintenance Due</Text>
                  <View style={styles.alertBadge}>
                    <Text style={styles.alertBadgeText}>Critique</Text>
                  </View>
                </View>
                <Text style={styles.alertDesc}>Tesla Model S (BX-902) nécessite révision des 15 000 km dans 2 jours.</Text>
              </View>
            </View>
            <View style={styles.alertCardInfo}>
              <View style={styles.alertIconInfo}>
                <MaterialIcons name="verified-user" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.alertContent}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertTitle}>Expiration Assurance</Text>
                  <View style={styles.alertBadgeInfo}>
                    <Text style={styles.alertBadgeTextInfo}>7 Jours</Text>
                  </View>
                </View>
                <Text style={styles.alertDesc}>BMW iX (AA-772) police #XJ889 expire le 14 oct.</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="analytics" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Utilisation Flotte</Text>
            </View>
          </View>
          <View style={styles.chartCard}>
            {/* Legend */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
                <Text style={styles.legendLabel}>Loué</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.colors.tertiaryFixedDim }]} />
                <Text style={styles.legendLabel}>Disponible</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.colors.error }]} />
                <Text style={styles.legendLabel}>Maintenance</Text>
              </View>
            </View>
            {/* Stacked Bars */}
            <View style={styles.chartBars}>
              {[70, 65, 80, 75, 60].map((active, i) => {
                const idle = 20 - (i % 3) * 2;
                const repair = 100 - active - idle;
                return (
                  <View key={i} style={styles.barCol}>
                    <View style={styles.barContainer}>
                      <View style={[styles.barSegment, { flex: active, backgroundColor: theme.colors.primary }]} />
                      <View style={[styles.barSegment, { flex: idle, backgroundColor: theme.colors.tertiaryFixedDim }]} />
                      <View style={[styles.barSegment, { flex: repair, backgroundColor: theme.colors.error }]} />
                    </View>
                  </View>
                );
              })}
            </View>
            {/* Day labels */}
            <View style={styles.dayRow}>
              {['MON', 'TUE', 'WED', 'THU', 'FRI'].map((d) => (
                <Text key={d} style={styles.dayLabel}>{d}</Text>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.quickActionRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Contracts', { screen: 'ContractForm' })}>
            <View style={styles.actionIcon}>
              <MaterialIcons name="description" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionText}>Nouveau Contrat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Clients', { screen: 'ClientForm' })}>
            <View style={styles.actionIcon}>
              <MaterialIcons name="person-add" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionText}>Nouveau Client</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Vehicles', { screen: 'VehicleForm' })}>
            <View style={styles.actionIcon}>
              <MaterialIcons name="directions-car" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionText}>Nouveau Véhicule</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ContractForm')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingTop: 16,
    paddingBottom: 120,
    gap: 24,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontFamily: theme.fonts.headlineBold,
    fontSize: theme.fontSize.lg,
    color: theme.colors.onSurface,
  },
  liveLabel: {
    fontFamily: theme.fonts.headlineBold,
    fontSize: 10,
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingRight: 24,
  },
  metricCard: {
    minWidth: 160,
    backgroundColor: theme.colors.surfaceContainerLowest,
    padding: 20,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(197,197,211,0.1)',
  },
  metricLabel: {
    fontFamily: theme.fonts.label,
    fontSize: 10,
    color: theme.colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: theme.fonts.headlineBold,
    fontSize: 30,
    color: theme.colors.primary,
  },
  metricSub: {
    fontSize: 14,
    color: 'rgba(80,95,118,0.4)',
    fontWeight: '400',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  trendText: {
    fontFamily: theme.fonts.bodySemibold,
    fontSize: 11,
    color: theme.colors.tertiaryContainer,
  },
  progressBar: {
    marginTop: 12,
    width: '100%',
    height: 6,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
  },
  metricCardRevenue: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryContainer,
  },
  metricLabelRevenue: {
    fontFamily: theme.fonts.label,
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metricValueRevenue: {
    fontFamily: theme.fonts.headlineBold,
    fontSize: 30,
    color: '#fff',
  },
  trendTextRevenue: {
    fontFamily: theme.fonts.bodySemibold,
    fontSize: 11,
    color: theme.colors.tertiaryFixed,
  },
  sectionBlock: {
    gap: 12,
  },
  viewAll: {
    fontFamily: theme.fonts.headlineBold,
    fontSize: 11,
    color: theme.colors.primary,
  },
  alertList: {
    paddingHorizontal: 24,
    gap: 12,
  },
  alertCardError: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,218,214,0.4)',
    padding: 16,
    borderRadius: theme.borderRadius.md,
    gap: 16,
    alignItems: 'flex-start',
  },
  alertIconError: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.onErrorContainer,
  },
  alertBadge: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  alertBadgeText: {
    fontFamily: theme.fonts.headlineBold,
    fontSize: 10,
    color: '#fff',
    textTransform: 'uppercase',
  },
  alertDesc: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: 'rgba(147,0,10,0.7)',
    lineHeight: 18,
  },
  alertCardInfo: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: 16,
    borderRadius: theme.borderRadius.md,
    gap: 16,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(197,197,211,0.1)',
  },
  alertIconInfo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(0,35,111,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBadgeInfo: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  alertBadgeTextInfo: {
    fontFamily: theme.fonts.headlineBold,
    fontSize: 10,
    color: '#fff',
    textTransform: 'uppercase',
  },
  chartCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(197,197,211,0.1)',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontFamily: theme.fonts.headlineBold,
    fontSize: 10,
    color: theme.colors.secondaryFixedDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 128,
  },
  barCol: {
    flex: 1,
    height: '100%',
  },
  barContainer: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'column-reverse',
  },
  barSegment: {
    borderRadius: 0,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dayLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 10,
    color: theme.colors.secondary,
  },
  quickActionRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainerLowest,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(197,197,211,0.1)',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(0,35,111,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontFamily: theme.fonts.bodySemibold,
    fontSize: 11,
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 96,
    right: 24,
    width: 56,
    height: 56,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
