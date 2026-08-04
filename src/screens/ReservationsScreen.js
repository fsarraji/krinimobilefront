import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import api from '../api';
import theme from '../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { printReservationReceipt } from '../printUtils';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchFilterBar from '../components/SearchFilterBar';
import PaginationFooter from '../components/PaginationFooter';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { Alert } from '../utils/alert';
import { confirmDialog } from '../utils/confirm';

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function formatDateFr(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso).slice(0, 10);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const REQUEST_STATUS_META = {
  PENDING: { label: 'En attente', color: theme.colors.warning, icon: 'hourglass-top', accent: theme.colors.warning, bg: '#fff8e1', border: '#fde68a' },
  CONFIRMED: { label: 'Confirmée', color: theme.colors.success, icon: 'check-circle', accent: theme.colors.green600, bg: theme.colors.statusAvailable, border: 'rgba(46,125,50,0.25)' },
  CANCELLED: { label: 'Annulée', color: theme.colors.error, icon: 'cancel', accent: theme.colors.error, bg: theme.colors.errorContainer, border: theme.colors.red200 },
};

const requestOptions = [
  { value: '', label: 'Tous', dotColor: theme.colors.primary },
  { value: 'PENDING', label: 'En attente', dotColor: theme.colors.warning },
  { value: 'CONFIRMED', label: 'Confirmée', dotColor: theme.colors.success },
  { value: 'CANCELLED', label: 'Annulée', dotColor: theme.colors.error },
];

const reservationOptions = [
  { value: '', label: 'Tous', dotColor: theme.colors.primary },
  { value: 'paid', label: 'Payée', dotColor: theme.colors.success },
  { value: 'partial', label: 'Partielle', dotColor: theme.colors.warning },
  { value: 'unpaid', label: 'Non payée', dotColor: theme.colors.error },
];

function paymentStatus(item) {
  const paid = parseFloat(item.montant_paye ?? item.paiement_total ?? 0) || 0;
  const totalAmt = parseFloat(item.montant_total ?? item.total ?? 0) || 0;
  if (!totalAmt) return paid > 0 ? 'paid' : 'unpaid';
  if (paid >= totalAmt) return 'paid';
  return paid > 0 ? 'partial' : 'unpaid';
}

