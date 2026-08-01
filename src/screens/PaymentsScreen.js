import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';
import LoadingSpinner from '../components/LoadingSpinner';
import { useData } from '../hooks/useData';

export default function PaymentsScreen() {
  const { data, loading, refreshing, refresh } = useData('payments/');
  const payments = data?.results || data || [];
  const total = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={styles.amount}>{parseFloat(item.amount).toLocaleString()} DH</Text>
        <Text style={styles.method}>{item.payment_method}</Text>
      </View>
      {(item.contract_nom || item.contract) && (
        <Text style={styles.contract}>Contrat #{item.contract_nom || item.contract}</Text>
      )}
      <Text style={styles.date}>{item.payment_date?.slice(0, 10)}</Text>
    </View>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <View style={styles.totalBar}>
        <Text style={styles.totalLabel}>Total collecté</Text>
        <Text style={styles.totalAmount}>{total.toLocaleString()} DH</Text>
      </View>
      <FlatList
        data={payments}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.colors.primary} />}
        ListEmptyComponent={<Text style={styles.empty}>Aucun paiement enregistré.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  totalBar: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontFamily: theme.fonts.body, color: theme.colors.onPrimary, fontSize: theme.fontSize.md, opacity: 0.9 },
  totalAmount: { fontFamily: theme.fonts.headlineBold, color: theme.colors.onPrimary, fontSize: theme.fontSize.xxl },
  list: { padding: theme.spacing.md },
  card: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.card,
    borderWidth: 1,
    borderColor: 'rgba(197,197,211,0.1)',
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs },
  amount: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.lg, color: '#2e7d32' },
  method: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  contract: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  date: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.xs, color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xs },
  empty: { fontFamily: theme.fonts.body, textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xl, fontSize: theme.fontSize.md },
});
