import { Alert } from 'react-native';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import api from '../api';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';
import LoadingSpinner from '../components/LoadingSpinner';
import { useData } from '../hooks/useData';

const statusColors = {
  Available: theme.colors.statusAvailable,
  Rented: theme.colors.statusRented,
  Maintenance: theme.colors.statusMaintenance,
};

const statusTextColors = {
  Available: '#2e7d32',
  Rented: '#e65100',
  Maintenance: '#c62828',
};

const statusLabels = {
  Available: 'Disponible',
  Rented: 'Loué',
  Maintenance: 'Maintenance',
};

export default function VehiclesScreen({ navigation }) {
  const { data, loading, refreshing, refresh } = useData('vehicles/');
  const vehicles = data?.results || data || [];

  const handleDelete = (id) => {
    Alert.alert('Confirmer', 'Supprimer ce véhicule ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await api.delete(`vehicles/${id}/`);
        refresh();
      }},
    ]);
  };

  const renderVehicle = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('VehicleForm', { id: item.id })} onLongPress={() => handleDelete(item.id)}>
      <View style={styles.imagePlaceholder} />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.matricule}>{item.matricule}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[item.statut] || '#f5f5f5' }]}>
            <Text style={[styles.statusText, { color: statusTextColors[item.statut] || theme.colors.onSurfaceVariant }]}>{statusLabels[item.statut] || item.statut}</Text>
          </View>
        </View>
        <Text style={styles.model}>{item.marque_nom || item.marque} {item.modele_nom || item.modele}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.detail}>{item.kilometrage?.toLocaleString()} km</Text>
          <Text style={styles.price}>{item.prix_par_jour} DH/j</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList data={vehicles} keyExtractor={(item) => String(item.id)} renderItem={renderVehicle} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.colors.primary} />} ListEmptyComponent={        <Text style={styles.empty}>Aucun véhicule dans la flotte.</Text>} />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('VehicleForm', {})}>
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
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadow.card,
    borderWidth: 1,
    borderColor: 'rgba(197,197,211,0.1)',
  },
  imagePlaceholder: { height: 100, backgroundColor: theme.colors.surfaceContainerHigh },
  cardBody: { padding: theme.spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs },
  matricule: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.lg, color: theme.colors.onSurface },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: theme.borderRadius.full },
  statusText: { fontFamily: theme.fonts.label, fontSize: theme.fontSize.xs },
  model: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.md, color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.sm },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  detail: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  price: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.primary },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: theme.colors.primary, width: 56, height: 56,
    borderRadius: theme.borderRadius.xl, justifyContent: 'center', alignItems: 'center',
    ...theme.shadow.card,
  },
  fabText: { fontSize: 28, color: theme.colors.onPrimary, marginTop: -2 },
  empty: { textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xl, fontFamily: theme.fonts.body, fontSize: theme.fontSize.md },
});
