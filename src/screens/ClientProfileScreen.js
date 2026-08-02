import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';

export default function ClientProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.get('clients/me/')
      .then((r) => setProfile(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const rows = profile
    ? [
        { label: 'Nom complet', value: `${profile.prenom || ''} ${profile.nom || ''}`.trim(), icon: 'badge' },
        { label: 'Téléphone', value: profile.telephone, icon: 'phone' },
        { label: 'Email', value: profile.email || '—', icon: 'email' },
        { label: 'CIN / Passeport', value: profile.cin_passport || '—', icon: 'credit-card' },
        { label: 'Permis de conduire', value: profile.permis_conduite || '—', icon: 'assignment-ind' },
        { label: 'Adresse', value: profile.adresse || '—', icon: 'home' },
      ]
    : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarBox}>
        <Text style={styles.avatarText}>{(profile?.prenom?.[0] || user?.username?.[0] || 'K').toUpperCase()}</Text>
      </View>
      <Text style={styles.name}>{profile ? `${profile.prenom} ${profile.nom}`.trim() : (user?.username || 'Client')}</Text>
      <Text style={styles.role}>Compte client</Text>

      <View style={styles.card}>
        {rows.map((row, i) => (
          <View key={row.label} style={[styles.row, i > 0 && styles.rowBorder]}>
            <MaterialIcons name={row.icon} size={20} color={theme.colors.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
        <MaterialIcons name="logout" size={20} color={theme.colors.onPrimary} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.lg, alignItems: 'center' },
  avatarBox: { width: 88, height: 88, borderRadius: 44, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md },
  avatarText: { fontFamily: theme.fonts.headlineBold, fontSize: 36, color: theme.colors.onPrimary },
  name: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.title, color: theme.colors.onSurface, textAlign: 'center' },
  role: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, marginTop: 4 },
  card: {
    alignSelf: 'stretch',
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    ...theme.shadow.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(197,197,211,0.15)' },
  rowLabel: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  rowValue: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onSurface, marginTop: 2 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm,
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignSelf: 'stretch',
    marginTop: theme.spacing.lg,
    ...theme.shadow.card,
  },
  logoutText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onPrimary },
});
