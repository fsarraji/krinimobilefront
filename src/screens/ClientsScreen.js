import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../api';
import theme from '../theme';
import LoadingSpinner from '../components/LoadingSpinner';

function getInitials(prenom, nom) {
  return ((prenom?.charAt(0) || '') + (nom?.charAt(0) || '')).toUpperCase() || '?';
}

export default function ClientsScreen({ navigation }) {
  const [clients, setClients] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('clients/');
      setClients(res.data.results || res.data || []);
    } catch (e) {
      console.error('Clients error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClients();
    setRefreshing(false);
  };

  const handleDelete = (id) => {
    Alert.alert('Confirmer', 'Supprimer ce client ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await api.delete(`clients/${id}/`);
        fetchClients();
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
      <FlatList
        data={clients}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        ListEmptyComponent={<Text style={styles.empty}>Aucun client trouvé dans l'annuaire.</Text>}
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
