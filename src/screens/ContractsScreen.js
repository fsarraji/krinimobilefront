import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import api from '../api';
import theme from '../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { printContract } from '../printUtils';
import LoadingSpinner from '../components/LoadingSpinner';
import { useData } from '../hooks/useData';

const statusColors = {
  RESERVE: theme.colors.statusReserve,
  EN_COURS: theme.colors.statusRented,
  TERMINE: theme.colors.statusAvailable,
  ANNULE: theme.colors.statusMaintenance,
};

const statusLabelColors = {
  RESERVE: theme.colors.primary,
  EN_COURS: '#e65100',
  TERMINE: '#2e7d32',
  ANNULE: '#c62828',
};

const statusLabels = {
  RESERVE: 'Réservation',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  ANNULE: 'Annulé',
};

export default function ContractsScreen({ navigation }) {
  const { data, loading, refreshing, refresh } = useData('contracts/');
  const contracts = data?.results || data || [];
  const [printingId, setPrintingId] = useState(null);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.clientName} numberOfLines={1}>{item.client_prenom} {item.client_name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[item.statut] || '#f5f5f5' }]}>
          <Text style={[styles.statusText, { color: statusLabelColors[item.statut] || theme.colors.onSurfaceVariant }]}>
            {statusLabels[item.statut] || item.statut}
          </Text>
        </View>
      </View>
      <Text style={styles.vehicleText}>{item.vehicle_matricule || item.vehicule_matricule || item.vehicule}</Text>
      <View style={styles.cardDateRow}>
        <Text style={styles.dateText}>{item.date_sortie?.slice(0, 10)}  {item.date_retour_prevue?.slice(0, 10)}</Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.totalLabel}>Montant</Text>
        <Text style={styles.priceText}>{item.montant_total} DH</Text>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.pdfButton} onPress={() => {
          setPrintingId(item.id);
          printContract(item.id, false, (status) => {
            if (status === 'READY' || status === 'ERROR') setPrintingId(null);
          });
        }}>
          <MaterialIcons name="picture-as-pdf" size={16} color={theme.colors.primary} />
          <Text style={styles.pdfButtonText}>PDF</Text>
        </TouchableOpacity>
        {item.statut === 'EN_COURS' && (
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.navigate('CloseContract', { id: item.id })}>
            <MaterialIcons name="lock" size={14} color={theme.colors.surfaceContainerLowest} />
            <Text style={styles.closeButtonText}>Clôturer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <FlatList
        data={contracts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.colors.primary} />}
        ListEmptyComponent={<Text style={styles.empty}>Aucun contrat enregistré.</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('ContractForm', {})}>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs },
  clientName: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.bodySemibold,
    color: theme.colors.onSurface,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.full },
  statusText: { fontSize: theme.fontSize.xs, fontFamily: theme.fonts.bodyMedium },
  vehicleText: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.body, color: theme.colors.onSurfaceVariant, marginBottom: 4 },
  cardDateRow: { marginBottom: 4 },
  dateText: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.body, color: theme.colors.outline },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  totalLabel: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.body, color: theme.colors.onSurfaceVariant },
  priceText: { fontSize: theme.fontSize.lg, fontFamily: theme.fonts.headlineBold, color: theme.colors.primary },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: theme.spacing.md },
  pdfButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  pdfButtonText: { color: theme.colors.primary, fontSize: theme.fontSize.sm, fontFamily: theme.fonts.bodyMedium },
  closeButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#2e7d32',
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: { color: theme.colors.surfaceContainerLowest, fontSize: theme.fontSize.sm, fontFamily: theme.fonts.bodySemibold },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: theme.colors.primary, width: 56, height: 56,
    borderRadius: theme.borderRadius.xl, justifyContent: 'center', alignItems: 'center',
    ...theme.shadow.card,
  },
  fabText: { fontSize: 28, color: theme.colors.onPrimary, marginTop: -2 },
  empty: { textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xl, fontFamily: theme.fonts.body, fontSize: theme.fontSize.md },
});
