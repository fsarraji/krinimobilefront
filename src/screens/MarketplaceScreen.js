import { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import theme from '../theme';
import { resolveApiUrl, resolveMediaUrl } from '../apiUrl';
import SafeImage from '../components/SafeImage';

const API_URL = resolveApiUrl(process.env.EXPO_PUBLIC_API_URL, 'https://kriniback.onrender.com/api/');

const CATEGORIES = ['All Luxury', 'SUV', 'Sedan', 'Sport', 'Economy', 'Electric'];

const formatDate = (date) => {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const d = new Date(date);
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
};

export default function MarketplaceScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Luxury');
  const [startDate] = useState(new Date());
  const [endDate] = useState(new Date(Date.now() + 86400000));

  useEffect(() => {
    axios.get(`${API_URL}public-vehicles/`, { params: { page_size: 500 } })
      .then(r => setVehicles(r.data.results || r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = vehicles;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(v =>
        v.matricule?.toLowerCase().includes(q) ||
        (v.marque_nom || v.marque || '')?.toLowerCase().includes(q) ||
        (v.modele_nom || v.modele || '')?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [vehicles, search]);

  const renderVehicleCard = ({ item }) => {
    const imageUri = resolveMediaUrl(item.image);
    return (
      <View style={styles.card}>
        <View style={styles.imageArea}>
          {imageUri ? (
            <SafeImage uri={imageUri} style={styles.vehicleImage} iconSize={48} iconColor={theme.colors.outlineVariant} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="directions-car" size={48} color={theme.colors.outlineVariant} />
            </View>
          )}
          {item.note ? (
            <View style={styles.ratingBadge}>
              <MaterialIcons name="star" size={14} color={theme.colors.star} />
              <Text style={styles.ratingText}>{item.note}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.vehicleName} numberOfLines={1}>
            {(item.marque_nom || item.marque || '')} {(item.modele_nom || item.modele || '')}
          </Text>
          <Text style={styles.vehicleType}>{item.categorie || 'Standard'}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceValue}>{item.prix_par_jour?.toLocaleString() || '0'} DH</Text>
            <Text style={styles.priceUnit}>/ day</Text>
          </View>
          <View style={styles.specsRow}>
            <View style={styles.specItem}>
              <MaterialIcons name="airline-seat-recline-extra" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.specText}>{item.nb_places || 5}</Text>
            </View>
            <View style={styles.specItem}>
              <MaterialIcons name="settings-input-component" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.specText}>{item.transmission || 'Auto'}</Text>
            </View>
            <View style={styles.specItem}>
              <MaterialIcons name={item.carburant === 'Électrique' ? 'local-gas-station' : 'speed'} size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.specText}>{item.carburant || 'Essence'}</Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.bookButton} activeOpacity={0.8} onPress={() => navigation.navigate('BookingForm', { vehicle: item })}>
              <Text style={styles.bookButtonText}>Book Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.favoriteButton} activeOpacity={0.7}>
              <MaterialIcons name="favorite-border" size={22} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      <View style={styles.filterCard}>
        <View style={styles.filterRow}>
          <MaterialIcons name="location-on" size={20} color={theme.colors.primary} />
          <View style={styles.filterField}>
            <Text style={styles.filterLabel}>PICKUP LOCATION</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Search by plate, brand..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>
        <View style={styles.filterDivider} />
        <View style={styles.filterRow}>
          <MaterialIcons name="calendar-today" size={20} color={theme.colors.primary} />
          <View style={styles.filterField}>
            <Text style={styles.filterLabel}>DATES</Text>
            <Text style={styles.dateText}>{formatDate(startDate)} - {formatDate(endDate)}</Text>
          </View>
          <TouchableOpacity style={styles.tuneButton} activeOpacity={0.8}>
            <MaterialIcons name="tune" size={20} color={theme.colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
            onPress={() => setSelectedCategory(cat)}
            activeOpacity={0.7}
          >
            <Text style={[styles.categoryPillText, selectedCategory === cat && styles.categoryPillTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Available Fleet</Text>
        <Text style={styles.sectionCount}>{filtered.length} vehicles</Text>
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
        renderItem={renderVehicleCard}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Aucun véhicule disponible</Text>}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  list: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  filterCard: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  filterField: {
    flex: 1,
  },
  filterLabel: {
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 0.5,
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  filterInput: {
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSize.md,
    color: theme.colors.onSurface,
    padding: 0,
  },
  filterDivider: {
    height: 1,
    backgroundColor: theme.colors.outlineVariant,
    marginVertical: theme.spacing.sm,
    opacity: 0.5,
  },
  dateText: {
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSize.md,
    color: theme.colors.onSurface,
  },
  tuneButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  categoriesContainer: {
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  categoryPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryPillText: {
    fontFamily: theme.fonts.label,
    fontSize: theme.fontSize.sm,
    color: theme.colors.onSurfaceVariant,
  },
  categoryPillTextActive: {
    color: theme.colors.onPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    fontFamily: theme.fonts.headlineBold,
    fontSize: theme.fontSize.xl,
    color: theme.colors.onSurface,
  },
  sectionCount: {
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSize.sm,
    color: theme.colors.onSurfaceVariant,
  },
  card: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  imageArea: {
    height: 224,
    backgroundColor: theme.colors.surfaceContainerHigh,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: 4,
  },
  ratingText: {
    fontFamily: theme.fonts.bodySemibold,
    fontSize: theme.fontSize.sm,
    color: theme.colors.onSurface,
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  vehicleName: {
    fontFamily: theme.fonts.headlineBold,
    fontSize: theme.fontSize.lg,
    color: theme.colors.primary,
  },
  vehicleType: {
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSize.sm,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
    marginBottom: theme.spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing.sm,
  },
  priceValue: {
    fontFamily: theme.fonts.headlineBold,
    fontSize: theme.fontSize.xl,
    color: theme.colors.primary,
  },
  priceUnit: {
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSize.sm,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 4,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSize.sm,
    color: theme.colors.onSurfaceVariant,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  bookButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    fontFamily: theme.fonts.bodySemibold,
    fontSize: theme.fontSize.md,
    color: theme.colors.onPrimary,
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.xl,
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSize.md,
  },
});
