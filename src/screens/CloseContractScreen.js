import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import api from '../api';
import theme from '../theme';
import FuelGaugeSelector from '../components/FuelGaugeSelector';
import DateField from '../components/DateField';
import { MaterialIcons } from '@expo/vector-icons';

const accessories = [
  { key: 'roue_secours_retour', label: 'Roue de secours' },
  { key: 'cric_retour', label: 'Cric' },
  { key: 'manivelle_retour', label: 'Manivelle' },
  { key: 'gilet_retour', label: 'Gilet de sécurité' },
  { key: 'triangle_retour', label: 'Triangle' },
  { key: 'extincteur_retour', label: 'Extincteur' },
  { key: 'papiers_retour', label: 'Papiers du véhicule' },
  { key: 'cles_retour', label: 'Clés' },
];

export default function CloseContractScreen({ route, navigation }) {
  const { id } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contract, setContract] = useState(null);
  const [form, setForm] = useState({
    km_retour: '',
    carburant_retour: '4/8',
    date_retour_effective: new Date().toISOString().slice(0, 10),
    degats_retour: '',
    payment_amount: '',
    payment_method: 'Espèce',
    roue_secours_retour: true,
    cric_retour: true,
    manivelle_retour: true,
    gilet_retour: true,
    triangle_retour: true,
    extincteur_retour: true,
    papiers_retour: true,
    cles_retour: true,
  });

  useEffect(() => {
    api.get(`contracts/${id}/`).then(r => {
      setContract(r.data);
      setForm(f => ({
        ...f,
        km_retour: String(r.data.km_sortie || ''),
        payment_amount: String(r.data.reste_a_payer || r.data.montant_total || ''),
      }));
    }).catch(() => Alert.alert('Erreur', 'Impossible de charger le contrat')).finally(() => setLoading(false));
  }, []);

  const handleClose = async () => {
    if (!form.km_retour) {
      Alert.alert('Erreur', 'Le kilométrage retour est requis');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        km_retour: parseInt(form.km_retour) || 0,
        carburant_retour: form.carburant_retour,
        date_retour_effective: form.date_retour_effective,
        degats_retour: form.degats_retour || '',
        payment_amount: parseFloat(form.payment_amount) || 0,
        payment_method: form.payment_method,
        accessories_retour: {
          roue_secours: form.roue_secours_retour,
          cric: form.cric_retour,
          manivelle: form.manivelle_retour,
          gilet: form.gilet_retour,
          triangle: form.triangle_retour,
          extincteur: form.extincteur_retour,
          papiers: form.papiers_retour,
          cles: form.cles_retour,
        },
        damages_retour: [],
      };
      await api.post(`contracts/${id}/return_vehicle/`, payload);
      Alert.alert('Succès', 'Contrat clôturé avec succès', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.detail || 'Erreur lors de la clôture');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={theme.colors.primary} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Clôture du contrat #{id}</Text>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="drive-eta" size={20} color={theme.colors.onSurface} />
          <Text style={styles.cardTitle}>Retour du véhicule</Text>
        </View>

          <DateField
            label="Date de retour effective"
            value={form.date_retour_effective}
            onChange={v => setForm(f => ({ ...f, date_retour_effective: v }))}
            maximumDate={new Date()}
          />

        <Text style={styles.label}>Kilométrage de retour *</Text>
        <TextInput style={styles.input} value={form.km_retour} onChangeText={v => setForm(f => ({ ...f, km_retour: v }))} keyboardType="numeric" placeholder="km" placeholderTextColor={theme.colors.onSurfaceVariant} />

        <Text style={styles.label}>Carburant de retour</Text>
        <FuelGaugeSelector value={form.carburant_retour} onChange={v => setForm(f => ({ ...f, carburant_retour: v }))} />

        <Text style={styles.label}>Dégâts de retour</Text>
        <TextInput style={[styles.input, styles.textArea]} value={form.degats_retour} onChangeText={v => setForm(f => ({ ...f, degats_retour: v }))} multiline numberOfLines={3} placeholder="Description des dégats éventuels..." placeholderTextColor={theme.colors.onSurfaceVariant} />
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="checklist" size={20} color={theme.colors.onSurface} />
          <Text style={styles.cardTitle}>Accessoires retour</Text>
        </View>
        {accessories.map(a => (
          <TouchableOpacity key={a.key} style={styles.accessoryRow} onPress={() => setForm(f => ({ ...f, [a.key]: !f[a.key] }))}>
            <View style={[styles.checkbox, form[a.key] && styles.checkboxChecked]}>
              {form[a.key] && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.accessoryLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="payments" size={20} color={theme.colors.onSurface} />
          <Text style={styles.cardTitle}>Paiement final</Text>
        </View>
        <TextInput style={styles.input} placeholder="Montant (DH)" placeholderTextColor={theme.colors.onSurfaceVariant} value={form.payment_amount} onChangeText={v => setForm(f => ({ ...f, payment_amount: v }))} keyboardType="numeric" />
        <View style={styles.chipRow}>
          {['Espèce', 'Chèque', 'Virement', 'TPE'].map(m => (
            <TouchableOpacity key={m} style={[styles.chip, form.payment_method === m && styles.chipSelected]} onPress={() => setForm(f => ({ ...f, payment_method: m }))}>
              <Text style={[styles.chipText, form.payment_method === m && styles.chipTextSelected]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleClose} disabled={saving}>
        {saving ? <ActivityIndicator color={theme.colors.onPrimary} /> : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><MaterialIcons name="lock" size={18} color={theme.colors.onPrimary} /><Text style={styles.primaryButtonText}>Clôturer le contrat</Text></View>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  pageTitle: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.xl, color: theme.colors.onSurface, marginBottom: theme.spacing.md },
  card: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
    borderWidth: 1,
    borderColor: 'rgba(197,197,211,0.1)',
  },
  cardTitle: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.md, color: theme.colors.onSurface, marginBottom: theme.spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    paddingBottom: 12,
    marginBottom: 16,
  },
  label: { fontFamily: theme.fonts.bodyMedium, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, marginBottom: 6, marginTop: theme.spacing.sm },
  input: { backgroundColor: theme.colors.surfaceContainerLowest, borderWidth: 1, borderColor: '#dadce0', borderRadius: theme.borderRadius.sm, padding: 12, fontSize: theme.fontSize.md, color: theme.colors.onSurface, marginBottom: 4 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: '#dadce0', backgroundColor: theme.colors.surfaceContainerLowest },
  chipSelected: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  chipText: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  chipTextSelected: { fontFamily: theme.fonts.bodySemibold, color: theme.colors.primary },
  accessoryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.sm },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: '#dadce0', justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.md },
  checkboxChecked: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  checkmark: { color: theme.colors.surfaceContainerLowest, fontSize: 13, fontWeight: '700' },
  accessoryLabel: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.md, color: theme.colors.onSurface },
  primaryButton: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, padding: 16, alignItems: 'center', marginTop: theme.spacing.md },
  primaryButtonText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onPrimary },
});
