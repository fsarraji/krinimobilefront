import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import api from '../api';
import theme from '../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { printReservationReceipt } from '../printUtils';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ReservationsScreen({ navigation }) {
  const [reservations, setReservations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activating, setActivating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printingId, setPrintingId] = useState(null);

  const handlePrint = (id) => {
    setPrintingId(id);
    printReservationReceipt(id, (status) => {
      if (status === 'READY' || status === 'ERROR') setPrintingId(null);
    });
  };

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('contracts/?statut=RESERVE');
      setReservations(res.data.results || res.data || []);
    } catch (e) {
      console.error('Reservations error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReservations();
    setRefreshing(false);
  };

  const handleActivate = async (item) => {
    Alert.alert(
      'Activer la réservation',
      `Passer la réservation de ${item.client_nom || item.client} en contrat actif ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Activer', onPress: async () => {
          setActivating(item.id);
          try {
            await api.patch(`contracts/${item.id}/`, {
              statut: 'EN_COURS',
              km_sortie: item.km_sortie || 0,
              carburant_sortie: item.carburant_sortie || '4/8',
            });
            fetchReservations();
            Alert.alert('Succès', 'Réservation activée');
          } catch (e) {
            Alert.alert('Erreur', e.response?.data?.detail || 'Erreur');
          } finally {
            setActivating(null);
          }
        }},
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.clientName}>{item.client_nom || item.client}</Text>
          <Text style={styles.vehicleText}>{item.vehicule_matricule || item.vehicule}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Réservation</Text>
        </View>
      </View>
      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>Du</Text>
        <Text style={styles.dateValue}>{item.date_sortie?.slice(0, 10)}</Text>
        <Text style={styles.dateLabel}>au</Text>
        <Text style={styles.dateValue}>{item.date_retour_prevue?.slice(0, 10)}</Text>
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
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        data={reservations}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />}
        ListEmptyComponent={(
          <Text style={styles.empty}>Aucune réservation en attente.</Text>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('ReservationForm', {})}>
        <MaterialIcons name="add" size={28} color={theme.colors.onPrimary} />
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
  card: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
    borderWidth: 1,
    borderColor: 'rgba(197,197,211,0.1)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  clientName: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.md, color: theme.colors.onSurface },
  vehicleText: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  statusBadge: { backgroundColor: theme.colors.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: theme.borderRadius.full, alignSelf: 'flex-start' },
  statusText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.xs, color: theme.colors.primary },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, marginBottom: theme.spacing.md },
  dateLabel: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.xs, color: theme.colors.onSurfaceVariant },
  dateValue: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.onSurface },
  actionRow: { flexDirection: 'row', gap: theme.spacing.md },
  receiptButton: {
    flex: 1,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  receiptButtonText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.primary },
  activateButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    alignItems: 'center',
  },
  activateText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.onPrimary },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: theme.colors.primary, width: 56, height: 56,
    borderRadius: theme.borderRadius.xl, justifyContent: 'center', alignItems: 'center',
    ...theme.shadow.card,
  },
  fabText: { fontSize: 28, color: theme.colors.onPrimary, marginTop: -2 },
  empty: { textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xl, fontFamily: theme.fonts.body, fontSize: theme.fontSize.md },
});
