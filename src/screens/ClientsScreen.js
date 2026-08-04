import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../api';
import theme from '../theme';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchFilterBar from '../components/SearchFilterBar';
import PaginationFooter from '../components/PaginationFooter';
import { usePaginatedList } from '../hooks/usePaginatedList';

const clientOptions = [
  { value: false, label: 'Tous', dotColor: theme.colors.primary },
  { value: true, label: 'Liste noire', dotColor: theme.colors.error },
];

export default function ClientsScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [blacklisted, setBlacklisted] = useState(false);
  const { items, loading, refreshing, loadingMore, page, total, totalPages, loadMore, refresh, goToPage } = usePaginatedList('clients/', { search, filters: { liste_noire: blacklisted || undefined } });
  const clients = items;

  const handleDelete = (id) => {
    Alert.alert('Confirmer', 'Supprimer ce client ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await api.delete(`clients/${id}/`);
        refresh();
      }},
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ClientForm', { id: item.id })}
      onLongPress={() => handleDelete(item.id)}
    >
      <View style={styles.cardRow}>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={20} color={theme.colors.secondary} />
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{item.prenom} {item.nom}</Text>
            {item.liste_noire && (
              <View style={styles.blacklistBadge}>
                <MaterialIcons name="block" size={12} color={theme.colors.error} />
                <Text style={styles.blacklist}>Liste noire</Text>
              </View>
            )}
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={14} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.detail}>{item.telephone || '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="badge" size={14} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.detail}>{item.cin_passport || '—'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <SearchFilterBar placeholder="Rechercher (nom, prénom, CIN, téléphone)..." search={search} onSearchChange={setSearch} options={clientOptions} filter={blacklisted} onFilterChange={setBlacklisted} />
      <FlatList
        data={clients}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.colors.primary} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={<Text style={styles.empty}>Aucun client trouvé dans l'annuaire.</Text>}
        ListFooterComponent={<PaginationFooter page={page} totalPages={totalPages} total={total} loading={loadingMore} onPrev={() => goToPage(page - 1)} onNext={() => goToPage(page + 1)} />}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('ClientForm', {})}>
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
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerLow,
    justifyContent: 'center', alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs },
  name: { fontSize: theme.fontSize.md, fontFamily: theme.fonts.bodySemibold, color: theme.colors.onSurface, flex: 1 },
  blacklistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.errorContainer,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: theme.spacing.sm,
  },
  blacklist: { fontSize: theme.fontSize.xs, fontFamily: theme.fonts.bodySemibold, color: theme.colors.error },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  detail: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.body, color: theme.colors.onSurfaceVariant },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: theme.colors.secondary, width: 56, height: 56,
    borderRadius: theme.borderRadius.xl, justifyContent: 'center', alignItems: 'center',
    ...theme.shadow.card,
  },
  empty: { textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xl, fontFamily: theme.fonts.body, fontSize: theme.fontSize.md },
});
