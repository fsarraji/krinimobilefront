import { Alert, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Image } from 'react-native';
import api from '../api';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchFilterBar from '../components/SearchFilterBar';
import PaginationFooter from '../components/PaginationFooter';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { resolveMediaUrl } from '../apiUrl';

const statusMeta = {
  Available: { label: 'Disponible', accent: theme.colors.green600, bg: theme.colors.statusAvailable, text: theme.colors.green600, border: 'rgba(46,125,50,0.25)', icon: 'check-circle' },
  Rented: { label: 'Loué', accent: theme.colors.orange500, bg: theme.colors.orange50, text: theme.colors.orange600, border: theme.colors.orange200, icon: 'directions-car' },
  Maintenance: { label: 'Maintenance', accent: '#f59e0b', bg: '#fffbeb', text: '#b45309', border: '#fde68a', icon: 'build' },
};

const statusOptions = [
  { value: '', label: 'Tous', dotColor: theme.colors.primary },
  { value: 'Available', label: 'Disponible', dotColor: theme.colors.green600 },
  { value: 'Rented', label: 'Loué', dotColor: theme.colors.orange500 },
  { value: 'Maintenance', label: 'Maintenance', dotColor: '#f59e0b' },
];

export default function VehiclesScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const { items, loading, refreshing, loadingMore, page, total, totalPages, loadMore, refresh, goToPage } = usePaginatedList('vehicles/', { search, filters: { statut } });
  const vehicles = items;

  const handleDelete = (id) => {
    Alert.alert('Confirmer', 'Supprimer ce véhicule ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await api.delete(`vehicles/${id}/`);
        refresh();
      }},
    ]);
  };

  const renderVehicle = ({ item }) => {
    const meta = statusMeta[item.statut] || statusMeta.Available;
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('VehicleForm', { id: item.id })} onLongPress={() => handleDelete(item.id)}>
        <View style={[styles.accentBar, { backgroundColor: meta.accent }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            {resolveMediaUrl(item.image) ? (
              <Image source={{ uri: resolveMediaUrl(item.image) }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <View style={styles.avatar}>
                <MaterialIcons name="directions-car" size={20} color={theme.colors.secondary} />
              </View>
            )}
            <View style={styles.cardTitleBlock}>
              <Text style={styles.matricule}>{item.matricule}</Text>
              <Text style={styles.model} numberOfLines={1}>{item.marque_nom || item.marque} {item.modele_nom || item.modele}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: meta.bg, borderColor: meta.border }]}>
              <MaterialIcons name={meta.icon} size={14} color={meta.text} />
              <Text style={[styles.statusText, { color: meta.text }]}>{meta.label}</Text>
            </View>
          </View>
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <MaterialIcons name="speed" size={18} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.infoText}>{item.kilometrage?.toLocaleString()} km</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="payments" size={18} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.price}>{item.prix_par_jour} DH/j</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <SearchFilterBar placeholder="Rechercher (matricule, marque, modèle)..." search={search} onSearchChange={setSearch} options={statusOptions} filter={statut} onFilterChange={setStatut} />
      <FlatList data={vehicles} keyExtractor={(item) => String(item.id)} renderItem={renderVehicle} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.colors.primary} />} onEndReached={loadMore} onEndReachedThreshold={0.3} ListEmptyComponent={        <Text style={styles.empty}>Aucun véhicule dans la flotte.</Text>} ListFooterComponent={<PaginationFooter page={page} totalPages={totalPages} total={total} loading={loadingMore} onPrev={() => goToPage(page - 1)} onNext={() => goToPage(page + 1)} />} />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('VehicleForm', {})}>
        <MaterialIcons name="add" size={28} color={theme.colors.onSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: 64,
    height: 48,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceContainerLow,
  },
  cardTitleBlock: { flex: 1, marginRight: theme.spacing.xs },
  matricule: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.md, color: theme.colors.onSurface },
  model: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, marginTop: 1 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  statusText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.xs },
  infoList: { flexDirection: 'row', gap: theme.spacing.lg },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  infoText: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  price: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.secondary },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: theme.colors.secondary, width: 56, height: 56,
    borderRadius: theme.borderRadius.xl, justifyContent: 'center', alignItems: 'center',
    ...theme.shadow.card,
  },
  empty: { textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xl, fontFamily: theme.fonts.body, fontSize: theme.fontSize.md },
});
