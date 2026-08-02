import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../api';
import theme from '../theme';

const toLocalInput = (date) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const parseInput = (value) => {
  const match = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, y, m, d, h, min] = match;
  const date = new Date(y, m - 1, d, h, min);
  return Number.isNaN(date.getTime()) ? null : date;
};

export default function BookingFormScreen({ navigation, route }) {
  const preselected = route?.params?.vehicle || null;

  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [vehicle, setVehicle] = useState(preselected);
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    message: '',
    date_sortie: toLocalInput(new Date()),
    date_retour_prevue: toLocalInput(new Date(Date.now() + 86400000)),
  });
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get('public-vehicles/')
      .then((r) => setVehicles(r.data.results || r.data || []))
      .catch(() => {})
      .finally(() => setLoadingVehicles(false));
  }, []);

  const handleSelectVehicle = (v) => {
    setVehicle(v);
    setPickerOpen(false);
  };

  const handleSubmit = async () => {
    if (!vehicle) {
      Alert.alert('Erreur', 'Veuillez sélectionner un véhicule.');
      return;
    }
    if (!form.nom.trim() || !form.prenom.trim() || !form.telephone.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir le nom, le prénom et le téléphone.');
      return;
    }
    const dateSortie = parseInput(form.date_sortie);
    const dateRetour = parseInput(form.date_retour_prevue);
    if (!dateSortie || !dateRetour) {
      Alert.alert('Erreur', 'Dates invalides. Format attendu : YYYY-MM-DD HH:MM');
      return;
    }
    if (dateRetour <= dateSortie) {
      Alert.alert('Erreur', 'La date de retour doit être postérieure à la date de sortie.');
      return;
    }

    setSaving(true);
    try {
      await api.post('booking-requests/', {
        vehicle: vehicle.id,
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        telephone: form.telephone.trim(),
        email: form.email.trim() || null,
        message: form.message.trim() || null,
        date_sortie: dateSortie.toISOString(),
        date_retour_prevue: dateRetour.toISOString(),
      });
      setSubmitted(true);
    } catch (e) {
      const detail = e.response?.data?.detail;
      const fields = e.response?.data ? Object.values(e.response.data).flat().join('\n') : '';
      Alert.alert('Erreur', detail || fields || 'Votre demande n\'a pas pu être envoyée.');
    } finally {
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <MaterialIcons name="check" size={44} color={theme.colors.onPrimary} />
        </View>
        <Text style={styles.successTitle}>Demande envoyée !</Text>
        <Text style={styles.successText}>
          Merci {form.prenom} ! Votre demande de réservation pour le {vehicle ? `${vehicle.marque_name || vehicle.marque} ${vehicle.modele_name || vehicle.modele}` : 'véhicule sélectionné'} a bien été reçue. Notre équipe vous contactera rapidement au {form.telephone}.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => { setSubmitted(false); setForm(f => ({ ...f, message: '' })); }}>
          <Text style={styles.primaryButtonText}>Nouvelle demande</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>VÉHICULE</Text>
          {vehicle ? (
            <View style={styles.selectedVehicle}>
              <View style={styles.vehicleThumb}>
                <MaterialIcons name="directions-car" size={28} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleName}>
                  {vehicle.marque_name || vehicle.marque} {vehicle.modele_name || vehicle.modele}
                </Text>
                <Text style={styles.vehicleMeta}>{vehicle.matricule} · {vehicle.categorie || 'Standard'}</Text>
                <Text style={styles.vehiclePrice}>{vehicle.prix_par_jour?.toLocaleString() || '0'} DH / jour</Text>
              </View>
              <TouchableOpacity style={styles.changeButton} onPress={() => setPickerOpen(true)} activeOpacity={0.7}>
                <Text style={styles.changeButtonText}>Changer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.pickVehicle} onPress={() => setPickerOpen(true)} activeOpacity={0.8}>
              {loadingVehicles ? (
                <ActivityIndicator color={theme.colors.primary} />
              ) : (
                <>
                  <MaterialIcons name="add" size={22} color={theme.colors.primary} />
                  <Text style={styles.pickVehicleText}>Choisir un véhicule</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>DATES DE LOCATION</Text>
          <Text style={styles.label}>Date de sortie</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD HH:MM"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={form.date_sortie}
            onChangeText={(v) => setForm((f) => ({ ...f, date_sortie: v }))}
          />
          <Text style={styles.label}>Date de retour prévue</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD HH:MM"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={form.date_retour_prevue}
            onChangeText={(v) => setForm((f) => ({ ...f, date_retour_prevue: v }))}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>VOS COORDONNÉES</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Prénom</Text>
              <TextInput style={styles.input} placeholder="Prénom" placeholderTextColor={theme.colors.onSurfaceVariant} value={form.prenom} onChangeText={(v) => setForm((f) => ({ ...f, prenom: v }))} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Nom</Text>
              <TextInput style={styles.input} placeholder="Nom" placeholderTextColor={theme.colors.onSurfaceVariant} value={form.nom} onChangeText={(v) => setForm((f) => ({ ...f, nom: v }))} />
            </View>
          </View>
          <Text style={styles.label}>Téléphone</Text>
          <TextInput
            style={styles.input}
            placeholder="06 12 34 56 78"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={form.telephone}
            onChangeText={(v) => setForm((f) => ({ ...f, telephone: v }))}
            keyboardType="phone-pad"
          />
          <Text style={styles.label}>Email (optionnel)</Text>
          <TextInput
            style={styles.input}
            placeholder="exemple@email.com"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={form.email}
            onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.label}>Message (optionnel)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Une remarque ou une demande particulière..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={form.message}
            onChangeText={(v) => setForm((f) => ({ ...f, message: v }))}
            multiline
          />
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={saving} activeOpacity={0.85}>
          {saving ? (
            <ActivityIndicator color={theme.colors.onPrimary} />
          ) : (
            <>
              <MaterialIcons name="event-available" size={20} color={theme.colors.onPrimary} />
              <Text style={styles.primaryButtonText}>Envoyer ma demande</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.hint}>Votre demande n'engage à rien. Nous vous recontacterons pour confirmer la disponibilité.</Text>
      </ScrollView>

      <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir un véhicule</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)}>
                <MaterialIcons name="close" size={24} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={vehicles}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.vehicleOption, vehicle?.id === item.id && styles.vehicleOptionActive]} onPress={() => handleSelectVehicle(item)} activeOpacity={0.7}>
                  <View style={styles.vehicleOptionIcon}>
                    <MaterialIcons name="directions-car" size={22} color={vehicle?.id === item.id ? theme.colors.onPrimary : theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.vehicleOptionName, vehicle?.id === item.id && styles.vehicleOptionNameActive]}>
                      {item.marque_name || item.marque} {item.modele_name || item.modele}
                    </Text>
                    <Text style={styles.vehicleOptionMeta}>{item.matricule} · {item.prix_par_jour?.toLocaleString() || '0'} DH / jour</Text>
                  </View>
                  {vehicle?.id === item.id && <MaterialIcons name="check-circle" size={22} color={theme.colors.primary} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.empty}>Aucun véhicule disponible</Text>}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  card: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
    borderWidth: 1,
    borderColor: 'rgba(197,197,211,0.1)',
  },
  sectionLabel: {
    fontFamily: theme.fonts.label,
    fontSize: theme.fontSize.xs,
    letterSpacing: 0.8,
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
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
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  selectedVehicle: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  vehicleThumb: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleName: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.md, color: theme.colors.onSurface },
  vehicleMeta: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  vehiclePrice: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.primary, marginTop: 4 },
  changeButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: theme.borderRadius.full, backgroundColor: theme.colors.primaryLight },
  changeButtonText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.primary },
  pickVehicle: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  pickVehicleText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.primary },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    ...theme.shadow.card,
  },
  primaryButtonText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onPrimary },
  secondaryButton: { alignItems: 'center', padding: 14, marginTop: theme.spacing.sm },
  secondaryButtonText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.primary },
  hint: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.xs, color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: theme.spacing.md, paddingHorizontal: theme.spacing.md },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    maxHeight: '75%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md },
  modalTitle: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.lg, color: theme.colors.onSurface },
  vehicleOption: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, paddingVertical: 12, paddingHorizontal: theme.spacing.sm, borderRadius: theme.borderRadius.md },
  vehicleOptionActive: { backgroundColor: theme.colors.primaryLight },
  vehicleOptionIcon: { width: 40, height: 40, borderRadius: theme.borderRadius.sm, backgroundColor: theme.colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  vehicleOptionName: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onSurface },
  vehicleOptionNameActive: { color: theme.colors.primary },
  vehicleOptionMeta: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  empty: { textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xl, fontFamily: theme.fonts.body, fontSize: theme.fontSize.md },
  successContainer: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg },
  successIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: theme.colors.tertiaryContainer, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.lg },
  successTitle: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.title, color: theme.colors.onSurface, textAlign: 'center' },
  successText: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.md, color: theme.colors.onSurfaceVariant, textAlign: 'center', marginVertical: theme.spacing.md, lineHeight: 22 },
});
