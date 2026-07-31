import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Switch } from 'react-native';
import api from '../api';
import theme from '../theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen({ navigation }) {
  const { isOwner, isSuperAdmin } = useAuth();
  const canEdit = isOwner || isSuperAdmin;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    caution_active: true,
    caution_montant: '1500',
    km_extra_active: true,
    km_par_jour: '250',
    km_tarif_extra_defaut: '1.50',
  });

  useEffect(() => {
    api.get('agency/settings/').then(r => {
      const d = r.data;
      setForm({
        caution_active: d.caution_active ?? true,
        caution_montant: String(d.caution_montant || '1500'),
        km_extra_active: d.km_extra_active ?? true,
        km_par_jour: String(d.km_par_jour || '250'),
        km_tarif_extra_defaut: String(d.km_tarif_extra_defaut || '1.50'),
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('agency/settings/', {
        caution_active: form.caution_active,
        caution_montant: parseFloat(form.caution_montant) || 0,
        km_extra_active: form.km_extra_active,
        km_par_jour: parseInt(form.km_par_jour) || 0,
        km_tarif_extra_defaut: parseFloat(form.km_tarif_extra_defaut) || 0,
      });
      Alert.alert('Succès', 'Paramètres mis à jour');
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.detail || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={theme.colors.primary} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
            <MaterialIcons name="security" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Gestion de la Caution</Text>
          </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Activer la caution</Text>
          <Switch
            value={form.caution_active}
            onValueChange={v => setForm(f => ({ ...f, caution_active: v }))}
            disabled={!canEdit}
            trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.primaryLight }}
            thumbColor={form.caution_active ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
        </View>
        {form.caution_active && (
          <View style={styles.fieldRow}>
            <Text style={styles.label}>Montant caution (DH)</Text>
            <TextInput
              style={styles.input}
              value={form.caution_montant}
              onChangeText={v => setForm(f => ({ ...f, caution_montant: v }))}
              keyboardType="numeric"
              editable={canEdit}
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
            <MaterialIcons name="speed" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Kilométrage</Text>
          </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Activer les extras km</Text>
          <Switch
            value={form.km_extra_active}
            onValueChange={v => setForm(f => ({ ...f, km_extra_active: v }))}
            disabled={!canEdit}
            trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.primaryLight }}
            thumbColor={form.km_extra_active ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.label}>KM par jour</Text>
          <TextInput
            style={styles.input}
            value={form.km_par_jour}
            onChangeText={v => setForm(f => ({ ...f, km_par_jour: v }))}
            keyboardType="numeric"
            editable={canEdit}
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
        </View>
        <View style={styles.fieldRow}>
          <Text style={styles.label}>Tarif extra/km (DH)</Text>
          <TextInput
            style={styles.input}
            value={form.km_tarif_extra_defaut}
            onChangeText={v => setForm(f => ({ ...f, km_tarif_extra_defaut: v }))}
            keyboardType="numeric"
            editable={canEdit}
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="verified" size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Branding</Text>
        </View>
      </View>

      {canEdit && (
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={styles.saveText}>Enregistrer</Text>}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
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
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  switchLabel: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.md, color: theme.colors.onSurface, flex: 1 },
  fieldRow: { marginBottom: theme.spacing.sm },
  label: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.xs },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1, borderColor: '#dadce0', borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md, fontSize: theme.fontSize.md, fontFamily: theme.fonts.body,
    color: theme.colors.onSurface,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    paddingBottom: 12,
    marginBottom: 16,
  },
  sectionTitle: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.lg, color: theme.colors.onSurface },
  saveText: { fontFamily: theme.fonts.bodySemibold, color: theme.colors.onPrimary, fontSize: theme.fontSize.md },
});
