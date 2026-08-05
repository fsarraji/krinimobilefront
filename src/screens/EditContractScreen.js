import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import api from '../api';
import Select2 from '../components/Select2';
import theme from '../theme';
import { printContract } from '../printUtils';
import { MaterialIcons } from '@expo/vector-icons';

export default function EditContractScreen({ route, navigation }) {
  const { id } = route.params;
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState({ amount: '', payment_method: 'Espèce', reference: '' });
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [printing, setPrinting] = useState(false);

  const handlePrint = (withCachet) => {
    setPrinting(true);
    printContract(id, withCachet, (status) => {
      if (status === 'READY' || status === 'ERROR') setPrinting(false);
    });
  };

  useEffect(() => {
    api.get(`contracts/${id}/`).then(r => setContract(r.data)).catch(e => Alert.alert('Erreur', e.response?.data?.detail || 'Impossible de charger le contrat')).finally(() => setLoading(false));
  }, []);

  const handleAddPayment = async () => {
    if (!payment.amount || parseFloat(payment.amount) <= 0) {
      Alert.alert('Erreur', 'Montant invalide');
      return;
    }
    setSavingPayment(true);
    try {
      await api.post('payments/', {
        contract: id, amount: parseFloat(payment.amount),
        payment_method: payment.payment_method, reference: payment.reference,
      });
      setPayment({ amount: '', payment_method: 'Espèce', reference: '' });
      const r = await api.get(`contracts/${id}/`);
      setContract(r.data);
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.detail || 'Erreur');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleStatusChange = async (statut) => {
    setSavingStatus(true);
    try {
      await api.patch(`contracts/${id}/`, { statut });
      const r = await api.get(`contracts/${id}/`);
      setContract(r.data);
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.detail || 'Erreur');
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={theme.colors.primary} />;
  if (!contract) return <View style={styles.container}><Text style={styles.empty}>Contrat introuvable</Text></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contrat #{contract.id}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Client</Text>
          <Text style={styles.infoValue}>{contract.client_prenom} {contract.client_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Véhicule</Text>
          <Text style={styles.infoValue}>{contract.vehicle_matricule || contract.vehicule_matricule || contract.vehicule}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Statut</Text>
          <Text style={styles.infoValue}>{contract.statut}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total</Text>
          <Text style={styles.infoValue}>{contract.montant_total} DH</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Payé</Text>
          <Text style={styles.infoValue}>{contract.montant_paye} DH</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Reste</Text>
          <Text style={[styles.infoValue, { color: theme.colors.error, fontFamily: theme.fonts.bodySemibold }]}>{contract.reste_a_payer} DH</Text>
        </View>
      </View>

      <View style={styles.printRow}>
        <TouchableOpacity style={styles.printButton} onPress={() => handlePrint(false)} disabled={printing}>
          <MaterialIcons name="picture-as-pdf" size={16} color={theme.colors.primary} />
          <Text style={styles.printButtonText}>PDF Simple</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.printButton} onPress={() => handlePrint(true)} disabled={printing}>
          <MaterialIcons name="picture-as-pdf" size={16} color={theme.colors.primary} />
          <Text style={styles.printButtonText}>PDF Cachet</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statut du Contrat</Text>
        <Select2
          value={contract.statut}
          options={[
            { value: 'RESERVE', label: 'Réservé' },
            { value: 'EN_COURS', label: 'En cours' },
            { value: 'TERMINE', label: 'Terminé' },
            { value: 'ANNULE', label: 'Annulé' },
          ]}
          onSelect={handleStatusChange}
          disabled={savingStatus}
          searchable
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="payments" size={20} color={theme.colors.onSurface} />
          <Text style={styles.sectionTitle}>Ajouter un paiement</Text>
        </View>
        <TextInput style={styles.input} placeholder="Montant (DH)" placeholderTextColor={theme.colors.onSurfaceVariant} value={payment.amount} onChangeText={v => setPayment(p => ({ ...p, amount: v }))} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Référence (optionnel)" placeholderTextColor={theme.colors.onSurfaceVariant} value={payment.reference} onChangeText={v => setPayment(p => ({ ...p, reference: v }))} />
        <Select2
          label="Méthode de paiement"
          value={payment.payment_method}
          options={['Espèce', 'Chèque', 'Virement', 'TPE'].map(m => ({ value: m, label: m }))}
          onSelect={(m) => setPayment(p => ({ ...p, payment_method: m }))}
          searchable
        />
        <TouchableOpacity style={styles.primaryButton} onPress={handleAddPayment} disabled={savingPayment}>
          {savingPayment ? <ActivityIndicator color={theme.colors.onPrimary} /> : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><MaterialIcons name="save" size={16} color={theme.colors.onPrimary} /><Text style={styles.primaryButtonText}>Ajouter le paiement</Text></View>}
        </TouchableOpacity>
      </View>

      {contract.payments?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paiements ({contract.payments.length})</Text>
          {contract.payments.map((p, i) => (
            <View key={i} style={styles.paymentRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentAmount}>{p.amount} DH</Text>
                <Text style={styles.paymentMeta}>{p.payment_method}</Text>
              </View>
              <Text style={styles.paymentDate}>{p.payment_date?.slice(0, 10)}</Text>
            </View>
          ))}
        </View>
      )}
      </ScrollView>
      {printing && (
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
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: { color: '#fff', marginTop: theme.spacing.md, fontFamily: theme.fonts.bodyMedium, fontSize: theme.fontSize.md },
  card: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
    borderWidth: 1,
    borderColor: 'rgba(197,197,211,0.1)',
  },
  cardTitle: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.lg, color: theme.colors.onSurface, marginBottom: theme.spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.spacing.sm },
  infoLabel: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  infoValue: { fontFamily: theme.fonts.bodyMedium, fontSize: theme.fontSize.sm, color: theme.colors.onSurface },
  printRow: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.lg },
  printButton: {
    flex: 1,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  printButtonText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.primary },
  section: { marginBottom: theme.spacing.lg },
  sectionTitle: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.md, color: theme.colors.onSurface, marginBottom: theme.spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    paddingBottom: 12,
    marginBottom: 16,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1, borderColor: '#dadce0',
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  chipSelected: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  chipText: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  chipTextSelected: { fontFamily: theme.fonts.bodySemibold, color: theme.colors.primary },
  input: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1, borderColor: '#dadce0', borderRadius: theme.borderRadius.sm,
    padding: 12, fontSize: theme.fontSize.md, color: theme.colors.onSurface,
    marginBottom: theme.spacing.sm,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  primaryButtonText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onPrimary },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainerLowest,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.card,
  },
  paymentAmount: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onSurface },
  paymentMeta: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.xs, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  paymentDate: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  empty: { textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xl, fontFamily: theme.fonts.body, fontSize: theme.fontSize.md },
});
