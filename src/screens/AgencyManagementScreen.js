import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl, ScrollView, Switch } from 'react-native';
import api from '../api';
import theme from '../theme';

export default function AgencyManagementScreen() {
  const [agencies, setAgencies] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nom_agence: '', adresse: '', telephone: '', email: '', rc: '', ice: '', is_active: true });

  const fetchAgencies = useCallback(async () => {
    try {
      const res = await api.get('agencies/');
      setAgencies(res.data.results || res.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchAgencies(); }, [fetchAgencies]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAgencies();
    setRefreshing(false);
  };

  const openEdit = (item) => {
    setEditing(item.id);
    setForm({ nom_agence: item.nom_agence, adresse: item.adresse || '', telephone: item.telephone || '', email: item.email || '', rc: item.rc || '', ice: item.ice || '', is_active: item.is_active });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nom_agence) { Alert.alert('Erreur', 'Nom requis'); return; }
    setSaving(true);
    try {
      if (editing) await api.put(`agencies/${editing}/`, form);
      else await api.post('agencies/', form);
      setShowForm(false);
      setEditing(null);
      setForm({ nom_agence: '', adresse: '', telephone: '', email: '', rc: '', ice: '', is_active: true });
      fetchAgencies();
    } catch (e) { Alert.alert('Erreur', e.response?.data?.detail || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Confirmer', 'Supprimer cette agence ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await api.delete(`agencies/${id}/`); fetchAgencies(); }},
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} onLongPress={() => handleDelete(item.id)}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.nom_agence}</Text>
        <View style={[styles.statusDot, { backgroundColor: item.is_active ? '#34a853' : theme.colors.error }]} />
      </View>
      <Text style={styles.cardText}>{item.telephone}</Text>
      <Text style={styles.cardText}>{item.email}</Text>
    </TouchableOpacity>
  );

  if (showForm) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.formContent}>
        <Text style={styles.formTitle}>{editing ? 'Modifier' : 'Nouvelle'} agence</Text>
        <TextInput style={styles.input} placeholder="Nom *" placeholderTextColor={theme.colors.onSurfaceVariant} value={form.nom_agence} onChangeText={v => setForm(f => ({ ...f, nom_agence: v }))} />
        <TextInput style={styles.input} placeholder="Adresse" placeholderTextColor={theme.colors.onSurfaceVariant} value={form.adresse} onChangeText={v => setForm(f => ({ ...f, adresse: v }))} />
        <TextInput style={styles.input} placeholder="Téléphone" placeholderTextColor={theme.colors.onSurfaceVariant} value={form.telephone} onChangeText={v => setForm(f => ({ ...f, telephone: v }))} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor={theme.colors.onSurfaceVariant} value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} keyboardType="email-address" />
        <TextInput style={styles.input} placeholder="RC" placeholderTextColor={theme.colors.onSurfaceVariant} value={form.rc} onChangeText={v => setForm(f => ({ ...f, rc: v }))} />
        <TextInput style={styles.input} placeholder="ICE" placeholderTextColor={theme.colors.onSurfaceVariant} value={form.ice} onChangeText={v => setForm(f => ({ ...f, ice: v }))} />
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Active</Text>
            <Switch value={form.is_active} onValueChange={v => setForm(f => ({ ...f, is_active: v }))} trackColor={{ false: '#dadce0', true: theme.colors.primaryLight }} thumbColor={form.is_active ? theme.colors.primary : '#f4f3f4'} />
          </View>
        </View>
        <View style={styles.formButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => { setShowForm(false); setEditing(null); }}><Text style={styles.cancelText}>Annuler</Text></TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={styles.saveText}>Enregistrer</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList data={agencies} keyExtractor={(item) => String(item.id)} renderItem={renderItem} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />} ListEmptyComponent={<Text style={styles.empty}>Aucune agence</Text>} />
      <TouchableOpacity style={styles.fab} onPress={() => { setEditing(null); setForm({ nom_agence: '', adresse: '', telephone: '', email: '', rc: '', ice: '', is_active: true }); setShowForm(true); }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  list: { padding: theme.spacing.md, paddingBottom: 96 },
  card: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.card,
    borderWidth: 1,
    borderColor: 'rgba(197,197,211,0.1)',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs },
  cardTitle: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.lg, color: theme.colors.onSurface, flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: theme.spacing.sm },
  cardText: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  formContent: { padding: theme.spacing.md },
  formTitle: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.xl, color: theme.colors.onSurface, marginBottom: theme.spacing.lg },
  input: { backgroundColor: theme.colors.surfaceContainerLowest, borderWidth: 1, borderColor: '#dadce0', borderRadius: theme.borderRadius.sm, padding: theme.spacing.md, fontFamily: theme.fonts.body, fontSize: theme.fontSize.md, color: theme.colors.onSurface, marginBottom: theme.spacing.md },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onSurface },
  formButtons: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.md },
  cancelButton: { flex: 1, padding: theme.spacing.md, alignItems: 'center', borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: '#dadce0', backgroundColor: theme.colors.surfaceContainerLowest },
  cancelText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onSurfaceVariant },
  saveButton: { flex: 1, backgroundColor: theme.colors.primary, padding: theme.spacing.md, alignItems: 'center', borderRadius: theme.borderRadius.md },
  saveText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onPrimary },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: theme.colors.primary, width: 56, height: 56,
    borderRadius: theme.borderRadius.xl, justifyContent: 'center', alignItems: 'center',
    ...theme.shadow.card,
  },
  fabText: { fontSize: 28, color: theme.colors.onPrimary, marginTop: -2 },
  empty: { textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xl, fontFamily: theme.fonts.body, fontSize: theme.fontSize.md },
});
