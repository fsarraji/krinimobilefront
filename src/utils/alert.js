import { Alert as NativeAlert, Platform } from 'react-native';

function handleButtons(message, buttons) {
  if (!buttons || buttons.length === 0) return;
  if (buttons.length === 1) {
    if (buttons[0].onPress) buttons[0].onPress();
    return;
  }
  const confirmBtn = buttons.find((b) => b.onPress);
  if (confirmBtn) {
    if (typeof window !== 'undefined' && window.confirm(message)) {
      confirmBtn.onPress();
    }
    return;
  }
  if (buttons[0] && buttons[0].onPress) buttons[0].onPress();
}

function alert(title, message, buttons) {
  if (Platform.OS === 'web') {
    const text = message || title || '';
    if (buttons && buttons.length > 1) {
      handleButtons(text, buttons);
    } else {
      if (typeof window !== 'undefined') window.alert(text);
      if (buttons && buttons.length === 1 && buttons[0].onPress) buttons[0].onPress();
    }
    return;
  }
  NativeAlert.alert(title, message, buttons);
}

export const Alert = { alert };
