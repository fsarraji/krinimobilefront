# Krini Mobil - React Native (Expo SDK 57)

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## API
- Base URL: `EXPO_PUBLIC_API_URL` (env), defaults to `https://kriniback.onrender.com/api/`
- Auth: JWT (access + refresh tokens) stored in AsyncStorage
- Axios instance in `src/api.js` with Bearer token interceptor

## Architecture
- `src/api.js` - Axios instance + token management
- `src/context/AuthContext.js` - Auth state (login, logout, user)
- `src/navigation/AppNavigator.js` - Main stack navigator
- `src/navigation/TabNavigator.js` - Bottom tab navigator (8 tabs)
- `src/screens/` - All screen components (16 screens)
- `src/components/` - Reusable components (FuelGaugeSelector, LoadingSpinner)

## Key Files
- `App.js` - Entry point (wraps AuthProvider + AppNavigator)
- `src/theme.js` - Design tokens (colors, spacing, typography)
- `src/api.js` - API service with JWT interceptor

## Screens
1. LoginScreen - JWT authentication
2. DashboardScreen - KPIs, alerts, recent contracts
3. VehiclesScreen - Fleet list with FAB for add
4. VehicleFormScreen - Add/edit vehicle
5. ClientsScreen - Client directory
6. ClientFormScreen - Add/edit client
7. ContractsScreen - Contract list with close action
8. ContractFormScreen - New contract creation
9. EditContractScreen - Contract details + payments
10. CloseContractScreen - Vehicle return wizard
11. ReservationsScreen - RESERVE contracts list
12. ReservationFormScreen - 3-step reservation
13. CalendarScreen - Gantt-style calendar
14. PaymentsScreen - Payment list with totals
15. ExpensesScreen - Add/list expenses
16. SettingsScreen - Agency settings (caution, km)
17. AgencyManagementScreen - SUPERADMIN CRUD agencies
18. UserManagementScreen - SUPERADMIN CRUD users
19. MarketplaceScreen - Public vehicle listing (no auth)
