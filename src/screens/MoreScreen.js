import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';

const MORE_SECTIONS = [
  { name: 'Reservations', label: 'Réservations', icon: 'event-note', hint: 'Liste des réservations', bg: theme.colors.primaryLight, color: theme.colors.primary },
  { name: 'Calendar', label: 'Calendrier', icon: 'calendar-today', hint: 'Vue Gantt des véhicules', bg: '#fff3e0', color: '#e65100' },
  { name: 'Payments', label: 'Paiements', icon: 'payments', hint: 'Encaissements clients', bg: '#e8f5e9', color: '#2e7d32' },
  { name: 'Expenses', label: 'Dépenses', icon: 'receipt-long', hint: 'Charges et frais', bg: '#fce4ec', color: '#c2185b' },
  { name: 'Settings', label: 'Paramètres', icon: 'settings', hint: "Préférences de l'agence", bg: '#ede7f6', color: '#4527a0' },
];

export default function MoreScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Plus</Text>
      <Text style={styles.subtitle}>Toutes les sections de l'application</Text>
      <View style={styles.grid}>
        {MORE_SECTIONS.map((section) => (
          <TouchableOpacity key={section.name} style={styles.card} activeOpacity={0.7} onPress={() => navigation.navigate(section.name)}>
            <View style={[styles.iconBox, { backgroundColor: section.bg }]}>
              <MaterialIcons name={section.icon} size={26} color={section.color} />
            </View>
            <Text style={styles.cardLabel}>{section.label}</Text>
            <Text style={styles.cardHint}>{section.hint}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  title: {
    fontFamily: theme.fonts.headlineBold,
    fontSize: theme.fontSize.title,
    color: theme.colors.onSurface,
    marginTop: theme.spacing.sm,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: theme.fontSize.md,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
    marginBottom: theme.spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48.5%',
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
    borderWidth: 1,
    borderColor: 'rgba(197,197,211,0.1)',
  },
  iconBox: { width: 48, height: 48, borderRadius: theme.borderRadius.md, justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.sm },
  cardLabel: { fontFamily: theme.fonts.bodySemibold, fontSize: theme.fontSize.md, color: theme.colors.onSurface },
  cardHint: { fontFamily: theme.fonts.body, fontSize: theme.fontSize.xs, color: theme.colors.onSurfaceVariant, marginTop: 2 },
});
