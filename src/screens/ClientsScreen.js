import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../api';
import theme from '../theme';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchBar from '../components/SearchBar';
import PaginationFooter from '../components/PaginationFooter';
import { usePaginatedList } from '../hooks/usePaginatedList';

function getInitials(prenom, nom) {
  return ((prenom?.charAt(0) || '') + (nom?.charAt(0) || '')).toUpperCase() || '?';
}

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
          <Text style={styles.avatarText}>{getInitials(item.prenom, item.nom)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.prenom} {item.nom}</Text>
            {item.liste_noire && <Text style={styles.blacklist}>Liste noire</Text>}
          </View>
          <Text style={styles.detail}>{item.telephone}</Text>
          <Text style={styles.detail}>{item.cin_passport}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <SearchBar value={search} onChange={setSearch} placeholder="Rechercher (nom, prénom, CIN, téléphone)..." />
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterPill, !blacklisted && styles.filterPillActive]}
          onPress={() => setBlacklisted(false)}
        >
          <Text style={[styles.filterText, !blacklisted && styles.filterTextActive]}>Tous</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, blacklisted && styles.filterPillActive]}
          onPress={() => setBlacklisted(true)}
        >
          <Text style={[styles.filterText, blacklisted && styles.filterTextActive]}>Liste noire</Text>
        </TouchableOpacity>
      </View>
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
        <MaterialIcons name="add" size={28} color={theme.colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  list: { padding: theme.spacing.md, paddingBottom: 96 },
  filterRow: { flexDirection: 'row', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.sm },
  filterPill: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surfaceContainerLowest },
  filterPillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  filterTextActive: { color: theme.colors.onPrimary },
  footerLoader: { marginVertical: theme.spacing.md },
  card: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
    borderWidth: 1,
    borderColor: 'rgba(197,197,211,0.1)',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  avatarText: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.lg, color: theme.colors.primary },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: theme.fontSize.md, fontFamily: theme.fonts.bodySemibold, color: theme.colors.onSurface, flex: 1 },
  blacklist: { fontSize: theme.fontSize.xs, fontFamily: theme.fonts.bodyMedium, color: theme.colors.error, marginLeft: theme.spacing.sm },
  detail: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.body, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: theme.colors.primary, width: 56, height: 56,
    borderRadius: theme.borderRadius.xl, justifyContent: 'center', alignItems: 'center',
    ...theme.shadow.card,
  },
  fabText: { fontSize: 28, color: theme.colors.onPrimary, marginTop: -2 },
  empty: { textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xl, fontFamily: theme.fonts.body, fontSize: theme.fontSize.md },
});