export default function ReservationsScreen({ navigation }) {
  const [tab, setTab] = useState('demandes');
  const [search, setSearch] = useState('');
  const [reqFilter, setReqFilter] = useState('');
  const [resFilter, setResFilter] = useState('');
  const baseUrl = tab === 'demandes' ? 'reservations/' : 'contracts/?statut=RESERVE';
  const { items, loading, refreshing, loadingMore, page, total, totalPages, loadMore, refresh, goToPage } = usePaginatedList(baseUrl, { search, filters: tab === 'demandes' ? { statut: reqFilter || undefined } : {} });
  const visible = tab === 'agence' && resFilter ? items.filter((i) => paymentStatus(i) === resFilter) : items;
  const [activating, setActivating] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [printingId, setPrintingId] = useState(null);

  const handlePrint = (id) => {
    setPrintingId(id);
    printReservationReceipt(id, (status) => {
      if (status === 'READY' || status === 'ERROR') setPrintingId(null);
    });
  };

  const handleConfirm = (item) => {
    confirmDialog(`Confirmer la demande de ${item.client_name} pour le véhicule ${item.vehicle_name} ?`, async () => {
      setUpdating(item.id);
      try {
        await api.post(`reservations/${item.id}/confirm/`, { km_sortie: 0, carburant_sortie: '4/8' });
        refresh();
        Alert.alert('Succès', 'Demande confirmée. Le contrat de réservation (Réservé) a été créé.');
      } catch (e) {
        Alert.alert('Erreur', e.response?.data?.detail || 'Impossible de confirmer cette demande.');
      } finally {
        setUpdating(null);
      }
    });
  };

  const handleRefuse = (item) => {
    confirmDialog(`Refuser la demande de ${item.client_name} pour le véhicule ${item.vehicle_name} ?`, async () => {
      setUpdating(item.id);
      try {
        await api.patch(`reservations/${item.id}/`, { statut: 'CANCELLED' });
        refresh();
        Alert.alert('Succès', 'Demande refusée.');
      } catch (e) {
        Alert.alert('Erreur', e.response?.data?.detail || 'Impossible de refuser cette demande.');
      } finally {
        setUpdating(null);
      }
    });
  };

  const handleActivate = async (item) => {
    confirmDialog(`Passer la réservation de ${item.client_nom || item.client} en contrat actif ?`, async () => {
      setActivating(item.id);
      try {
        await api.patch(`contracts/${item.id}/`, {
          statut: 'EN_COURS',
          km_sortie: item.km_sortie || 0,
          carburant_sortie: item.carburant_sortie || '4/8',
        });
        refresh();
        Alert.alert('Succès', 'Réservation activée');
      } catch (e) {
        Alert.alert('Erreur', e.response?.data?.detail || 'Erreur');
      } finally {
        setActivating(null);
      }
    });
  };

  const renderRequest = ({ item }) => {
    const meta = REQUEST_STATUS_META[item.statut] || REQUEST_STATUS_META.PENDING;
    const busy = updating === item.id;
    return (
      <View style={styles.card}>
        <View style={[styles.accentBar, { backgroundColor: meta.accent }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={20} color={theme.colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName} numberOfLines={1}>{item.client_name}</Text>
              <Text style={styles.vehicleText} numberOfLines={1}>{item.vehicle_name}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: meta.bg, borderColor: meta.border }]}>
              <MaterialIcons name={meta.icon} size={14} color={meta.color} />
              <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>
          <View style={styles.dateRow}>
            <MaterialIcons name="calendar-today" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.dateValue}>{formatDateFr(item.date_sortie)}  →  {formatDateFr(item.date_retour_prevue)}</Text>
          </View>
          {item.statut === 'PENDING' && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.rejectButton} onPress={() => handleRefuse(item)} disabled={busy}>
                <Text style={styles.rejectText}>{busy ? '...' : 'Refuser'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.activateButton} onPress={() => handleConfirm(item)} disabled={busy}>
                <Text style={styles.activateText}>{busy ? '...' : 'Confirmer'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={[styles.accentBar, { backgroundColor: theme.colors.secondary }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={20} color={theme.colors.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName} numberOfLines={1}>{item.client_nom || item.client}</Text>
            <Text style={styles.vehicleText} numberOfLines={1}>{item.vehicule_matricule || item.vehicule}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: theme.colors.primaryLight, borderColor: 'rgba(4,83,205,0.25)' }]}>
            <MaterialIcons name="event" size={14} color={theme.colors.secondary} />
            <Text style={[styles.statusText, { color: theme.colors.secondary }]}>Réservation</Text>
          </View>
        </View>
        <View style={styles.dateRow}>
          <MaterialIcons name="calendar-today" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.dateValue}>{formatDateFr(item.date_sortie)}  →  {formatDateFr(item.date_retour_prevue)}</Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.receiptButton} onPress={() => handlePrint(item.id)} disabled={printingId !== null}>
            <Text style={styles.receiptButtonText}>{printingId === item.id ? 'Génération...' : 'Reçu'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.activateButton} onPress={() => handleActivate(item)} disabled={activating === item.id}>
            <Text style={styles.activateText}>{activating === item.id ? '...' : 'Activer'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'demandes' && styles.tabActive]} onPress={() => setTab('demandes')}>
          <Text style={[styles.tabText, tab === 'demandes' && styles.tabTextActive]}>Demandes clients</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'agence' && styles.tabActive]} onPress={() => setTab('agence')}>
          <Text style={[styles.tabText, tab === 'agence' && styles.tabTextActive]}>Réservations</Text>
        </TouchableOpacity>
      </View>
      <SearchFilterBar
        placeholder="Rechercher (client, matricule, marque)..."
        search={search}
        onSearchChange={setSearch}
        options={tab === 'demandes' ? requestOptions : reservationOptions}
        filter={tab === 'demandes' ? reqFilter : resFilter}
        onFilterChange={tab === 'demandes' ? setReqFilter : setResFilter}
      />
      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id)}
        renderItem={tab === 'demandes' ? renderRequest : renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={(
          <Text style={styles.empty}>{tab === 'demandes' ? 'Aucune demande de réservation.' : 'Aucune réservation en attente.'}</Text>
        )}
        ListFooterComponent={<PaginationFooter page={page} totalPages={totalPages} total={total} loading={loadingMore} onPrev={() => goToPage(page - 1)} onNext={() => goToPage(page + 1)} />}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('ReservationForm', {})}>
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
  tabs: { flexDirection: 'row', paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.md, gap: theme.spacing.sm },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceContainerHighest,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: theme.colors.primary },
  tabText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  tabTextActive: { color: theme.colors.onPrimary },
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
    padding: 0,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  cardBody: { padding: theme.spacing.md, paddingLeft: theme.spacing.md + 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientName: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.md, color: theme.colors.onSurface },
  vehicleText: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, marginTop: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.xs },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  dateValue: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.onSurface, flex: 1 },
  actionRow: { flexDirection: 'row', gap: theme.spacing.sm },
  receiptButton: {
    flex: 1,
    backgroundColor: theme.colors.errorContainer,
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(186,26,26,0.15)',
  },
  receiptButtonText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.error },
  activateButton: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    alignItems: 'center',
  },
  activateText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.onSecondary },
  rejectButton: {
    flex: 1,
    backgroundColor: theme.colors.errorContainer,
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  rejectText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.error },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: theme.colors.secondary, width: 56, height: 56,
    borderRadius: theme.borderRadius.xl, justifyContent: 'center', alignItems: 'center',
    ...theme.shadow.card,
  },
  empty: { textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xl, fontFamily: theme.fonts.body, fontSize: theme.fontSize.md },
});
