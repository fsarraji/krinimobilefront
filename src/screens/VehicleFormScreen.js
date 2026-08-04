import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../api';
import theme from '../theme';
import { MaterialIcons } from '@expo/vector-icons';
import DateField from '../components/DateField';
import { resolveMediaUrl } from '../apiUrl';

export default function VehicleFormScreen({ route, navigation }) {
  const vehicleId = route.params?.id;
  const isEdit = !!vehicleId;

  const [form, setForm] = useState({
    matricule: '', marque: '', modele: '', annee: '', couleur: '', carburant: 'Diesel',
    kilometrage: '', prix_par_jour: '', statut: 'Available',
    chauffeur_disponible: false, date_assurance: '', date_visite_technique: '',
    prochain_vidange_km: '', tarif_km_extra: '',
  });
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageAsset, setImageAsset] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', "Autorisez l'accès à la galerie pour choisir une photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageAsset(result.assets[0]);
      setExistingImage(null);
    }
  };

  useEffect(() => {
    api.get('brands/').then(r => setBrands(r.data.results || r.data || [])).catch(() => {});
    if (isEdit) {
      setLoading(true);
      api.get(`vehicles/${vehicleId}/`).then(r => {
        const v = r.data;
        setForm({
          matricule: v.matricule || '', marque: v.marque || '', modele: v.modele || '',
          annee: String(v.annee || ''), couleur: v.couleur || '', carburant: v.carburant || 'Diesel',
          kilometrage: String(v.kilometrage || ''), prix_par_jour: String(v.prix_par_jour || ''),
          statut: v.statut || 'Available', chauffeur_disponible: v.chauffeur_disponible || false,
          date_assurance: v.date_assurance || '', date_visite_technique: v.date_visite_technique || '',
          prochain_vidange_km: String(v.prochain_vidange_km || ''), tarif_km_extra: String(v.tarif_km_extra || ''),
        });
        if (v.image) setExistingImage(v.image);
        if (v.marque) api.get(`modelcars/?brand=${v.marque}`).then(r => setModels(r.data.results || r.data || [])).catch(() => {});
      }).catch(() => Alert.alert('Erreur', 'Impossible de charger le véhicule')).finally(() => setLoading(false));
    }
  }, []);

  const handleBrandChange = async (brandId) => {
    setForm(f => ({ ...f, marque: brandId, modele: '' }));
    if (brandId) {
      try {
        const r = await api.get(`modelcars/?brand=${brandId}`);
        setModels(r.data.results || r.data || []);
      } catch (e) { setModels([]); }
    } else setModels([]);
  };

  const handleSave = async () => {
    if (!form.matricule || !form.marque || !form.modele) {
      Alert.alert('Erreur', 'Matricule, marque et modèle sont requis');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        annee: parseInt(form.annee) || 0,
        kilometrage: parseInt(form.kilometrage) || 0,
        prix_par_jour: parseFloat(form.prix_par_jour) || 0,
        prochain_vidange_km: parseInt(form.prochain_vidange_km) || null,
        tarif_km_extra: form.tarif_km_extra ? parseFloat(form.tarif_km_extra) : null,
      };
      if (imageAsset) {
        const data = new FormData();
        Object.keys(payload).forEach(k => data.append(k, payload[k]));
        data.append('image', {
          uri: imageAsset.uri,
          name: imageAsset.fileName || `photo_${Date.now()}.jpg`,
          type: imageAsset.mimeType || 'image/jpeg',
        });
        if (isEdit) await api.patch(`vehicles/${vehicleId}/`, data);
        else await api.post('vehicles/', data);
      } else {
        if (isEdit) await api.patch(`vehicles/${vehicleId}/`, payload);
        else await api.post('vehicles/', payload);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.detail || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, justifyContent: 'center' }} size="large" color={theme.colors.primary} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="directions-car" size={24} color={theme.colors.onSurface} />
          <Text style={{ fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.xl, color: theme.colors.onSurface }}>Ajouter un Véhicule</Text>
        </View>

        <View style={styles.sectionHeader}>
          <MaterialIcons name="fingerprint" size={20} color={theme.colors.onSurface} />
          <Text style={styles.sectionTitle}>Identification</Text>
        </View>

        <View style={styles.sectionHeader}>
          <MaterialIcons name="photo-camera" size={20} color={theme.colors.onSurface} />
          <Text style={styles.sectionTitle}>Photo du véhicule</Text>
        </View>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
          {(imageAsset?.uri || (isEdit && existingImage)) ? (
            <Image source={{ uri: imageAsset?.uri || resolveMediaUrl(existingImage) }} style={styles.imagePreview} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="add-a-photo" size={32} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.imageHint}>Ajouter une photo</Text>
            </View>
          )}
          <View style={styles.imageOverlay}>
            <Text style={styles.imageOverlayText}>{imageAsset || (isEdit && existingImage) ? 'Changer la photo' : 'Choisir une photo'}</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.label}>Matricule *</Text>
        <TextInput style={styles.input} value={form.matricule} onChangeText={v => setForm(f => ({ ...f, matricule: v }))} placeholder="Ex: 1234 Tunisia 5" placeholderTextColor={theme.colors.onSurfaceVariant} />

        <Text style={styles.label}>Marque *</Text>
        <View style={styles.optionsRow}>
          {brands.map(b => (
            <TouchableChoice key={b.id} label={b.name} selected={form.marque == b.id} onPress={() => handleBrandChange(b.id)} />
          ))}
        </View>

        {models.length > 0 && (
          <>
            <Text style={styles.label}>Modèle *</Text>
            <View style={styles.optionsRow}>
              {models.map(m => (
                <TouchableChoice key={m.id} label={m.name} selected={form.modele == m.id} onPress={() => setForm(f => ({ ...f, modele: m.id }))} />
              ))}
            </View>
          </>
        )}

        <View style={styles.sectionHeader}>
          <MaterialIcons name="settings-input-component" size={20} color={theme.colors.onSurface} />
          <Text style={{ fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.md, color: theme.colors.onSurface }}>Spécifications</Text>
        </View>
        <Text style={styles.label}>Année</Text>
        <TextInput style={styles.input} value={form.annee} onChangeText={v => setForm(f => ({ ...f, annee: v }))} keyboardType="numeric" placeholder="Ex: 2020" placeholderTextColor={theme.colors.onSurfaceVariant} />

        <Text style={styles.label}>Couleur</Text>
        <TextInput style={styles.input} value={form.couleur} onChangeText={v => setForm(f => ({ ...f, couleur: v }))} placeholder="Ex: Rouge" placeholderTextColor={theme.colors.onSurfaceVariant} />

        <Text style={styles.label}>Carburant</Text>
        <View style={styles.optionsRow}>
          {['Diesel', 'Essence', 'Hybride', 'Electrique'].map(f => (
            <TouchableChoice key={f} label={f} selected={form.carburant === f} onPress={() => setForm(fo => ({ ...fo, carburant: f }))} />
          ))}
        </View>

        <Text style={styles.label}>Kilométrage</Text>
        <TextInput style={styles.input} value={form.kilometrage} onChangeText={v => setForm(f => ({ ...f, kilometrage: v }))} keyboardType="numeric" placeholder="Ex: 50000" placeholderTextColor={theme.colors.onSurfaceVariant} />

        <View style={styles.sectionHeader}>
          <MaterialIcons name="payments" size={20} color={theme.colors.onSurface} />
          <Text style={{ fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.md, color: theme.colors.onSurface }}>Tarification</Text>
        </View>
        <Text style={styles.label}>Prix par jour (DH)</Text>
        <TextInput style={styles.input} value={form.prix_par_jour} onChangeText={v => setForm(f => ({ ...f, prix_par_jour: v }))} keyboardType="numeric" placeholder="Ex: 200" placeholderTextColor={theme.colors.onSurfaceVariant} />

        <View style={styles.sectionHeader}>
          <MaterialIcons name="verified-user" size={20} color={theme.colors.onSurface} />
          <Text style={{ fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.md, color: theme.colors.onSurface }}>Validité</Text>
        </View>
        <Text style={styles.label}>Statut</Text>
        <View style={styles.optionsRow}>
          {['Available', 'Rented', 'Maintenance'].map(s => (
            <TouchableChoice key={s} label={{Available: 'Disponible', Rented: 'Loué', Maintenance: 'Maintenance'}[s]} selected={form.statut === s} onPress={() => setForm(f => ({ ...f, statut: s }))} />
          ))}
        </View>

        <DateField label="Date d'assurance" value={form.date_assurance} onChange={v => setForm(f => ({ ...f, date_assurance: v }))} />
        <DateField label="Date de visite technique" value={form.date_visite_technique} onChange={v => setForm(f => ({ ...f, date_visite_technique: v }))} />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={styles.saveText}>{isEdit ? 'Mettre à jour' : 'Enregistrer le Véhicule'}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TouchableChoice({ label, selected, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  label: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onSurface, marginBottom: theme.spacing.xs, marginTop: theme.spacing.md },
  sectionTitle: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.md, color: theme.colors.onSurface },
  imagePicker: {
    width: '100%',
    height: 180,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xs,
  },
  imagePreview: { width: '100%', height: 180 },
  imagePlaceholder: { alignItems: 'center', gap: 8 },
  imageHint: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 6,
    alignItems: 'center',
  },
  imageOverlayText: { color: '#fff', fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.xs },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    paddingBottom: 12,
    marginBottom: 16,
  },
  input: { backgroundColor: theme.colors.surfaceContainerLowest, borderWidth: 1, borderColor: '#dadce0', borderRadius: theme.borderRadius.sm, padding: theme.spacing.md, fontSize: theme.fontSize.md, fontFamily: theme.fonts.body, color: theme.colors.onSurface },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  choice: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surfaceContainerLowest },
  choiceSelected: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  choiceText: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  choiceTextSelected: { color: theme.colors.primary, fontFamily: theme.fonts.bodyMedium },
  saveButton: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, alignItems: 'center', marginTop: theme.spacing.lg },
  saveText: { color: theme.colors.onPrimary, fontSize: theme.fontSize.lg, fontFamily: theme.fonts.bodySemibold },
});
