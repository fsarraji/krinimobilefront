import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../api';
import theme from '../theme';
import { MaterialIcons } from '@expo/vector-icons';
import DateField from '../components/DateField';
import { resolveMediaUrl } from '../apiUrl';

function Label({ required, children }) {
  return (
    <Text style={styles.label}>
      {children}
      {required ? <Text style={styles.labelRequired}> *</Text> : null}
    </Text>
  );
}

function IconInput({ icon, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
      <MaterialIcons name={icon} size={18} color={theme.colors.outline} />
      <TextInput
        style={styles.input}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
    </View>
  );
}

function SelectField({ icon, placeholder, value, options, onSelect }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => String(o.value) === String(value));
  return (
    <View>
      <TouchableOpacity style={styles.selectBox} onPress={() => setOpen((o) => !o)} activeOpacity={0.8}>
        <MaterialIcons name={icon} size={18} color={theme.colors.outline} />
        <Text style={[styles.selectValue, !selected && styles.selectPlaceholder]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <MaterialIcons name="expand-more" size={20} color={theme.colors.outline} />
      </TouchableOpacity>
      {open && (
        <View style={styles.optionsRow}>
          {options.map((o) => (
            <TouchableChoice
              key={String(o.value)}
              label={o.label}
              selected={String(value) === String(o.value)}
              onPress={() => { onSelect(o.value); setOpen(false); }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function SectionTitle({ icon, children }) {
  return (
    <View style={styles.sectionHeader}>
      <MaterialIcons name={icon} size={18} color={theme.colors.secondary} />
      <Text style={styles.sectionTitle}>{children}</Text>
    </View>
  );
}

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
    if (permission && !permission.granted) {
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
        prochain_vidange_km: parseInt(form.prochain_vidange_km) || 0,
        tarif_km_extra: form.tarif_km_extra ? parseFloat(form.tarif_km_extra) : null,
      };
      if (imageAsset) {
        const data = new FormData();
        Object.keys(payload).forEach(k => {
          const v = payload[k];
          if (v === null || v === undefined || v === '') return;
          data.append(k, typeof v === 'boolean' ? String(v) : v);
        });
        if (imageAsset.file && Platform.OS === 'web') {
          data.append('image', imageAsset.file, imageAsset.file.name || `photo_${Date.now()}.jpg`);
        } else {
          data.append('image', {
            uri: imageAsset.uri,
            name: imageAsset.fileName || `photo_${Date.now()}.jpg`,
            type: imageAsset.mimeType || 'image/jpeg',
          });
        }
        if (isEdit) await api.patch(`vehicles/${vehicleId}/`, data);
        else await api.post('vehicles/', data);
      } else {
        if (isEdit) await api.patch(`vehicles/${vehicleId}/`, payload);
        else await api.post('vehicles/', payload);
      }
      navigation.goBack();
    } catch (e) {
      let message = 'Erreur lors de la sauvegarde';
      const data = e.response?.data;
      if (data) {
        if (typeof data === 'string') message = data;
        else if (data.detail) message = data.detail;
        else {
          const fieldErrors = Object.entries(data)
            .filter(([, errs]) => Array.isArray(errs) || typeof errs === 'string')
            .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : errs}`)
            .join('\n');
          if (fieldErrors) message = fieldErrors;
        }
      }
      Alert.alert('Erreur', message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, justifyContent: 'center' }} size="large" color={theme.colors.primary} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{isEdit ? 'Modifier le véhicule' : 'Nouveau véhicule'}</Text>
          <Text style={styles.pageSubtitle}>Ajoutez les informations du véhicule</Text>
        </View>

        <View style={styles.card}>
          <SectionTitle icon="photo-camera">Photo du véhicule</SectionTitle>
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

          <View style={styles.section}>
            <SectionTitle icon="badge">Informations principales</SectionTitle>
            <View style={styles.field}>
              <Label required>Matricule</Label>
              <IconInput icon="badge" value={form.matricule} onChangeText={v => setForm(f => ({ ...f, matricule: v }))} placeholder="Ex: 48744-A-49" autoCapitalize="characters" />
            </View>
            <View style={styles.field}>
              <Label required>Marque</Label>
              <SelectField icon="directions-car" placeholder="Sélectionner la marque" value={form.marque} options={brands.map(b => ({ value: b.id, label: b.name }))} onSelect={handleBrandChange} />
            </View>
            <View style={styles.field}>
              <Label required>Modèle</Label>
              <SelectField icon="directions-car" placeholder="Sélectionner le modèle" value={form.modele} options={models.map(m => ({ value: m.id, label: m.name }))} onSelect={(v) => setForm(f => ({ ...f, modele: v }))} />
            </View>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Label>Année</Label>
                <IconInput icon="calendar-today" value={form.annee} onChangeText={v => setForm(f => ({ ...f, annee: v }))} keyboardType="numeric" placeholder="Ex: 2020" />
              </View>
              <View style={styles.fieldHalf}>
                <Label>Couleur</Label>
                <IconInput icon="palette" value={form.couleur} onChangeText={v => setForm(f => ({ ...f, couleur: v }))} placeholder="Ex: Rouge" />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle icon="tune">Détails techniques</SectionTitle>
            <View style={styles.field}>
              <Label required>Kilométrage (km)</Label>
              <IconInput icon="speed" value={form.kilometrage} onChangeText={v => setForm(f => ({ ...f, kilometrage: v }))} keyboardType="numeric" placeholder="Ex: 50000" />
            </View>
            <View style={styles.field}>
              <Label>Type de carburant</Label>
              <SelectField icon="local-gas-station" placeholder="Sélectionner le type" value={form.carburant} options={['Diesel', 'Essence', 'Hybride', 'Électrique'].map(c => ({ value: c, label: c }))} onSelect={(v) => setForm(f => ({ ...f, carburant: v }))} />
            </View>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Label>Prochain vidange (km)</Label>
                <IconInput icon="build" value={form.prochain_vidange_km} onChangeText={v => setForm(f => ({ ...f, prochain_vidange_km: v }))} keyboardType="numeric" placeholder="Ex: 10000" />
              </View>
              <View style={styles.fieldHalf}>
                <Label>Tarif km extra</Label>
                <IconInput icon="add-road" value={form.tarif_km_extra} onChangeText={v => setForm(f => ({ ...f, tarif_km_extra: v }))} keyboardType="decimal-pad" placeholder="Ex: 2.00" />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle icon="sell">Informations financières</SectionTitle>
            <View style={styles.field}>
              <Label required>Prix de location / jour (DH)</Label>
              <IconInput icon="sell" value={form.prix_par_jour} onChangeText={v => setForm(f => ({ ...f, prix_par_jour: v }))} keyboardType="numeric" placeholder="Ex: 370.00" />
            </View>
            <View style={styles.field}>
              <Label>Statut</Label>
              <SelectField icon="task-alt" placeholder="Sélectionner le statut" value={form.statut} options={[{ value: 'Available', label: 'Disponible' }, { value: 'Rented', label: 'Loué' }, { value: 'Maintenance', label: 'Maintenance' }]} onSelect={(v) => setForm(f => ({ ...f, statut: v }))} />
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle icon="verified-user">Validité</SectionTitle>
            <DateField label="Date d'assurance" value={form.date_assurance} onChange={v => setForm(f => ({ ...f, date_assurance: v }))} />
            <DateField label="Date de visite technique" value={form.date_visite_technique} onChange={v => setForm(f => ({ ...f, date_visite_technique: v }))} />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving} activeOpacity={0.9}>
              {saving ? (
                <ActivityIndicator color={theme.colors.onPrimary} />
              ) : (
                <>
                  <MaterialIcons name="save" size={18} color={theme.colors.onPrimary} />
                  <Text style={styles.saveText}>{isEdit ? 'Mettre à jour' : 'Enregistrer'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl * 2 },
  pageHeader: { paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.md },
  pageTitle: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.title, color: theme.colors.primary, letterSpacing: -0.5 },
  pageSubtitle: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  card: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  section: { marginTop: theme.spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  sectionTitle: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.lg, color: theme.colors.onSurface },
  field: { marginBottom: theme.spacing.md },
  fieldRow: { flexDirection: 'row', gap: theme.spacing.md },
  fieldHalf: { flex: 1 },
  label: { fontFamily: theme.fonts.bodyMedium, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.xs },
  labelRequired: { color: theme.colors.error },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: 'transparent',
  },
  inputWrapFocused: { borderColor: theme.colors.primaryContainer, borderWidth: 1.5 },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.body,
    color: theme.colors.onSurface,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  selectValue: { flex: 1, fontSize: theme.fontSize.md, fontFamily: theme.fonts.body, color: theme.colors.onSurface },
  selectPlaceholder: { color: theme.colors.onSurfaceVariant },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  choice: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  choiceSelected: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.secondary },
  choiceText: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  choiceTextSelected: { color: theme.colors.secondary, fontFamily: theme.fonts.bodySemibold },
  imagePicker: {
    width: '100%',
    height: 180,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
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
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  cancelText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.onSurface },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primaryContainer,
  },
  saveText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.onPrimary },
});
