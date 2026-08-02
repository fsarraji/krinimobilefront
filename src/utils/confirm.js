import { Alert, Platform } from 'react-native';

export function confirmDialog(message, onConfirm, title = 'Confirmation') {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(message)) {
      onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: 'Non', style: 'cancel' },
    { text: 'Oui', style: 'destructive', onPress: onConfirm },
  ]);
}
