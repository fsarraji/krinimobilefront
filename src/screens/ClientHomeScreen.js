import { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../api';
import theme from '../theme';

const CATEGORIES = ['Tous', 'Luxury', 'SUV', 'Sedan', 'Sport', 'Economy', 'Electric'];

export default function ClientHomeScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tous');

  useEffect(() => {
    api.get('public-vehicles/', { params: { page_size: 500 } })
      .then((r) => setVehicles(r.data.results || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = vehicles;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((v) =>
        v.matricule?.toLowerCase().includes(q) ||
        (v.marque_nom || v.marque || '')?.toLowerCase().includes(q) ||
        (v.modele_nom || v.modele || '')?.toLowerCase().includes(q)
      );
    }
    if (category !== 'Tous') {
      list = list.filter((v) => (v.categorie || '')?.toLowerCase() === category.toLowerCase());
    }
    return list;
  }, [vehicles, search, category]);

  const renderVehicle = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.imagePlaceholder}>
        <MaterialIcons name="directions-car" size={44} color={theme.colors.outlineVariant} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.vehicleName} numberOfLines={1}>
          {item.marque_nom || item.marque || ''} {item.modele_nom || item.modele || ''}
        </Text>
        <View style={styles.companyRow}>
          <MaterialIcons name="business" size={13} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.companyName} numberOfLines={1}>{item.agency_details?.nom_agence || ''}</Text>
        </View>
        <Text style={styles.vehicleMeta}>{item.matricule} · {item.categorie || 'Standard'}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceValue}>{item.prix_par_jour?.toLocaleString() || '0'} DH</Text>
          <Text style={styles.priceUnit}>/ jour</Text>
        </View>
        <TouchableOpacity style={styles.bookButton} activeOpacity={0.85} onPress={() => navigation.navigate('ClientReservationForm', { vehicle: item })}>
          <MaterialIcons name="event-available" size={18} color={theme.colors.onPrimary} />
          <Text style={styles.bookButtonText}>Réserver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderVehicle}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>Réservez votre véhicule</Text>
              <Text style={styles.heroSubtitle}>Choisissez votre véhicule et créez une réservation en quelques secondes.</Text>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher (plaque, marque...)"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={search}
              onChangeText={setSearch}
            />
            <View style={styles.categoriesRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryPill, category === cat && styles.categoryPillActive]}
                  onPress={() => setCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.sectionTitle}>Véhicules disponibles</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>Aucun véhicule disponible</Text>}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  list: { padding: theme.spacing.md },
  hero: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.xl, padding: theme.spacing.lg, marginBottom: theme.spacing.md },
  heroTitle: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.title, color: theme.colors.onPrimary },
  heroSubtitle: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onPrimary, opacity: 0.85, marginTop: 6, lineHeight: 20 },
  searchInput: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: theme.fontSize.md,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.sm,
  },
  categoriesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  categoryPill: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: theme.borderRadius.full, backgroundColor: theme.colors.surfaceContainerLowest, borderWidth: 1, borderColor: theme.colors.outlineVariant },
  categoryPillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  categoryText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant },
  categoryTextActive: { color: theme.colors.onPrimary },
  sectionTitle: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.xl, color: theme.colors.onSurface, marginBottom: theme.spacing.sm },
  card: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  imagePlaceholder: { height: 150, backgroundColor: theme.colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  cardContent: { padding: theme.spacing.md },
  vehicleName: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.lg, color: theme.colors.primary },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  companyName: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.xs, color: theme.colors.onSurfaceVariant, flex: 1 },
  vehicleMeta: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: theme.spacing.sm },
  priceValue: { fontFamily: theme.fonts.headlineBold, fontSize: theme.fontSize.xl, color: theme.colors.primary },
  priceUnit: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.sm, color: theme.colors.onSurfaceVariant, marginLeft: 4 },
  bookButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    marginTop: theme.spacing.md,
  },
  bookButtonText: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onPrimary },
  empty: { textAlign: 'center', color: theme.colors.onSurfaceVariant, marginTop: theme.spacing.xl, fontFamily: theme.fonts.body, fontSize: theme.fontSize.md },
});
