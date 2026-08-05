import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl, ScrollView, Switch } from 'react-native';
import api from '../api';
import theme from '../theme';
import Select2 from '../components/Select2';
import SearchFilterBar from '../components/SearchFilterBar';
import PaginationFooter from '../components/PaginationFooter';
import { usePaginatedList } from '../hooks/usePaginatedList';

const roleColors = {
  SUPERADMIN: { bg: '#fce4ec', text: theme.colors.error },
  OWNER: { bg: '#e8f5e9', text: '#2e7d32' },
  EMPLOYEE: { bg: theme.colors.primaryLight, text: theme.colors.primary },
};

const roleOptions = [
  { value: '', label: 'Tous', dotColor: theme.colors.primary },
  { value: 'SUPERADMIN', label: 'Superadmin', dotColor: theme.colors.error },
  { value: 'OWNER', label: 'Owner', dotColor: '#2e7d32' },
  { value: 'EMPLOYEE', label: 'Employé', dotColor: theme.colors.primary },
];

export default function UserManagementScreen() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [agencies, setAgencies] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', first_name: '', last_name: '', role: 'EMPLOYEE', agency: '', password: '', is_active: true });
  const { items: users, loading, loadingMore, page, total, totalPages, loadMore, refresh, goToPage } = usePaginatedList('users/', { search, filters: { role } });

  const fetchAgencies = useCallback(async () => {
    try {
      const aRes = await api.get('agencies/', { params: { page_size: 500 } });
      setAgencies(aRes.data.results || aRes.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchAgencies(); }, [fetchAgencies]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refresh(), fetchAgencies()]);
    setRefreshing(false);
  };

  const openEdit = (item) => {
    setEditing(item.id);
    setForm({ username: item.username, email: item.email || '', first_name: item.first_name || '', last_name: item.last_name || '', role: item.role || 'EMPLOYEE', agency: item.agency || '', password: '', is_active: item.is_active });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.username) { Alert.alert('Erreur', "Nom d'utilisateur requis"); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (editing) await api.put(`users/${editing}/`, payload);
      else await api.post('users/', payload);
      setShowForm(false); setEditing(null);
      setForm({ username: '', email: '', first_name: '', last_name: '', role: 'EMPLOYEE', agency: '', password: '', is_active: true });
      refresh();
    } catch (e) { Alert.alert('Erreur', e.response?.data?.detail || 'Erreur'); }
    finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Confirmer', "Supprimer cet utilisateur ?", [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await api.delete(`users/${id}/`); refresh(); }},
    ]);
  };

  const renderRoleBadge = (role) => {
    const colors = roleColors[role] || { bg: '#f5f5f5', text: theme.colors.onSurfaceVariant };
    return (
      <View style={[styles.roleBadge, { backgroundColor: colors.bg }]}>
        <Text style={[styles.roleText, { color: colors.text }]}>{role}</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} onLongPress={() => handleDelete(item.id)}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.username}</Text>
        {renderRoleBadge(item.role)}
      </View>
      <Text style={styles.cardText}>{item.first_name} {item.last_name}</Text>
      <Text style={styles.cardText}>{item.email}</Text>
    </TouchableOpacity>
  );

  const renderChips = (options, selectedKey, labelKey, onSelect) => (
    <View style={styles.chipsRow}>
      {options.map(opt => {
        const label = typeof opt === 'string' ? opt : opt[labelKey || 'nom_agence'];
        const val = typeof opt === 'string' ? opt : opt.id;
        const isSelected = String(selectedKey) === String(val);
        return (
          <TouchableOpacity key={val} style={[styles.chip, isSelected && styles.chipSelected]} onPress={() => onSelect(val)}>
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (showForm) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.formContent}>
        <Text style={styles.formTitle}>{editing ? "Modifier" : "Nouvel"} utilisateur</Text>
        <TextInput style={styles.input} placeholder="Nom d'utilisateur *" placeholderTextColor={theme.colors.onSurfaceVariant} value={form.username} onChangeText={v => setForm(f => ({ ...f, username: v }))} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor={theme.colors.onSurfaceVariant} value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Prénom" placeholderTextColor={theme.colors.onSurfaceVariant} value={form.first_name} onChangeText={v => setForm(f => ({ ...f, first_name: v }))} />
        <TextInput style={styles.input} placeholder="Nom" placeholderTextColor={theme.colors.onSurfaceVariant} value={form.last_name} onChangeText={v => setForm(f => ({ ...f, last_name: v }))} />
        <TextInput style={styles.input} placeholder={editing ? "Mot de passe (laisser vide pour ne pas changer)" : "Mot de passe *"} placeholderTextColor={theme.colors.onSurfaceVariant} value={form.password} onChangeText={v => setForm(f => ({ ...f, password: v }))} secureTextEntry />
        <Text style={styles.label}>Rôle</Text>
        <Select2
          value={form.role}
          options={[
            { value: 'OWNER', label: 'Propriétaire Agence' },
            { value: 'EMPLOYEE', label: 'Employé' },
            { value: 'SUPERADMIN', label: 'Super Admin' },
          ]}
          onSelect={(v) => setForm(f => ({ ...f, role: v }))}
          searchable
        />
        <Text style={styles.label}>Agence</Text>
        <Select2
          value={form.agency || ''}
          options={[
            { value: '', label: '-- Aucune (Super Admin) --' },
            ...agencies.map(a => ({ value: String(a.id), label: a.nom_agence })),
          ]}
          onSelect={(v) => setForm(f => ({ ...f, agency: v || '' }))}
          searchable
        />
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Actif</Text>
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
      <SearchFilterBar placeholder="Rechercher (nom, email)..." search={search} onSearchChange={setSearch} options={roleOptions} filter={role} onFilterChange={setRole} />
      <FlatList data={users} keyExtractor={(item) => String(item.id)} renderItem={renderItem} contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />} onEndReached={loadMore} onEndReachedThreshold={0.3} ListEmptyComponent={loading ? null : <Text style={styles.empty}>Aucun utilisateur</Text>} ListFooterComponent={<PaginationFooter page={page} totalPages={totalPages} total={total} loading={loadingMore} onPrev={() => goToPage(page - 1)} onNext={() => goToPage(page + 1)} />} />
      <TouchableOpacity style={styles.fab} onPress={() => { setEditing(null); setForm({ username: '', email: '', first_name: '', last_name: '', role: 'EMPLOYEE', agency: '', password: '', is_active: true }); setShowForm(true); }}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  list: { padding: theme.spacing.md, paddingBottom: 96 },
  footerLoader: { marginVertical: theme.spacing.md },
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
  cardTitle: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.lg, color: theme.colors.onSurface, flex: 1, marginRight: theme.spacing.sm },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: theme.borderRadius.full },
  roleText: { fontFamily: theme.fonts.label, fontSize: theme.fontSize.xs, fontWeight: '600' },
  cardText: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  formContent: { padding: theme.spacing.md },
  formTitle: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.xl, color: theme.colors.onSurface, marginBottom: theme.spacing.lg },
  input: { backgroundColor: theme.colors.surfaceContainerLowest, borderWidth: 1, borderColor: '#dadce0', borderRadius: theme.borderRadius.sm, padding: theme.spacing.md, fontFamily: theme.fonts.body, fontSize: theme.fontSize.md, color: theme.colors.onSurface, marginBottom: theme.spacing.md },
  label: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onSurface, marginBottom: theme.spacing.sm },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  chip: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: '#dadce0', backgroundColor: theme.colors.surfaceContainerLowest },
  chipSelected: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  chipText: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  chipTextSelected: { fontFamily: theme.fonts.bodySemibold, color: theme.colors.primary },
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
