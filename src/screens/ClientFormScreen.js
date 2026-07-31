import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Switch, Image } from 'react-native';
import api from '../api';
import theme from '../theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function ClientFormScreen({ route, navigation }) {
  const clientId = route.params?.id;
  const isEdit = !!clientId;

  const [form, setForm] = useState({
    nom: '', prenom: '', telephone: '', email: '', cin_passport: '',
    permis_conduite: '', nationalite: '', adresse: '',
    liste_noire: false, remarques: '',
  });
  const [scans, setScans] = useState({ cin: null, permis: null });
  const [existingScans, setExistingScans] = useState({ cin: null, permis: null });
  const [removedScans, setRemovedScans] = useState({ cin: false, permis: false });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      api.get(`clients/${clientId}/`).then(r => {
        const c = r.data;
        setForm({
          nom: c.nom || '', prenom: c.prenom || '', telephone: c.telephone || '', email: c.email || '',
          cin_passport: c.cin_passport || '',
          permis_conduite: c.permis_conduite || '',
          nationalite: c.nationalite || '', adresse: c.adresse || '',
          liste_noire: c.liste_noire || false, remarques: c.remarques || '',
        });
        setExistingScans({ cin: c.scan_cin || null, permis: c.scan_permis || null });
      }).catch(() => Alert.alert('Erreur', 'Impossible de charger le client')).finally(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    const result = route.params?.scanResult;
    if (result?.docType && result?.uri) {
      setScans(s => ({ ...s, [result.docType]: result.uri }));
      setRemovedScans(r => ({ ...r, [result.docType]: false }));
      navigation.setParams({ scanResult: undefined });
    }
  }, [route.params?.scanResult]);

  const removeScan = (docType) => {
    if (scans[docType]) {
      setScans(s => ({ ...s, [docType]: null }));
    } else if (existingScans[docType]) {
      setExistingScans(e => ({ ...e, [docType]: null }));
      setRemovedScans(r => ({ ...r, [docType]: true }));
    }
  };

  const handleSave = async () => {
    if (!form.nom || !form.prenom || !form.telephone || !form.cin_passport) {
      Alert.alert('Erreur', 'Nom, prénom, téléphone et CIN sont requis');
      return;
    }
    setSaving(true);
    try {
      const hasNewScan = !!scans.cin || !!scans.permis;

      if (isEdit && (removedScans.cin || removedScans.permis)) {
        const clearPayload = {};
        if (removedScans.cin) clearPayload.scan_cin = null;
        if (removedScans.permis) clearPayload.scan_permis = null;
        await api.patch(`clients/${clientId}/`, clearPayload);
      }

      if (hasNewScan) {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => {
          if (v !== null && v !== undefined) fd.append(k, v);
        });
        const toFile = (uri) => ({ uri, name: `scan_${Date.now()}.jpg`, type: 'image/jpeg' });
        if (scans.cin) fd.append('scan_cin', toFile(scans.cin));
        if (scans.permis) fd.append('scan_permis', toFile(scans.permis));
        if (isEdit) await api.patch(`clients/${clientId}/`, fd);
        else await api.post('clients/', fd);
      } else if (isEdit) {
        await api.patch(`clients/${clientId}/`, form);
      } else {
        await api.post('clients/', form);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.detail || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={theme.colors.primary} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Nom *</Text>
        <TextInput style={styles.input} value={form.nom} onChangeText={v => setForm(f => ({ ...f, nom: v }))} placeholder="Nom de famille" placeholderTextColor={theme.colors.onSurfaceVariant} />

        <Text style={styles.label}>Prénom *</Text>
        <TextInput style={styles.input} value={form.prenom} onChangeText={v => setForm(f => ({ ...f, prenom: v }))} placeholder="Prénom" placeholderTextColor={theme.colors.onSurfaceVariant} />

        <Text style={styles.label}>Téléphone *</Text>
        <TextInput style={styles.input} value={form.telephone} onChangeText={v => setForm(f => ({ ...f, telephone: v }))} keyboardType="phone-pad" placeholder="+212 6XX XX XX XX" placeholderTextColor={theme.colors.onSurfaceVariant} />

        <Text style={styles.label}>Adresse Email</Text>
        <TextInput style={styles.input} value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} keyboardType="email-address" autoCapitalize="none" placeholder="email@example.com" placeholderTextColor={theme.colors.onSurfaceVariant} />

        <Text style={styles.label}>CIN / Passeport *</Text>
        <TextInput style={styles.input} value={form.cin_passport} onChangeText={v => setForm(f => ({ ...f, cin_passport: v }))} placeholder="AB123456" placeholderTextColor={theme.colors.onSurfaceVariant} />

        <Text style={styles.label}>Numéro du Permis de Conduire</Text>
        <TextInput style={styles.input} value={form.permis_conduite} onChangeText={v => setForm(f => ({ ...f, permis_conduite: v }))} placeholder="Numéro de permis" placeholderTextColor={theme.colors.onSurfaceVariant} />

        <Text style={styles.sectionTitle}>Scans des pièces d'identité</Text>
        <Text style={styles.sectionHint}>Photographiez la pièce avec la caméra du téléphone</Text>

        <ScanCard
          label="CIN / Passeport"
          uri={scans.cin || existingScans.cin}
          onScan={() => navigation.navigate('DocumentScan', { docType: 'cin', title: 'CIN / Passeport' })}
          onRemove={() => removeScan('cin')}
        />

        <ScanCard
          label="Permis de conduire"
          uri={scans.permis || existingScans.permis}
          onScan={() => navigation.navigate('DocumentScan', { docType: 'permis', title: 'Permis de conduire' })}
          onRemove={() => removeScan('permis')}
        />

        <Text style={styles.label}>Nationalité</Text>
        <TextInput style={styles.input} value={form.nationalite} onChangeText={v => setForm(f => ({ ...f, nationalite: v }))} placeholder="Marocaine" placeholderTextColor={theme.colors.onSurfaceVariant} />

        <Text style={styles.label}>Adresse Résidentielle</Text>
        <TextInput style={[styles.input, styles.textArea]} value={form.adresse} onChangeText={v => setForm(f => ({ ...f, adresse: v }))} multiline numberOfLines={3} placeholder="Adresse complète" placeholderTextColor={theme.colors.onSurfaceVariant} />

        <Text style={styles.label}>Notes de gestion interne</Text>
        <TextInput style={[styles.input, styles.textArea]} value={form.remarques} onChangeText={v => setForm(f => ({ ...f, remarques: v }))} multiline numberOfLines={3} placeholder="Notes diverses" placeholderTextColor={theme.colors.onSurfaceVariant} />

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Liste noire</Text>
            <Switch
              value={form.liste_noire}
              onValueChange={v => setForm(f => ({ ...f, liste_noire: v }))}
              trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.error }}
              thumbColor={form.liste_noire ? theme.colors.surfaceContainerLowest : '#f4f3f4'}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={styles.saveText}>{isEdit ? 'Mettre à jour' : 'Ajouter le client'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ScanCard({ label, uri, onScan, onRemove }) {
  return (
    <View style={styles.scanCard}>
      <View style={styles.scanRow}>
        <View style={styles.scanInfo}>
          <Text style={styles.scanLabel}>{label}</Text>
          <Text style={styles.scanHint}>{uri ? 'Document scanné' : 'Aucun document'}</Text>
        </View>
        <TouchableOpacity style={styles.scanButton} onPress={onScan}>
          <MaterialIcons name="photo-camera" size={18} color={theme.colors.primary} />
          <Text style={styles.scanButtonText}>{uri ? 'Refaire' : 'Scanner'}</Text>
        </TouchableOpacity>
      </View>
      {uri ? (
        <View style={styles.thumbRow}>
          <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
          <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
            <MaterialIcons name="delete-outline" size={18} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  label: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.body,
    color: theme.colors.onSurface,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.onSurface,
    marginTop: theme.spacing.lg,
  },
  sectionHint: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.body,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  scanCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    ...theme.shadow.card,
    borderWidth: 1,
    borderColor: 'rgba(197,197,211,0.1)',
  },
  scanRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scanInfo: { flex: 1, marginRight: theme.spacing.md },
  scanLabel: { fontSize: theme.fontSize.md, fontFamily: theme.fonts.bodySemibold, color: theme.colors.onSurface },
  scanHint: { fontSize: theme.fontSize.sm, fontFamily: theme.fonts.body, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  scanButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: theme.colors.primary, borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md, paddingVertical: 8,
  },
  scanButtonText: { color: theme.colors.primary, fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm },
  thumbRow: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.md },
  thumb: { width: 88, height: 56, borderRadius: theme.borderRadius.sm, backgroundColor: theme.colors.surfaceContainerHighest },
  removeButton: { marginLeft: theme.spacing.sm, padding: 4 },
  card: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    ...theme.shadow.card,
    borderWidth: 1,
    borderColor: 'rgba(197,197,211,0.1)',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.bodySemibold,
    color: theme.colors.onSurface,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  saveText: { color: theme.colors.onPrimary, fontSize: theme.fontSize.lg, fontFamily: theme.fonts.bodySemibold },
});
