import { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';

import DashboardScreen from '../screens/DashboardScreen';
import VehiclesScreen from '../screens/VehiclesScreen';
import ClientsScreen from '../screens/ClientsScreen';
import ContractsScreen from '../screens/ContractsScreen';
import ReservationsScreen from '../screens/ReservationsScreen';
import CalendarScreen from '../screens/CalendarScreen';
import PaymentsScreen from '../screens/PaymentsScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import MoreScreen from '../screens/MoreScreen';

const Tab = createBottomTabNavigator();

const VISIBLE_TABS = [
  { name: 'Dashboard', label: 'Accueil', icon: 'dashboard', component: DashboardScreen },
  { name: 'Fleet', label: 'Véhicules', icon: 'directions-car', component: VehiclesScreen },
  { name: 'More', label: 'Plus', icon: 'apps', component: MoreScreen, isMore: true },
  { name: 'Clients', label: 'Clients', icon: 'group', component: ClientsScreen },
  { name: 'Contracts', label: 'Contrats', icon: 'description', component: ContractsScreen },
];

const HIDDEN_TABS = [
  { name: 'Reservations', label: 'Réservations', icon: 'event-note', component: ReservationsScreen },
  { name: 'Calendar', label: 'Calendrier', icon: 'calendar-today', component: CalendarScreen },
  { name: 'Payments', label: 'Paiements', icon: 'payments', component: PaymentsScreen },
  { name: 'Expenses', label: 'Dépenses', icon: 'receipt-long', component: ExpensesScreen },
];

const ALL_TABS = [...VISIBLE_TABS, ...HIDDEN_TABS];

function Header({ navigation }) {
  const { user, logout, isSuperAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={headerStyles.container}>
      <View style={headerStyles.left}>
        <View style={headerStyles.logoBox}>
          <MaterialIcons name="directions-car" size={18} color="#fff" />
        </View>
        <Text style={headerStyles.title}>Krini</Text>
      </View>
      <View style={headerStyles.right}>
        {isSuperAdmin && (
          <>
            <TouchableOpacity onPress={() => navigation.navigate('AgencyManagement')} style={headerStyles.link}>
              <Text style={headerStyles.linkText}>Agences</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('UserManagement')} style={headerStyles.link}>
              <Text style={headerStyles.linkText}>Users</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity style={headerStyles.iconBtn}>
          <MaterialIcons name="notifications" size={22} color={theme.colors.onSurfaceVariant} />
          <View style={headerStyles.badge} />
        </TouchableOpacity>
        <View>
          <TouchableOpacity onPress={() => setMenuOpen(o => !o)} style={headerStyles.avatar}>
            <Text style={headerStyles.avatarText}>
              {user?.username ? user.username.charAt(0).toUpperCase() : 'K'}
            </Text>
          </TouchableOpacity>
          {menuOpen && (
            <>
              <TouchableOpacity style={headerStyles.overlay} activeOpacity={1} onPress={() => setMenuOpen(false)} />
              <View style={headerStyles.menu}>
                <View style={headerStyles.menuHeader}>
                  <View style={headerStyles.menuAvatar}>
                    <Text style={headerStyles.menuAvatarText}>
                      {user?.username ? user.username.charAt(0).toUpperCase() : 'K'}
                    </Text>
                  </View>
                  <View style={headerStyles.menuHeaderInfo}>
                    <Text style={headerStyles.menuUsername} numberOfLines={1}>{user?.username || 'Utilisateur'}</Text>
                    <Text style={headerStyles.menuRole}>{user?.role || '—'}</Text>
                  </View>
                </View>
                <View style={headerStyles.menuDivider} />
                <TouchableOpacity
                  style={headerStyles.menuItem}
                  onPress={() => { setMenuOpen(false); navigation.navigate('Settings'); }}
                >
                  <MaterialIcons name="settings" size={18} color={theme.colors.primary} />
                  <Text style={headerStyles.menuItemText}>Paramètres compte</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[headerStyles.menuItem, headerStyles.menuItemDanger]}
                  onPress={() => { setMenuOpen(false); logout(); }}
                >
                  <MaterialIcons name="logout" size={18} color={theme.colors.error} />
                  <Text style={headerStyles.menuItemTextDanger}>Déconnexion</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();

  const handlePress = (route, isFocused) => {
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const isHiddenTabFocused = HIDDEN_TABS.some((t) => t.name === state.routes[state.index]?.name);

  return (
    <View style={[tabBarStyles.container, { paddingBottom: insets.bottom + 6 }]}>
      {state.routes.map((route) => {
        const tab = VISIBLE_TABS.find((t) => t.name === route.name);
        if (!tab) return null;

        const isFocused = state.routes[state.index]?.name === route.name;

        if (tab.isMore) {
          const moreActive = isFocused || isHiddenTabFocused;
          return (
            <TouchableOpacity key={route.key} onPress={() => handlePress(route, isFocused)} style={tabBarStyles.moreSlot} activeOpacity={0.85}>
              <View style={[tabBarStyles.moreButton, moreActive && tabBarStyles.moreButtonActive]}>
                <MaterialIcons name="grid-view" size={26} color="#fff" />
              </View>
              <Text style={[tabBarStyles.label, moreActive && tabBarStyles.labelActive]}>Plus</Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity key={route.key} onPress={() => handlePress(route, isFocused)} style={tabBarStyles.tab} activeOpacity={0.7}>
            <MaterialIcons name={tab.icon} size={22} color={isFocused ? theme.colors.primary : theme.colors.navInactive} />
            <Text style={[tabBarStyles.label, isFocused && tabBarStyles.labelActive]} numberOfLines={1}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabNavigator({ navigation: stackNavigation }) {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        header: () => <Header navigation={stackNavigation} />,
        headerStyle: { backgroundColor: theme.colors.background },
        headerShadowVisible: false,
      }}
    >
      {ALL_TABS.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={HIDDEN_TABS.some((t) => t.name === tab.name) ? { tabBarButton: () => null } : undefined}
        />
      ))}
    </Tab.Navigator>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(247, 249, 251, 0.9)',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 54 : 48,
    paddingBottom: 12,
    borderBottomWidth: 0,
    zIndex: 10,
    elevation: 4,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: { width: 40, height: 40, backgroundColor: theme.colors.secondary, borderRadius: theme.borderRadius.md, alignItems: 'center', justifyContent: 'center', ...theme.shadow.card },
  title: { fontFamily: theme.fonts.headlineBold, fontSize: 20, color: theme.colors.onSurface, letterSpacing: -0.5 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  link: { marginRight: 4, paddingHorizontal: 6, paddingVertical: 4 },
  linkText: { fontFamily: theme.fonts.bodySemibold, fontSize: 12, color: theme.colors.secondary },
  iconBtn: { position: 'relative', padding: 4 },
  badge: { position: 'absolute', top: 3, right: 3, width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.error },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: theme.fonts.bodyBold, fontSize: 15, color: theme.colors.onSurface },
  overlay: { position: 'absolute', top: -80, right: -90, left: -300, bottom: -1000, backgroundColor: 'transparent' },
  menu: {
    position: 'absolute',
    top: 44,
    right: 0,
    width: 240,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    paddingVertical: 8,
    ...theme.shadow.editorial,
    borderWidth: 1,
    borderColor: 'rgba(197, 197, 211, 0.15)',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuAvatarText: { fontFamily: theme.fonts.bodyBold, fontSize: 16, color: theme.colors.primary },
  menuHeaderInfo: { flex: 1 },
  menuUsername: { fontFamily: theme.fonts.bodySemibold, fontSize: 14, color: theme.colors.onSurface },
  menuRole: { fontFamily: theme.fonts.body, fontSize: 11, color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  menuDivider: { height: 1, backgroundColor: 'rgba(197, 197, 211, 0.15)', marginVertical: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  menuItemText: { fontFamily: theme.fonts.bodySemibold, fontSize: 14, color: theme.colors.onSurface },
  menuItemDanger: { borderTopWidth: 1, borderTopColor: 'rgba(197, 197, 211, 0.15)' },
  menuItemTextDanger: { fontFamily: theme.fonts.bodySemibold, fontSize: 14, color: theme.colors.error },
});

const tabBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(197, 197, 211, 0.1)',
    paddingTop: 8,
    paddingHorizontal: 4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.04, shadowRadius: 30 },
      android: { elevation: 8 },
    }),
  },
  tab: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 2 },
  moreSlot: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 2 },
  moreButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -26,
    borderWidth: 4,
    borderColor: theme.colors.background,
    ...theme.shadow.editorial,
  },
  moreButtonActive: { backgroundColor: theme.colors.secondaryContainer },
  label: { fontFamily: 'Manrope_700Bold', fontSize: 10, color: theme.colors.navInactive, letterSpacing: -0.2, textAlign: 'center' },
  labelActive: { color: theme.colors.primary },
});
