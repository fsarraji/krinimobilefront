import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import LoginScreen from '../screens/LoginScreen';
import TabNavigator from './TabNavigator';
import VehicleFormScreen from '../screens/VehicleFormScreen';
import ClientFormScreen from '../screens/ClientFormScreen';
import DocumentScanScreen from '../screens/DocumentScanScreen';
import ContractFormScreen from '../screens/ContractFormScreen';
import EditContractScreen from '../screens/EditContractScreen';
import ReservationFormScreen from '../screens/ReservationFormScreen';
import CloseContractScreen from '../screens/CloseContractScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AgencyManagementScreen from '../screens/AgencyManagementScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';

const Stack = createNativeStackNavigator();

const commonScreenOptions = {
  headerStyle: { backgroundColor: '#fff' },
  headerTintColor: '#202124',
  headerTitleStyle: { fontWeight: '600', fontSize: 17 },
  headerShadowVisible: false,
};

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={commonScreenOptions}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Home" component={TabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="VehicleForm" component={VehicleFormScreen} options={{ title: 'Véhicule' }} />
            <Stack.Screen name="ClientForm" component={ClientFormScreen} options={{ title: 'Client' }} />
            <Stack.Screen name="DocumentScan" component={DocumentScanScreen} options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="ContractForm" component={ContractFormScreen} options={{ title: 'Nouveau contrat' }} />
            <Stack.Screen name="EditContract" component={EditContractScreen} options={{ title: 'Modifier contrat' }} />
            <Stack.Screen name="ReservationForm" component={ReservationFormScreen} options={{ title: 'Nouvelle réservation' }} />
            <Stack.Screen name="CloseContract" component={CloseContractScreen} options={{ title: 'Clôturer contrat' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Paramètres' }} />
            <Stack.Screen name="AgencyManagement" component={AgencyManagementScreen} options={{ title: 'Agences' }} />
            <Stack.Screen name="UserManagement" component={UserManagementScreen} options={{ title: 'Utilisateurs' }} />
            <Stack.Screen name="Marketplace" component={MarketplaceScreen} options={{ title: 'Marché' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
