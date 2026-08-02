import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../api';
import theme from '../theme';
import { useAuth } from '../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(280, SCREEN_WIDTH * 0.7);

export default function ContractFormScreen({ navigation }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [vehicles, setVehicles] = useState([]);
  const [clients, setClients] = useState([]);
  const [settings, setSettings] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [vehRes, cliRes, setRes] = await Promise.all([
          api.get('vehicles/', { params: { page_size: 500 } }).catch(() => ({ data: [] })),
          api.get('clients/', { params: { page_size: 500 } }).catch(() => ({ data: [] })),
          api.get('agency/settings/').catch(() => ({ data: null })),
        ]);
        setVehicles(vehRes.data.results || vehRes.data || []);
        setClients(cliRes.data.results || cliRes.data || []);
        setSettings(setRes.data);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedVehicle && selectedClient) setStep(3);
    else if (selectedVehicle) setStep(2);
    else setStep(1);
  }, [selectedVehicle, selectedClient]);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const availableVehicles = vehicles.filter(v => v.statut === 'Available' || v.statut === 'available');

  const filteredClients = clients.filter(c => {
    if (!clientSearch.trim()) return true;
    const q = clientSearch.toLowerCase();
    const fullName = `${c.prenom || ''} ${c.nom || ''}`.toLowerCase();
    return fullName.includes(q) || (c.permis && c.permis.toLowerCase().includes(q));
  });

  const getDays = () => {
    const diff = endDate.getTime() - startDate.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getTotal = () => {
    if (!selectedVehicle) return 0;
    return selectedVehicle.prix_par_jour * getDays();
  };

  const handleCreate = async () => {
    if (!selectedVehicle || !selectedClient) {
      Alert.alert('Erreur', 'Veuillez sélectionner un véhicule et un client');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        vehicle: selectedVehicle.id,
        client: selectedClient.id,
        date_sortie: startDate.toISOString(),
        date_retour_prevue: endDate.toISOString(),
        prix_par_jour: selectedVehicle.prix_par_jour,
        jours: getDays(),
        caution: settings?.caution_montant || 0,
        km_sortie: selectedVehicle.kilometrage || 0,
        statut: 'EN_COURS',
      };
      await api.post('contracts/', payload);
      Alert.alert('Succès', 'Contrat créé avec succès', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      const detail = e.response?.data?.detail || JSON.stringify(e.response?.data) || 'Erreur lors de la création';
      Alert.alert('Erreur', detail);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(date);
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.stepHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau Contrat</Text>
        <Text style={styles.stepLabel}>Étape {step}/4</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="directions-car" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Sélection du Véhicule</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{availableVehicles.length} disponibles</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRow}>
            {availableVehicles.length === 0 && (
              <Text style={styles.emptyText}>No vehicles available</Text>
            )}
            {availableVehicles.map(v => {
              const isSelected = selectedVehicle?.id === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
                  onPress={() => setSelectedVehicle(v)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardImageWrap}>
                    <MaterialIcons name="directions-car" size={40} color={theme.colors.outline} />
                    <View style={styles.classBadge}>
                      <Text style={styles.classBadgeText}>{v.categorie || 'Standard'}</Text>
                    </View>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.vehicleName} numberOfLines={1}>{v.nom || v.matricule}</Text>
                    <View style={styles.vehicleMeta}>
                      <Text style={styles.vehiclePlate}>{v.matricule}</Text>
                      <Text style={styles.vehicleFuel}>{v.carburant}</Text>
                    </View>
                    <Text style={styles.vehiclePrice}>{v.prix_par_jour} DH/j</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="person" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Informations Client</Text>
            </View>
          </View>
          <View style={styles.searchWrap}>
            <MaterialIcons name="search" size={18} color={theme.colors.outline} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher par nom ou téléphone..."
              placeholderTextColor={theme.colors.outline}
              value={clientSearch}
              onChangeText={setClientSearch}
            />
          </View>
          {filteredClients.length === 0 ? (
            <Text style={styles.emptyText}>Aucun client trouvé</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.clientRow}>
              {filteredClients.map(c => {
                const isSelected = selectedClient?.id === c.id;
                const fullName = `${c.prenom || ''} ${c.nom || ''}`.trim();
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.clientCard, isSelected && styles.clientCardSelected]}
                    onPress={() => { setSelectedClient(c); setClientSearch(''); }}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.clientAvatar, isSelected && styles.clientAvatarSelected]}>
                      <Text style={[styles.clientAvatarText, isSelected && styles.clientAvatarTextSelected]}>
                        {getInitials(fullName)}
                      </Text>
                    </View>
                    <View style={styles.clientInfo}>
                      <Text style={styles.clientName} numberOfLines={1}>{fullName}</Text>
                      <Text style={styles.clientLicense}>{c.permis || 'N/A'}</Text>
                    </View>
                    {isSelected && (
                      <Text style={{ fontSize: 22 }}>✅</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="calendar-today" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Période de Location</Text>
            </View>
          </View>
          <View style={styles.dateRow}>
            <View style={styles.dateCard}>
              <View style={styles.dateIconCircle}>
                <MaterialIcons name="calendar-today" size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.dateLabel}>Date de début</Text>
              <Text style={styles.dateValue}>{formatDate(startDate)}</Text>
            </View>
            <View style={styles.dateCard}>
              <View style={styles.dateIconCircle}>
                <MaterialIcons name="event-available" size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.dateLabel}>Date de fin</Text>
              <Text style={styles.dateValue}>{formatDate(endDate)}</Text>
            </View>
          </View>
          <View style={styles.infoBanner}>
            <MaterialIcons name="info" size={18} color={theme.colors.primary} style={styles.infoBannerIcon} />
            <Text style={styles.infoBannerText}>
              Location min. 1 jour. Retard peut entraîner des frais supplémentaires.
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomInner}>
          <View style={styles.bottomLeft}>
            <Text style={styles.bottomLabel}>Total Estimé</Text>
            <Text style={styles.bottomTotal}>{getTotal()} DH</Text>
            {selectedVehicle && (
              <Text style={styles.bottomVehicle}>{selectedVehicle.nom || selectedVehicle.matricule}</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.generateBtn, (!selectedVehicle || !selectedClient) && styles.generateBtnDisabled]}
            onPress={handleCreate}
            disabled={saving || !selectedVehicle || !selectedClient}
          >
            {saving ? (
              <ActivityIndicator color={theme.colors.primary} size="small" />
            ) : (
              <>
                <MaterialIcons name="description" size={18} color={theme.colors.primary} />
                <Text style={styles.generateText}>Générer le contrat</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: theme.fontSize.xl,
    fontFamily: theme.fonts.headlineBold,
    color: theme.colors.onSurface,
  },
  stepLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: theme.fonts.label,
    color: theme.colors.onSurfaceVariant,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 0,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.bodySemibold,
    color: theme.colors.onSurface,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
    paddingBottom: 12,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.label,
    color: theme.colors.primary,
  },
  cardRow: {
    paddingVertical: theme.spacing.xs,
    gap: 12,
  },
  vehicleCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadow.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vehicleCardSelected: {
    borderColor: theme.colors.primary,
  },
  cardImageWrap: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: '#e8eaed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  classBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  classBadgeText: {
    fontSize: 10,
    fontFamily: theme.fonts.label,
    color: theme.colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: 12,
  },
  vehicleName: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.headlineBold,
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  vehicleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  vehiclePlate: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.body,
    color: theme.colors.onSurfaceVariant,
  },
  vehicleFuel: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.body,
    color: theme.colors.onSurfaceVariant,
  },
  vehiclePrice: {
    fontSize: theme.fontSize.lg,
    fontFamily: theme.fonts.headlineBold,
    color: theme.colors.primary,
    textAlign: 'right',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.body,
    color: theme.colors.onSurface,
  },
  clientRow: {
    paddingVertical: theme.spacing.xs,
    gap: 12,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    minWidth: 220,
    ...theme.shadow.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  clientCardSelected: {
    borderColor: theme.colors.primary,
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  clientAvatarSelected: {
    backgroundColor: theme.colors.primary,
  },
  clientAvatarText: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.bodySemibold,
    color: theme.colors.primary,
  },
  clientAvatarTextSelected: {
    color: '#fff',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: theme.fontSize.md,
    fontFamily: theme.fonts.bodySemibold,
    color: theme.colors.onSurface,
  },
  clientLicense: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.body,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.body,
    paddingVertical: 20,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.md,
    padding: 14,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  dateIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: theme.fontSize.xs,
    fontFamily: theme.fonts.label,
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.bodySemibold,
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eef1ff',
    borderRadius: theme.borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    padding: 12,
    marginTop: 12,
  },
  infoBannerIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  infoBannerText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.body,
    color: theme.colors.primary,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 34 : 14,
    paddingHorizontal: theme.spacing.md,
  },
  bottomInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomLeft: {
    flex: 1,
    marginRight: 12,
  },
  bottomLabel: {
    fontSize: 10,
    fontFamily: theme.fonts.label,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomTotal: {
    fontSize: theme.fontSize.xl,
    fontFamily: theme.fonts.headlineBold,
    color: '#fff',
    marginTop: 2,
  },
  bottomVehicle: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.body,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  generateBtnDisabled: {
    opacity: 0.5,
  },
  generateText: {
    fontSize: theme.fontSize.sm,
    fontFamily: theme.fonts.bodySemibold,
    color: theme.colors.primary,
  },
});
