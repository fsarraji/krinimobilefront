import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api';
import theme from '../theme';

const STATUS_META = {
  PENDING: { label: 'En attente', color: theme.colors.warning, icon: 'hourglass-top' },
  CONFIRMED: { label: 'Confirmée', color: theme.colors.success, icon: 'check-circle' },
  CANCELLED: { label: 'Annulée', color: theme.colors.error, icon: 'cancel' },
};

export default function ClientReservationsScreen({ navigation }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get('reservations/')
      .then((r) => setReservations(r.data.results || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleCancel = (id) => {
    Alert.alert('Annuler la réservation', 'Voulez-vous vraiment annuler cette réservation ?', [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui, annuler',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.patch(`reservations/${id}/`, { statut: 'CANCELLED' });
            load();
          } catch (e) {
            Alert.alert('Erreur', 'Impossible d\'annuler cette réservation.');
          }
        },
      },
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
          <TouchableOpacity style={styles.cancelButton} onPress={() => handleCancel(item.id)} activeOpacity={0.8}>
            <MaterialIcons name="cancel" size={18} color={theme.colors.error} />
            <Text style={styles.cancelText}>Annuler la réservation</Text>
          </TouchableOpacity>
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
      <FlatList
        data={reservations}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
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
  vehicleMeta: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  cardBody: { marginTop: theme.spacing.md, gap: theme.spacing.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  infoValue: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.onSurface },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingHorizontal: theme.spacing.sm, paddingVertical: 4, borderRadius: theme.borderRadius.full, marginTop: theme.spacing.xs },
  statusText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm },
  cancelButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.md, paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(197,197,211,0.15)' },
  cancelText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.error },
  emptyBox: { alignItems: 'center', paddingTop: theme.spacing.xl * 2, paddingHorizontal: theme.spacing.lg },
  emptyTitle: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.lg, color: theme.colors.onSurface, marginTop: theme.spacing.md },
  emptyText: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: theme.spacing.sm, lineHeight: 20 },
  emptyButton: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, paddingVertical: 12, paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg },
  emptyButtonText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onPrimary },
});
