import { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../api';
import theme from '../theme';
import DateTimeField from '../components/DateTimeField';

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

export default function ClientReservationFormScreen({ navigation, route }) {
  const vehicle = route?.params?.vehicle || null;
  const [dateSortie, setDateSortie] = useState(toLocalInput(new Date()));
  const [dateRetour, setDateRetour] = useState(toLocalInput(new Date(Date.now() + 86400000)));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!vehicle) return;
    const sortie = parseInput(dateSortie);
    const retour = parseInput(dateRetour);
    if (!sortie || !retour) {
      Alert.alert('Erreur', 'Dates invalides. Format attendu : YYYY-MM-DD HH:MM');
      return;
    }
    if (retour <= sortie) {
      Alert.alert('Erreur', 'La date de retour doit être postérieure à la date de sortie.');
      return;
    }

    setSaving(true);
    try {
      await api.post('reservations/', {
        vehicle: vehicle.id,
        date_sortie: sortie.toISOString(),
        date_retour_prevue: retour.toISOString(),
        notes: notes.trim() || null,
      });
      setSubmitted(true);
    } catch (e) {
      const data = e.response?.data;
      const fields = data && typeof data === 'object' ? Object.values(data).flat().join('\n') : '';
      Alert.alert('Erreur', fields || e.response?.data?.detail || 'La réservation n\'a pas pu être créée.');
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
        <Text style={styles.successTitle}>Réservation envoyée !</Text>
        <Text style={styles.successText}>
          Votre demande de réservation a bien été reçue. Elle sera confirmée par notre équipe. Retrouvez-la dans « Mes réservations ».
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('ClientReservations')}>
          <Text style={styles.primaryButtonText}>Voir mes réservations</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successText}>Veuillez sélectionner un véhicule depuis l'accueil.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.companyRow}>
            <View style={styles.companyIcon}>
              <MaterialIcons name="business" size={18} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.companyLabel}>SOCIÉTÉ DE LOCATION</Text>
              <Text style={styles.companyName}>{vehicle.agency_details?.nom_agence || 'Nom de la société'}</Text>
              {(vehicle.agency_details?.adresse || vehicle.agency_details?.telephone) ? (
                <Text style={styles.companyMeta}>
                  {[vehicle.agency_details?.adresse, vehicle.agency_details?.telephone].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={styles.vehicleDivider} />
          <View style={styles.vehicleIcon}>
            <MaterialIcons name="directions-car" size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.vehicleName}>
            {vehicle.marque_nom || vehicle.marque || ''} {vehicle.modele_nom || vehicle.modele || ''}
          </Text>
          <Text style={styles.vehicleMeta}>{vehicle.matricule} · {vehicle.categorie || 'Standard'}</Text>
          <Text style={styles.vehiclePrice}>{vehicle.prix_par_jour?.toLocaleString() || '0'} DH / jour</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>DATES DE LOCATION</Text>
          <DateTimeField
            label="Date de sortie"
            value={dateSortie}
            onChange={setDateSortie}
            minimumDate={new Date()}
          />
          <DateTimeField
            label="Date de retour prévue"
            value={dateRetour}
            onChange={setDateRetour}
            minimumDate={parseInput(dateSortie) || new Date()}
          />
          <Text style={styles.label}>Notes (optionnel)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Remarque ou demande particulière..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={saving} activeOpacity={0.85}>
          {saving ? (
            <ActivityIndicator color={theme.colors.onPrimary} />
          ) : (
            <>
              <MaterialIcons name="event-available" size={20} color={theme.colors.onPrimary} />
              <Text style={styles.primaryButtonText}>Envoyer la réservation</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.hint}>Votre réservation doit être confirmée par notre équipe avant la prise du véhicule.</Text>
      </ScrollView>
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
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.sm },
  companyIcon: { width: 36, height: 36, borderRadius: theme.borderRadius.sm, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  companyLabel: { fontFamily: theme.fonts.label, fontSize: theme.fontSize.xs, letterSpacing: 0.6, color: theme.colors.onSurfaceVariant, textTransform: 'uppercase' },
  companyName: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.md, color: theme.colors.onSurface, marginTop: 2 },
  companyMeta: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.xs, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  vehicleDivider: { height: 1, backgroundColor: theme.colors.outlineVariant, marginBottom: theme.spacing.md },
  vehicleIcon: { width: 64, height: 64, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.sm },
  vehicleName: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.lg, color: theme.colors.onSurface },
  vehicleMeta: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  vehiclePrice: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.primary, marginTop: 6 },
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
  successContainer: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.lg },
  successIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: theme.colors.tertiaryContainer, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.lg },
  successTitle: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.title, color: theme.colors.onSurface, textAlign: 'center' },
  successText: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.md, color: theme.colors.onSurfaceVariant, textAlign: 'center', marginVertical: theme.spacing.md, lineHeight: 22 },
});
