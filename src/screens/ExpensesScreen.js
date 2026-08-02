import { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import api from '../api';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchBar from '../components/SearchBar';
import PaginationFooter from '../components/PaginationFooter';
import { usePaginatedList } from '../hooks/usePaginatedList';

const categories = ['Maintenance', 'Fuel', 'Salaires', 'Loyer', 'Utilities', 'Taxes', 'Autre'];

export default function ExpensesScreen() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const { items, loading, refreshing, loadingMore, page, total, totalPages, loadMore, refresh, goToPage } = usePaginatedList('expenses/', { search, filters: { category } });
  const expenses = items;
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'Maintenance', amount: '', expense_date: new Date().toISOString().slice(0, 10), notes: '' });

  const handleSave = async () => {
    if (!form.title || !form.amount) {
      Alert.alert('Erreur', 'Titre et montant requis');
      return;
    }
    setSaving(true);
    try {
      await api.post('expenses/', { ...form, amount: parseFloat(form.amount) });
      setShowForm(false);
      setForm({ title: '', category: 'Maintenance', amount: '', expense_date: new Date().toISOString().slice(0, 10), notes: '' });
      refresh();
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.detail || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardAmount}>-{parseFloat(item.amount).toLocaleString()} DH</Text>
      </View>
      <Text style={styles.cardCategory}>{item.category}</Text>
      <Text style={styles.cardDate}>{item.expense_date}</Text>
    </View>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      {showForm ? (
        <ScrollView style={styles.formContainer} contentContainerStyle={styles.formContent}>
          <Text style={styles.inputLabel}>Titre</Text>
          <TextInput
            style={styles.input}
            placeholder="Titre de la dépense"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={form.title}
            onChangeText={v => setForm(f => ({ ...f, title: v }))}
          />

          <Text style={styles.inputLabel}>Catégorie</Text>
          <View style={styles.chipsRow}>
            {categories.map(c => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, form.category === c && styles.chipSelected]}
                onPress={() => setForm(f => ({ ...f, category: c }))}
              >
                <Text style={[styles.chipText, form.category === c && styles.chipTextSelected]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Montant (DH)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={form.amount}
            onChangeText={v => setForm(f => ({ ...f, amount: v }))}
            keyboardType="numeric"
          />

          <Text style={styles.inputLabel}>Date</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={form.expense_date}
            onChangeText={v => setForm(f => ({ ...f, expense_date: v }))}
          />

          <Text style={styles.inputLabel}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notes supplémentaires"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={form.notes}
            onChangeText={v => setForm(f => ({ ...f, notes: v }))}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.formButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowForm(false)}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={styles.saveText}>Ajouter</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <>
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher (titre, notes)..." />
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterPill, !category && styles.filterPillActive]}
              onPress={() => setCategory('')}
            >
              <Text style={[styles.filterText, !category && styles.filterTextActive]}>Toutes</Text>
            </TouchableOpacity>
            {categories.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.filterPill, category === c && styles.filterPillActive]}
                onPress={() => setCategory(category === c ? '' : c)}
              >
                <Text style={[styles.filterText, category === c && styles.filterTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            data={expenses}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.colors.primary} />}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={        <Text style={styles.empty}>Aucune dépense enregistrée.</Text>}
            ListFooterComponent={<PaginationFooter page={page} totalPages={totalPages} total={total} loading={loadingMore} onPrev={() => goToPage(page - 1)} onNext={() => goToPage(page + 1)} />}
          />
          <TouchableOpacity style={styles.fab} onPress={() => setShowForm(true)}>
            <MaterialIcons name="add" size={28} color={theme.colors.onPrimary} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  list: { padding: theme.spacing.md, paddingBottom: 96 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.sm },
  filterPill: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surfaceContainerLowest },
  filterPillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  filterTextActive: { color: theme.colors.onPrimary },
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.xs },
  cardTitle: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onSurface, flex: 1 },
  cardAmount: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.md, color: theme.colors.error },
  cardCategory: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  cardDate: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.xs, color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xs },
  formContainer: { flex: 1 },
  formContent: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  inputLabel: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.onSurface, marginBottom: theme.spacing.xs, marginTop: theme.spacing.sm },
  input: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1, borderColor: '#dadce0', borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md, fontSize: theme.fontSize.md, fontFamily: theme.fonts.body,
    color: theme.colors.onSurface, marginBottom: theme.spacing.sm,
  },
  textArea: { minHeight: 80 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  chip: {
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: '#dadce0',
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  chipSelected: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  chipText: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  chipTextSelected: { fontFamily: theme.fonts.bodySemibold, color: theme.colors.primary },
  formButtons: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.lg },
  cancelButton: {
    flex: 1, paddingVertical: theme.spacing.md, alignItems: 'center',
    borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: '#dadce0',
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  cancelText: { fontFamily: theme.fonts.bodySemibold, color: theme.colors.onSurfaceVariant, fontSize: theme.fontSize.md },
  saveButton: {
    flex: 1, backgroundColor: theme.colors.primary, paddingVertical: theme.spacing.md,
    alignItems: 'center', borderRadius: theme.borderRadius.md,
  },
  saveText: { fontFamily: theme.fonts.bodySemibold, color: theme.colors.onPrimary, fontSize: theme.fontSize.md },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: theme.colors.primary, width: 56, height: 56,
    borderRadius: theme.borderRadius.xl, justifyContent: 'center', alignItems: 'center',
    ...theme.shadow.card,
  },
  fabText: { fontSize: 28, color: theme.colors.onPrimary, marginTop: -2 },
  empty: { fontFamily: theme.fonts.body, textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xl, fontSize: theme.fontSize.md },
});
