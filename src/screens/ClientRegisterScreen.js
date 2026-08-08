import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';
import DateField from '../components/DateField';

export default function ClientRegisterScreen({ navigation, route }) {
  const { login } = useAuth();
  const [form, setForm] = useState({
    nom: '', prenom: '', telephone: '', email: '',
    cin_passport: '', date_expiration_cin: '', nationalite: '', sexe: '',
    permis_conduite: '', date_delivrance_permis: '', adresse: '',
    ville: '', pays: '',
    password: '', password2: '',
  });
  const [scans, setScans] = useState({ cin: null, permis: null });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const result = route.params?.scanResult;
    if (result?.docType && result?.uri) {
      setScans(s => ({ ...s, [result.docType]: result.uri }));
      navigation.setParams({ scanResult: undefined });
    }
  }, [route.params?.scanResult]);

  const set = (key) => (v) => setForm(f => ({ ...f, [key]: v }));

  const handleRegister = async () => {
    const required = ['nom', 'prenom', 'telephone', 'cin_passport', 'permis_conduite', 'adresse', 'password'];
    const missing = required.find(k => !form[k].trim());
    if (missing) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (form.password !== form.password2) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k !== 'password2' && v && String(v).trim()) fd.append(k, String(v).trim());
      });
      const toFile = (uri) => ({ uri, name: `scan_${Date.now()}.jpg`, type: 'image/jpeg' });
      if (scans.cin) fd.append('scan_cin', toFile(scans.cin));
      if (scans.permis) fd.append('scan_permis', toFile(scans.permis));

      await api.post('clients/register/', fd);
      const username = (form.email || form.telephone).trim();
      await login(username, form.password);
    } catch (e) {
      console.log('REGISTER ERROR', e.response?.status, JSON.stringify(e.response?.data, null, 2), e.message);
      const data = e.response?.data;
      const fields = data && typeof data === 'object' ? Object.values(data).flat().join('\n') : '';
      Alert.alert('Erreur', fields || e.response?.data?.detail || 'Inscription impossible.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>VOS COORDONNÉES</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Prénom *</Text>
            <TextInput style={styles.input} value={form.prenom} onChangeText={set('prenom')} placeholder="Prénom" placeholderTextColor={theme.colors.onSurfaceVariant} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Nom *</Text>
            <TextInput style={styles.input} value={form.nom} onChangeText={set('nom')} placeholder="Nom" placeholderTextColor={theme.colors.onSurfaceVariant} />
          </View>
        </View>
        <Text style={styles.label}>Téléphone *</Text>
        <TextInput style={styles.input} value={form.telephone} onChangeText={set('telephone')} keyboardType="phone-pad" placeholder="06 XX XX XX XX" placeholderTextColor={theme.colors.onSurfaceVariant} />
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" placeholder="exemple@email.com" placeholderTextColor={theme.colors.onSurfaceVariant} />

        <Text style={styles.sectionLabel}>PIÈCES D'IDENTITÉ</Text>
        <Text style={styles.label}>CIN / Passeport *</Text>
        <TextInput style={styles.input} value={form.cin_passport} onChangeText={set('cin_passport')} placeholder="AB123456" placeholderTextColor={theme.colors.onSurfaceVariant} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <DateField label="Expiration CIN" value={form.date_expiration_cin} onChange={set('date_expiration_cin')} minimumDate={new Date()} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Nationalité</Text>
            <TextInput style={styles.input} value={form.nationalite} onChangeText={set('nationalite')} placeholder="Marocaine" placeholderTextColor={theme.colors.onSurfaceVariant} />
          </View>
        </View>
        <Text style={styles.label}>Sexe</Text>
        <View style={styles.row}>
          {['HOMME', 'FEMME'].map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.sexeOption, form.sexe === s && styles.sexeOptionActive]}
              onPress={() => set('sexe')(s)}
            >
              <Text style={[styles.sexeText, form.sexe === s && styles.sexeTextActive]}>
                {s === 'HOMME' ? 'Homme' : 'Femme'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Numéro du permis *</Text>
        <TextInput style={styles.input} value={form.permis_conduite} onChangeText={set('permis_conduite')} placeholder="Numéro de permis" placeholderTextColor={theme.colors.onSurfaceVariant} />
        <DateField label="Date de délivrance du permis" value={form.date_delivrance_permis} onChange={set('date_delivrance_permis')} maximumDate={new Date()} />

        <Text style={styles.label}>Adresse *</Text>
        <TextInput style={[styles.input, styles.textArea]} value={form.adresse} onChangeText={set('adresse')} multiline numberOfLines={3} placeholder="Adresse complète" placeholderTextColor={theme.colors.onSurfaceVariant} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Ville</Text>
            <TextInput style={styles.input} value={form.ville} onChangeText={set('ville')} placeholder="Casablanca" placeholderTextColor={theme.colors.onSurfaceVariant} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Pays</Text>
            <TextInput style={styles.input} value={form.pays} onChangeText={set('pays')} placeholder="Maroc" placeholderTextColor={theme.colors.onSurfaceVariant} />
          </View>
        </View>

        <Text style={styles.sectionLabel}>SCANS DES DOCUMENTS (optionnel)</Text>
        <ScanCard
          label="CIN / Passeport"
          uri={scans.cin}
          onScan={() => navigation.navigate('DocumentScan', { docType: 'cin', title: 'CIN / Passeport' })}
          onRemove={() => setScans(s => ({ ...s, cin: null }))}
        />
        <ScanCard
          label="Permis de conduire"
          uri={scans.permis}
          onScan={() => navigation.navigate('DocumentScan', { docType: 'permis', title: 'Permis de conduire' })}
          onRemove={() => setScans(s => ({ ...s, permis: null }))}
        />

        <Text style={styles.sectionLabel}>SÉCURITÉ</Text>
        <Text style={styles.label}>Mot de passe *</Text>
        <TextInput style={styles.input} value={form.password} onChangeText={set('password')} secureTextEntry placeholder="6 caractères minimum" placeholderTextColor={theme.colors.onSurfaceVariant} />
        <Text style={styles.label}>Confirmer le mot de passe *</Text>
        <TextInput style={styles.input} value={form.password2} onChangeText={set('password2')} secureTextEntry placeholder="Retapez le mot de passe" placeholderTextColor={theme.colors.onSurfaceVariant} />

        <TouchableOpacity style={styles.saveButton} onPress={handleRegister} disabled={saving} activeOpacity={0.85}>
          {saving ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={styles.saveText}>Créer mon compte</Text>}
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
  sectionLabel: {
    fontFamily: theme.fonts.label,
    fontSize: theme.fontSize.xs,
    letterSpacing: 0.8,
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  label: { fontFamily: theme.fonts.bodyMedium, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, marginBottom: 6, marginTop: theme.spacing.sm },
  input: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    fontSize: theme.fontSize.md,
    color: theme.colors.onSurface,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  dateField: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateValue: { fontSize: theme.fontSize.md, color: theme.colors.onSurface },
  datePlaceholder: { color: theme.colors.onSurfaceVariant },
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  sexeOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#dadce0',
    backgroundColor: theme.colors.surfaceContainerLowest,
    alignItems: 'center',
  },
  sexeOptionActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryContainer || '#e8def8' },
  sexeText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onSurfaceVariant },
  sexeTextActive: { color: theme.colors.primary },
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
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    ...theme.shadow.card,
  },
  saveText: { color: theme.colors.onPrimary, fontSize: theme.fontSize.lg, fontFamily: theme.fonts.bodySemibold },
});
