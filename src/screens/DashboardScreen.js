import { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Platform, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';
import LoadingSpinner from '../components/LoadingSpinner';
import { useData } from '../hooks/useData';

const DESIGN_SECONDARY = '#0453cd';
const DESIGN_FLOET = '#006A60';
const DESIGN_ALERT_BG = '#FFF4F4';
const DESIGN_ALERT_ICON = '#FFDADA';
const DESIGN_ALERT_TITLE = '#8C1D1D';
const DESIGN_BADGE_DAYS = '#5D6679';

const WEEK_DAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

export default function DashboardScreen({ navigation }) {
  const { data: dashData, loading, refreshing, refresh } = useData('dashboard/');
  const stats = dashData?.stats || {};
  const alerts = dashData?.alerts || [];

  const totalVehicles = stats?.total_vehicles || 0;
  const rented = stats?.active_contracts || 0;
  const totalRevenue = stats?.total_revenue || 0;
  const utilization = stats?.utilization || [];

  const chartData =
    Array.isArray(utilization) && utilization.length >= 5
      ? utilization.slice(0, WEEK_DAYS.length)
      : [70, 65, 80, 75, 60, 85, 72];

  const disponibilite =
    totalVehicles > 0 ? Math.max(0, (1 - rented / totalVehicles) * 100) : 98.5;

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);
  const dotOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });

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
          <View style={styles.livePill}>
            <Animated.View style={[styles.liveDot, { opacity: dotOpacity }]} />
            <Text style={styles.liveLabel}>Temps réel</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Véhicules</Text>
            <Text style={styles.metricValue}>{totalVehicles}</Text>
            <View style={styles.trendRow}>
              <MaterialIcons name="local-shipping" size={14} color={DESIGN_FLOET} />
              <Text style={styles.trendText}>Flotte</Text>
            </View>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Loués</Text>
            <Text style={styles.metricValue}>
              {rented}
              <Text style={styles.metricSub}>/{totalVehicles}</Text>
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: totalVehicles > 0 ? `${(rented / totalVehicles) * 100}%` : '0%' }]} />
            </View>
          </View>
          <View style={[styles.metricCard, styles.metricCardRevenue]}>
            <Text style={styles.metricLabelRevenue}>Revenus</Text>
            <Text style={styles.metricValueRevenue}>
              {(totalRevenue / 1000).toFixed(1)}k
            </Text>
            <View style={styles.trendRow}>
              <MaterialIcons name="payments" size={14} color={theme.colors.tertiaryFixed} />
              <Text style={styles.trendTextRevenue}>Mensuel</Text>
            </View>
          </View>
        </View>

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
                <MaterialIcons name="build" size={20} color={theme.colors.error} />
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
                <MaterialIcons name="verified-user" size={20} color={theme.colors.onSurfaceVariant} />
              </View>
              <View style={styles.alertContent}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertTitleInfo}>Expiration Assurance</Text>
                  <View style={styles.alertBadgeInfo}>
                    <Text style={styles.alertBadgeText}>7 Jours</Text>
                  </View>
                </View>
                <Text style={styles.alertDescInfo}>BMW iX (AA-772) police #XJ889 expire le 14 oct.</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="analytics" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Usage de la flotte</Text>
            </View>
          </View>
          <View style={styles.chartCard}>
            <View style={styles.chartBars}>
              {chartData.map((value, i) => {
                const barHeight = `${Math.max(8, Math.min(100, value))}%`;
                return (
                  <View key={i} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { height: barHeight, opacity: 0.3 + (value / 100) * 0.7 },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={styles.dayRow}>
              {WEEK_DAYS.map((d) => (
                <Text key={d} style={styles.dayLabel}>{d}</Text>
              ))}
            </View>
            <View style={styles.chartDivider} />
            <View style={styles.chartFooter}>
              <View style={styles.chartFooterItem}>
                <Text style={styles.chartFooterLabel}>Kilométrage moyen</Text>
                <Text style={styles.chartFooterValue}>185 320 KM</Text>
              </View>
              <View style={styles.chartFooterItemRight}>
                <Text style={styles.chartFooterLabel}>Disponibilité</Text>
                <Text style={styles.chartFooterValue}>{disponibilite.toFixed(1)}%</Text>
              </View>
            </View>
          </View>
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
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(4, 83, 205, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: DESIGN_SECONDARY,
  },
  liveLabel: {
    fontFamily: theme.fonts.headlineBold,
    fontSize: 11,
    color: DESIGN_SECONDARY,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainerLowest,
    padding: 14,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(197,197,211,0.35)',
    ...theme.shadow.card,
  },
  metricLabel: {
    fontFamily: theme.fonts.label,
    fontSize: 9,
    color: theme.colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: theme.fonts.headlineBold,
    fontSize: 28,
    color: theme.colors.primary,
  },
  metricSub: {
    fontSize: 14,
    color: 'rgba(80,95,118,0.45)',
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
    color: DESIGN_FLOET,
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
    borderColor: 'transparent',
  },
  metricLabelRevenue: {
    fontFamily: theme.fonts.label,
    fontSize: 9,
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metricValueRevenue: {
    fontFamily: theme.fonts.headlineBold,
    fontSize: 28,
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
    backgroundColor: DESIGN_ALERT_BG,
    padding: 16,
    borderRadius: theme.borderRadius.md,
    gap: 14,
    alignItems: 'flex-start',
  },
  alertIconError: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: DESIGN_ALERT_ICON,
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
    color: DESIGN_ALERT_TITLE,
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
    color: 'rgba(147,0,10,0.75)',
    lineHeight: 18,
  },
  alertCardInfo: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainerLow,
    padding: 16,
    borderRadius: theme.borderRadius.md,
    gap: 14,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(197,197,211,0.25)',
  },
  alertIconInfo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitleInfo: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.onSurface,
  },
  alertBadgeInfo: {
    backgroundColor: DESIGN_BADGE_DAYS,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  alertDescInfo: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
  chartCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    marginHorizontal: 24,
    padding: 20,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(197,197,211,0.25)',
    ...theme.shadow.card,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 112,
  },
  barCol: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    height: '100%',
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  dayLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 9,
    color: theme.colors.secondary,
  },
  chartDivider: {
    height: 1,
    backgroundColor: 'rgba(197,197,211,0.35)',
    marginTop: 18,
    marginBottom: 14,
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartFooterItem: {
    flex: 1,
  },
  chartFooterItemRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  chartFooterLabel: {
    fontFamily: theme.fonts.label,
    fontSize: 9,
    color: theme.colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  chartFooterValue: {
    fontFamily: theme.fonts.headlineBold,
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  fab: {
    position: 'absolute',
    bottom: 96,
    right: 24,
    width: 56,
    height: 56,
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
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
