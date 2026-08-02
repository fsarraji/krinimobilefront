import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '../theme';

import ClientHomeScreen from '../screens/ClientHomeScreen';
import ClientReservationsScreen from '../screens/ClientReservationsScreen';
import ClientProfileScreen from '../screens/ClientProfileScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'ClientHome', label: 'Accueil', icon: 'directions-car', component: ClientHomeScreen },
  { name: 'ClientReservations', label: 'Mes réservations', icon: 'event-note', component: ClientReservationsScreen },
  { name: 'ClientProfile', label: 'Profil', icon: 'person', component: ClientProfileScreen },
];

function Header({ navigation, route }) {
  const tab = TABS.find((t) => t.name === route.name);
  return (
    <View style={headerStyles.container}>
      <View style={headerStyles.left}>
        <View style={headerStyles.logoBox}>
          <MaterialIcons name="directions-car" size={18} color="#fff" />
        </View>
        <Text style={headerStyles.title}>Krini</Text>
      </View>
      <Text style={headerStyles.subtitle}>{tab?.label || ''}</Text>
    </View>
  );
}

function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[tabBarStyles.container, { paddingBottom: insets.bottom + 6 }]}>
      {state.routes.map((route, index) => {
        const tab = TABS.find((t) => t.name === route.name);
        const isFocused = state.index === index;
        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={tabBarStyles.tab}
            activeOpacity={0.7}
          >
            <MaterialIcons name={tab.icon} size={22} color={isFocused ? theme.colors.primary : theme.colors.navInactive} />
            <Text style={[tabBarStyles.label, isFocused && tabBarStyles.labelActive]} numberOfLines={1}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function ClientNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        header: ({ navigation, route }) => <Header navigation={navigation} route={route} />,
        headerStyle: { backgroundColor: theme.colors.background },
        headerShadowVisible: false,
      }}
    >
      {TABS.map((tab) => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} />
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
    zIndex: 10,
    elevation: 4,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: { width: 32, height: 32, backgroundColor: theme.colors.primary, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: theme.fonts.headlineBold, fontSize: 20, color: theme.colors.primary, letterSpacing: -0.5 },
  subtitle: { fontFamily: theme.fonts.bodySemibold, fontSize: 13, color: theme.colors.onSurfaceVariant },
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
  label: { fontFamily: 'Manrope_700Bold', fontSize: 10, color: theme.colors.navInactive, letterSpacing: -0.2, textAlign: 'center' },
  labelActive: { color: theme.colors.primary },
});
