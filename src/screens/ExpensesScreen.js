import { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import api from '../api';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';
import LoadingSpinner from '../components/LoadingSpinner';
import Select2 from '../components/Select2';
import SearchFilterBar from '../components/SearchFilterBar';
import PaginationFooter from '../components/PaginationFooter';
import DateField from '../components/DateField';
import { usePaginatedList } from '../hooks/usePaginatedList';

const categories = ['Maintenance', 'Fuel', 'Salaires', 'Loyer', 'Utilities', 'Taxes', 'Autre'];

const categoryOptions = [
  { value: '', label: 'Toutes', dotColor: theme.colors.primary },
  ...categories.map((c) => ({ value: c, label: c, dotColor: theme.colors.onSurfaceVariant })),
];

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
      <View style={styles.cardRow}>
        <View style={styles.avatar}>
          <MaterialIcons name="receipt-long" size={20} color={theme.colors.secondary} />
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.cardAmount}>-{parseFloat(item.amount).toLocaleString()} DH</Text>
          </View>
          <View style={styles.cardMetaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.cardCategory}>{item.category}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="calendar-today" size={14} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.cardDate}>{item.expense_date}</Text>
            </View>
          </View>
        </View>
      </View>
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
          <Select2
            value={form.category}
            options={categories.map(c => ({ value: c, label: c }))}
            onSelect={(v) => setForm(f => ({ ...f, category: v }))}
            searchable
          />

          <Text style={styles.inputLabel}>Montant (DH)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={form.amount}
            onChangeText={v => setForm(f => ({ ...f, amount: v }))}
            keyboardType="numeric"
          />

          <DateField
            label="Date"
            value={form.expense_date}
            onChange={v => setForm(f => ({ ...f, expense_date: v }))}
            maximumDate={new Date()}
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
          <SearchFilterBar placeholder="Rechercher (titre, notes)..." search={search} onSearchChange={setSearch} options={categoryOptions} filter={category} onFilterChange={setCategory} />
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
            <MaterialIcons name="add" size={28} color={theme.colors.onSecondary} />
          </TouchableOpacity>
        </>
      )}
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
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadow.card,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  cardInfo: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs },
  cardTitle: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onSurface, flex: 1, marginRight: theme.spacing.sm },
  cardAmount: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.md, color: theme.colors.error },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryBadge: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  cardCategory: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.xs, color: theme.colors.secondary },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardDate: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.xs, color: theme.colors.onSurfaceVariant },
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
    backgroundColor: theme.colors.secondary, width: 56, height: 56,
    borderRadius: theme.borderRadius.xl, justifyContent: 'center', alignItems: 'center',
    ...theme.shadow.card,
  },
  empty: { fontFamily: theme.fonts.body, textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xl, fontSize: theme.fontSize.md },
});
