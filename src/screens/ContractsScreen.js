import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import api from '../api';
import theme from '../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { printContract } from '../printUtils';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchFilterBar from '../components/SearchFilterBar';
import PaginationFooter from '../components/PaginationFooter';
import { usePaginatedList } from '../hooks/usePaginatedList';

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function formatDateFr(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso).slice(0, 10);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const statusMeta = {
  RESERVE: { label: 'Réservation', accent: theme.colors.secondary, bg: theme.colors.primaryLight, text: theme.colors.secondary, border: 'rgba(4,83,205,0.25)', icon: 'event' },
  EN_COURS: { label: 'En cours', accent: theme.colors.orange500, bg: theme.colors.orange50, text: theme.colors.orange600, border: theme.colors.orange200, icon: 'schedule' },
  TERMINE: { label: 'Terminé', accent: theme.colors.green600, bg: theme.colors.statusAvailable, text: theme.colors.green600, border: 'rgba(46,125,50,0.25)', icon: 'check-circle' },
  ANNULE: { label: 'Annulé', accent: theme.colors.error, bg: theme.colors.errorContainer, text: theme.colors.error, border: theme.colors.red200, icon: 'cancel' },
};

const statusOptions = [
  { value: '', label: 'Tous', dotColor: theme.colors.primary },
  { value: 'RESERVE', label: 'Réservation', dotColor: theme.colors.secondary },
  { value: 'EN_COURS', label: 'En cours', dotColor: theme.colors.orange500 },
  { value: 'TERMINE', label: 'Terminé', dotColor: theme.colors.green600 },
  { value: 'ANNULE', label: 'Annulé', dotColor: theme.colors.error },
];

export default function ContractsScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const { items, loading, refreshing, loadingMore, page, total, totalPages, loadMore, refresh, goToPage } = usePaginatedList('contracts/', { search, filters: { statut } });
  const contracts = items;
  const [printingId, setPrintingId] = useState(null);

  const renderItem = ({ item }) => {
    const meta = statusMeta[item.statut] || statusMeta.EN_COURS;
    return (
      <View style={styles.card}>
        <View style={[styles.accentBar, { backgroundColor: meta.accent }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <View style={styles.clientRow}>
              <View style={styles.avatar}>
                <MaterialIcons name="person" size={20} color={theme.colors.secondary} />
              </View>
              <Text style={styles.clientName} numberOfLines={1}>{item.client_prenom} {item.client_name}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: meta.bg, borderColor: meta.border }]}>
              <MaterialIcons name={meta.icon} size={14} color={meta.text} />
              <Text style={[styles.statusText, { color: meta.text }]}>{meta.label}</Text>
            </View>
          </View>

          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <MaterialIcons name="badge" size={18} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.infoText}>{item.vehicle_matricule || item.vehicule_matricule || item.vehicule || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="calendar-today" size={18} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.infoText}>
                {formatDateFr(item.date_sortie)}{item.date_retour_prevue ? `  →  ${formatDateFr(item.date_retour_prevue)}` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.amountLabel}>Montant</Text>
              <Text style={styles.amount}>{parseFloat(item.montant_total || 0).toLocaleString()} DH</Text>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.pdfButton} onPress={() => {
                setPrintingId(item.id);
                printContract(item.id, false, (status) => {
                  if (status === 'READY' || status === 'ERROR') setPrintingId(null);
                });
              }}>
                <MaterialIcons name="picture-as-pdf" size={18} color={theme.colors.error} />
                <Text style={styles.pdfButtonText}>PDF</Text>
              </TouchableOpacity>
              {item.statut === 'EN_COURS' && (
                <TouchableOpacity style={styles.closeButton} onPress={() => navigation.navigate('CloseContract', { id: item.id })}>
                  <MaterialIcons name="lock" size={16} color={theme.colors.onSecondary} />
                  <Text style={styles.closeButtonText}>Clôturer</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <SearchFilterBar placeholder="Rechercher (client, matricule, marque)..." search={search} onSearchChange={setSearch} options={statusOptions} filter={statut} onFilterChange={setStatut} />
      <FlatList
        data={contracts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.colors.primary} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={<Text style={styles.empty}>Aucun contrat enregistré.</Text>}
        ListFooterComponent={<PaginationFooter page={page} totalPages={totalPages} total={total} loading={loadingMore} onPrev={() => goToPage(page - 1)} onNext={() => goToPage(page + 1)} />}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('ContractForm', {})}>
        <MaterialIcons name="add" size={28} color={theme.colors.onSecondary} />
      </TouchableOpacity>
      {printingId !== null && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.overlayText}>Génération du PDF...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: { color: '#fff', marginTop: theme.spacing.md, fontFamily: theme.fonts.bodyMedium, fontSize: theme.fontSize.md },
  list: { padding: theme.spacing.md, paddingBottom: 96 },
  footerLoader: { marginVertical: theme.spacing.md },
  card: {
    position: 'relative',
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  cardBody: { padding: theme.spacing.md, paddingLeft: theme.spacing.md + 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.md },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flex: 1, marginRight: theme.spacing.sm },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientName: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.md, color: theme.colors.onSurface, flexShrink: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  statusText: { fontSize: theme.fontSize.xs, fontFamily: theme.fonts.bodySemibold },
  infoList: { flexDirection: 'column', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  infoText: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  amountLabel: { fontFamily: theme.fonts.label, fontSize: theme.fontSize.xs, color: theme.colors.onSurfaceVariant, marginBottom: 2 },
  amount: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.xl, color: theme.colors.secondary },
  actionRow: { flexDirection: 'row', gap: theme.spacing.sm },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.errorContainer,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(186,26,26,0.15)',
  },
  pdfButtonText: { color: theme.colors.error, fontSize: theme.fontSize.sm, fontFamily: theme.fonts.bodySemibold },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  closeButtonText: { color: theme.colors.onSecondary, fontSize: theme.fontSize.sm, fontFamily: theme.fonts.bodySemibold },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: theme.colors.secondary, width: 56, height: 56,
    borderRadius: theme.borderRadius.xl, justifyContent: 'center', alignItems: 'center',
    ...theme.shadow.card,
  },
  empty: { textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xl, fontFamily: theme.fonts.body, fontSize: theme.fontSize.md },
});
