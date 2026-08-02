import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import api from '../api';
import theme from '../theme';

export default function ReservationFormScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [vehicles, setVehicles] = useState([]);
  const [clients, setClients] = useState([]);
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({
    vehicle: '', client: '', date_sortie: '', date_retour_prevue: '',
    prix_par_jour: '', caution: '', km_sortie: '', carburant_sortie: '4/8',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('vehicles/', { params: { page_size: 500 } }).then(r => setVehicles(r.data.results || r.data || [])),
      api.get('clients/', { params: { page_size: 500 } }).then(r => setClients(r.data.results || r.data || [])),
      api.get('agency/settings/').then(r => setSettings(r.data)).catch(() => {}),
    ]).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!form.vehicle || !form.client) {
      Alert.alert('Erreur', 'Véhicule et client requis');
      return;
    }
    setSaving(true);
    try {
      await api.post('contracts/', {
        vehicle: parseInt(form.vehicle), client: parseInt(form.client),
        date_sortie: form.date_sortie || new Date().toISOString(),
        date_retour_prevue: form.date_retour_prevue || new Date().toISOString(),
        prix_par_jour: parseFloat(form.prix_par_jour) || 0,
        caution: parseFloat(form.caution) || settings?.caution_montant || 0,
        km_sortie: parseInt(form.km_sortie) || 0,
        carburant_sortie: form.carburant_sortie,
        statut: 'RESERVE',
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.detail || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.stepIndicator}>
        {[1, 2, 3].map(s => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
              <Text style={[styles.stepNumber, step >= s && styles.stepNumberActive]}>{s}</Text>
            </View>
            {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
          </View>
        ))}
      </View>
      <Text style={styles.stepLabel}>
        {step === 1 ? 'Dates de location' : step === 2 ? 'Choix du véhicule' : 'Client et validation'}
      </Text>

      {step === 1 && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sélectionner les dates</Text>
            <Text style={styles.label}>Date de sortie</Text>
            <TextInput style={styles.input} placeholder="YYYY-MM-DD HH:MM" placeholderTextColor={theme.colors.onSurfaceVariant} value={form.date_sortie} onChangeText={v => setForm(f => ({ ...f, date_sortie: v }))} />
            <Text style={styles.label}>Date retour prévue</Text>
            <TextInput style={styles.input} placeholder="YYYY-MM-DD HH:MM" placeholderTextColor={theme.colors.onSurfaceVariant} value={form.date_retour_prevue} onChangeText={v => setForm(f => ({ ...f, date_retour_prevue: v }))} />
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(2)}>
            <Text style={styles.primaryButtonText}>Suivant</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 2 && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sélectionner un véhicule</Text>
            <View style={styles.chipRow}>
              {vehicles.filter(v => v.statut === 'Available').map(v => (
                <TouchableOpacity key={v.id} style={[styles.chip, form.vehicle == v.id && styles.chipSelected]} onPress={() => setForm(f => ({ ...f, vehicle: v.id, prix_par_jour: String(v.prix_par_jour) }))}>
                  <Text style={[styles.chipText, form.vehicle == v.id && styles.chipTextSelected]}>{v.matricule} - {v.prix_par_jour} DH/j</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(3)}>
            <Text style={styles.primaryButtonText}>Suivant</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 3 && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sélectionner un client</Text>
            <View style={styles.chipRow}>
              {clients.map(c => (
                <TouchableOpacity key={c.id} style={[styles.chip, form.client == c.id && styles.chipSelected]} onPress={() => setForm(f => ({ ...f, client: c.id }))}>
                  <Text style={[styles.chipText, form.client == c.id && styles.chipTextSelected]}>{c.prenom} {c.nom} - {c.telephone}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dépôt de garantie</Text>
            <Text style={styles.label}>Caution (DH)</Text>
            <TextInput style={styles.input} value={form.caution} onChangeText={v => setForm(f => ({ ...f, caution: v }))} keyboardType="numeric" placeholder={String(settings?.caution_montant || '')} placeholderTextColor={theme.colors.onSurfaceVariant} />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleCreate} disabled={saving}>
            {saving ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={styles.primaryButtonText}>Créer la réservation</Text>}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.surfaceContainerHighest, justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: theme.colors.primary },
  stepNumber: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  stepNumberActive: { color: theme.colors.onPrimary },
  stepLine: { width: 40, height: 2, backgroundColor: theme.colors.surfaceContainerHighest, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: theme.colors.primary },
  stepLabel: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.lg, color: theme.colors.onSurface, textAlign: 'center', marginBottom: theme.spacing.lg },
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
  label: { fontFamily: theme.fonts.bodyMedium, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, marginBottom: 6, marginTop: theme.spacing.sm },
  input: { backgroundColor: theme.colors.surfaceContainerLowest, borderWidth: 1, borderColor: '#dadce0', borderRadius: theme.borderRadius.sm, padding: 12, fontSize: theme.fontSize.md, color: theme.colors.onSurface, marginBottom: theme.spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: '#dadce0', backgroundColor: theme.colors.surfaceContainerLowest, marginBottom: 4 },
  chipSelected: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  chipText: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  chipTextSelected: { fontFamily: theme.fonts.bodySemibold, color: theme.colors.primary },
  primaryButton: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, padding: 14, alignItems: 'center', marginTop: theme.spacing.sm },
  primaryButtonText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onPrimary },
});
