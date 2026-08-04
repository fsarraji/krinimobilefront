import { AppState } from 'react-native';
import { resolveApiUrl } from './apiUrl';

const API_URL = resolveApiUrl(process.env.EXPO_PUBLIC_API_URL, 'https://kriniback.onrender.com/api/');
const PING_INTERVAL = 10 * 60 * 1000;

let timer = null;
let appStateListener = null;

async function ping() {
  try {
    await fetch(`${API_URL}`, { method: 'HEAD' });
  } catch (e) {
    // Silencieux : le backend est peut-être en train de démarrer
  }
}

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    ping();
    schedule();
  }, PING_INTERVAL);
}

export function startHeartbeat() {
  ping();
  schedule();
  appStateListener = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active') ping();
  });
}

export function stopHeartbeat() {
  clearTimeout(timer);
  if (appStateListener) appStateListener.remove();
}
