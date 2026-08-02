import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';

export default function ClientAuthScreen({ navigation }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    try {
      const userData = await login(username, password);
      if (userData.role !== 'CLIENT') {
        Alert.alert('Compte incorrect', 'Ce compte n\'est pas un compte client. Utilisez la connexion professionnelle.');
      }
    } catch (e) {
      Alert.alert('Erreur', e.response?.data?.detail || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>

        <View style={styles.logoBox}>
          <MaterialIcons name="person" size={30} color={theme.colors.onPrimary} />
        </View>
        <Text style={styles.title}>Espace client</Text>
        <Text style={styles.subtitle}>Connectez-vous pour réserver un véhicule</Text>

        <TextInput
          style={styles.input}
          placeholder="Email ou téléphone"
          placeholderTextColor={theme.colors.outline}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={theme.colors.outline}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCorrect={false}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Se connecter</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.registerButton} onPress={() => navigation.navigate('ClientRegister')} activeOpacity={0.8}>
          <Text style={styles.registerText}>Pas encore de compte ? <Text style={styles.registerLink}>Créer un compte</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  backButton: { position: 'absolute', top: 60, left: 24 },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: theme.fonts.headlineBold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: theme.fonts.body,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.onSurface,
    marginBottom: 16,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    ...theme.shadow.card,
  },
  buttonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontFamily: theme.fonts.bodySemibold,
  },
  registerButton: { alignItems: 'center', marginTop: 24 },
  registerText: { fontSize: 14, fontFamily: theme.fonts.body, color: theme.colors.onSurfaceVariant },
  registerLink: { fontFamily: theme.fonts.bodySemibold, color: theme.colors.primary },
});
