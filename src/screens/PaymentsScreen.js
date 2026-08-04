import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchFilterBar from '../components/SearchFilterBar';
import PaginationFooter from '../components/PaginationFooter';
import { usePaginatedList } from '../hooks/usePaginatedList';

export default function PaymentsScreen() {
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const { items, loading, refreshing, loadingMore, page, total: totalCount, totalPages, loadMore, refresh, goToPage } = usePaginatedList('payments/', { search });
  const payments = items;

  const methods = [...new Set(payments.map((p) => p.payment_method).filter(Boolean))];
  const methodOptions = [
    { value: '', label: 'Toutes', dotColor: theme.colors.primary },
    ...methods.map((m) => ({ value: m, label: m, dotColor: theme.colors.onSurfaceVariant })),
  ];
  const visible = method ? payments.filter((p) => p.payment_method === method) : payments;
  const visibleTotal = visible.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.avatar}>
          <MaterialIcons name="payments" size={20} color={theme.colors.secondary} />
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.amountRow}>
            <Text style={styles.amount}>{parseFloat(item.amount).toLocaleString()} DH</Text>
            <View style={styles.methodBadge}>
              <Text style={styles.method}>{item.payment_method}</Text>
            </View>
          </View>
          {(item.contract_nom || item.contract) && (
            <View style={styles.infoRow}>
              <MaterialIcons name="description" size={14} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.contract}>Contrat #{item.contract_nom || item.contract}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <MaterialIcons name="calendar-today" size={14} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.date}>{item.payment_date?.slice(0, 10)}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <View style={styles.totalBar}>
        <Text style={styles.totalLabel}>Total collecté (affiché)</Text>
        <Text style={styles.totalAmount}>{visibleTotal.toLocaleString()} DH</Text>
      </View>
      <SearchFilterBar placeholder="Rechercher (référence, notes)..." search={search} onSearchChange={setSearch} options={methodOptions} filter={method} onFilterChange={setMethod} />
      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.colors.primary} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={<Text style={styles.empty}>Aucun paiement enregistré.</Text>}
        ListFooterComponent={<PaginationFooter page={page} totalPages={totalPages} total={totalCount} loading={loadingMore} onPrev={() => goToPage(page - 1)} onNext={() => goToPage(page + 1)} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  totalBar: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontFamily: theme.fonts.body, color: theme.colors.onSecondary, fontSize: theme.fontSize.md, opacity: 0.9 },
  totalAmount: { fontFamily: theme.fonts.headlineBold, color: theme.colors.onSecondary, fontSize: theme.fontSize.xxl },
  list: { padding: theme.spacing.md },
  footerLoader: { marginVertical: theme.spacing.md },
  card: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.card,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  cardInfo: { flex: 1 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.xs },
  amount: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.lg, color: theme.colors.secondary },
  methodBadge: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  method: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.xs, color: theme.colors.secondary },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  contract: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  date: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.xs, color: theme.colors.onSurfaceVariant },
  empty: { fontFamily: theme.fonts.body, textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xl, fontSize: theme.fontSize.md },
});
