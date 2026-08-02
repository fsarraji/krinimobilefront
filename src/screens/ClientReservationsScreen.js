import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, RefreshControl, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../api';
import theme from '../theme';
import SearchBar from '../components/SearchBar';
import PaginationFooter from '../components/PaginationFooter';
import { usePaginatedList } from '../hooks/usePaginatedList';

const STATUS_META = {
  PENDING: { label: 'En attente', color: theme.colors.warning, icon: 'hourglass-top' },
  CONFIRMED: { label: 'Confirmée', color: theme.colors.success, icon: 'check-circle' },
  CANCELLED: { label: 'Annulée', color: theme.colors.error, icon: 'cancel' },
};

const STATUS_OPTIONS = [
  { value: '', label: 'Toutes' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'CONFIRMED', label: 'Confirmées' },
  { value: 'CANCELLED', label: 'Annulées' },
];

export default function ClientReservationsScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const { items: reservations, loading, refreshing, loadingMore, page, total, totalPages, loadMore, refresh, goToPage } = usePaginatedList('reservations/', { search, filters: { statut } });

  const showError = (msg) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(msg);
    } else {
      Alert.alert('Erreur', msg);
    }
  };

  const handleCancel = (id) => {
    const doCancel = async () => {
      try {
        await api.patch(`reservations/${id}/`, { statut: 'CANCELLED' });
        refresh();
      } catch (e) {
        showError('Impossible d\'annuler cette réservation.');
      }
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Voulez-vous vraiment annuler cette réservation ?')) {
        doCancel();
      }
      return;
    }
    Alert.alert('Annuler la réservation', 'Voulez-vous vraiment annuler cette réservation ?', [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui, annuler', style: 'destructive', onPress: doCancel },
    ]);
  };

  const handleDelete = (id) => {
    const doDelete = async () => {
      try {
        await api.delete(`reservations/${id}/`);
        refresh();
      } catch (e) {
        showError('Impossible de supprimer cette réservation.');
      }
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Voulez-vous vraiment supprimer cette réservation ?')) {
        doDelete();
      }
      return;
    }
    Alert.alert('Supprimer la réservation', 'Voulez-vous vraiment supprimer cette réservation ?', [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui, supprimer', style: 'destructive', onPress: doDelete },
    ]);
  };

  const renderItem = ({ item }) => {
    const meta = STATUS_META[item.statut] || STATUS_META.PENDING;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.vehicleIcon}>
            <MaterialIcons name="directions-car" size={24} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.vehicleName} numberOfLines={1}>{item.vehicle_name}</Text>
            <View style={styles.agencyRow}>
              <MaterialIcons name="business" size={12} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.agencyName} numberOfLines={1}>{item.agency_name || ''}</Text>
            </View>
            <Text style={styles.vehicleMeta}>{item.formatted_dates?.range || 'Dates à définir'}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prix / jour</Text>
            <Text style={styles.infoValue}>{item.prix_par_jour?.toLocaleString() || '0'} DH</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Créée le</Text>
            <Text style={styles.infoValue}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: meta.color + '1A' }]}>
            <MaterialIcons name={meta.icon} size={14} color={meta.color} />
            <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
        {item.statut === 'PENDING' && (
          <View style={styles.pendingActions}>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)} activeOpacity={0.8}>
              <MaterialIcons name="delete-outline" size={18} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.deleteText}>Supprimer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancel(item.id)} activeOpacity={0.8}>
              <MaterialIcons name="cancel" size={18} color={theme.colors.error} />
              <Text style={styles.cancelText}>Annuler la réservation</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SearchBar value={search} onChange={setSearch} placeholder="Rechercher (véhicule, dates)..." />
      <View style={styles.filterRow}>
        {STATUS_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value || 'all'}
            style={[styles.filterPill, statut === opt.value && styles.filterPillActive]}
            onPress={() => setStatut(opt.value)}
          >
            <Text style={[styles.filterText, statut === opt.value && styles.filterTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={reservations}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.colors.primary} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={<PaginationFooter page={page} totalPages={totalPages} total={total} loading={loadingMore} onPrev={() => goToPage(page - 1)} onNext={() => goToPage(page + 1)} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialIcons name="event-busy" size={48} color={theme.colors.outlineVariant} />
            <Text style={styles.emptyTitle}>Aucune réservation</Text>
            <Text style={styles.emptyText}>Vous n'avez pas encore de réservation. Retournez sur l'accueil pour réserver un véhicule.</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('ClientHome')} activeOpacity={0.85}>
              <Text style={styles.emptyButtonText}>Voir les véhicules</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  list: { padding: theme.spacing.md },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.sm },
  filterPill: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surfaceContainerLowest },
  filterPillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  filterTextActive: { color: theme.colors.onPrimary },
  footerLoader: { marginVertical: theme.spacing.md },
  card: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  vehicleIcon: { width: 48, height: 48, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  vehicleName: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.md, color: theme.colors.onSurface },
  agencyRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  agencyName: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.xs, color: theme.colors.onSurfaceVariant, flex: 1 },
  vehicleMeta: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  cardBody: { marginTop: theme.spacing.md, gap: theme.spacing.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  infoValue: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.onSurface },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingHorizontal: theme.spacing.sm, paddingVertical: 4, borderRadius: theme.borderRadius.full, marginTop: theme.spacing.xs },
  statusText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm },
  pendingActions: { marginTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(197,197,211,0.15)', flexDirection: 'row' },
  deleteButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm, paddingVertical: 10, borderRightWidth: 1, borderRightColor: 'rgba(197,197,211,0.15)' },
  deleteText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  cancelButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm, paddingVertical: 10 },
  cancelText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.error },
  emptyBox: { alignItems: 'center', paddingTop: theme.spacing.xl * 2, paddingHorizontal: theme.spacing.lg },
  emptyTitle: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.lg, color: theme.colors.onSurface, marginTop: theme.spacing.md },
  emptyText: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: theme.spacing.sm, lineHeight: 20 },
  emptyButton: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, paddingVertical: 12, paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg },
  emptyButtonText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onPrimary },
});
