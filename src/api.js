import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://kriniback.onrender.com/api/';

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
});

let isRefreshing = false;
let pendingQueue = [];
let authErrorHandler = null;

export const setAuthErrorHandler = (fn) => {
  authErrorHandler = fn;
};

const processQueue = (error) => {
  pendingQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()));
  pendingQueue = [];
};

async function getValidToken() {
  const token = await AsyncStorage.getItem('access_token');
  if (!token) return null;

  try {
    const { exp } = jwtDecode(token);
    const expiresIn = exp * 1000 - Date.now();
    if (expiresIn > 5 * 60 * 1000) return token;
  } catch (e) {
    return token;
  }

  const refreshToken = await AsyncStorage.getItem('refresh_token');
  if (!refreshToken) return token;

  try {
    const { data } = await axios.post(`${API_URL}token/refresh/`, { refresh: refreshToken });
    await AsyncStorage.setItem('access_token', data.access);
    return data.access;
  } catch (e) {
    return token;
  }
}

api.interceptors.request.use(async (config) => {
  const token = await getValidToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (!original || status !== 401 || original._retry || original.url?.includes('token/')) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) throw new Error('No refresh token');

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then(() => api(original));
      }

      isRefreshing = true;
      const { data } = await axios.post(`${API_URL}token/refresh/`, { refresh: refreshToken });
      await AsyncStorage.setItem('access_token', data.access);
      processQueue(null);
      isRefreshing = false;
      return api(original);
    } catch (e) {
      processQueue(e);
      isRefreshing = false;
      await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
      authErrorHandler?.();
      return Promise.reject(error);
    }
  }
);

const cacheStore = new Map();
const CACHE_TTL = 60 * 1000;

export const getCached = (url) => {
  const entry = cacheStore.get(url);
  if (entry && Date.now() - entry.t < CACHE_TTL) return entry.data;
  return undefined;
};

export const setCached = (url, data) => {
  cacheStore.set(url, { t: Date.now(), d: data });
};

export const invalidate = (url) => {
  cacheStore.delete(url);
};

api.cachedGet = async (url) => {
  const cached = getCached(url);
  if (cached !== undefined) return cached;
  const res = await api.get(url);
  setCached(url, res.data);
  return res.data;
};

api.forceGet = async (url) => {
  const res = await api.get(url);
  setCached(url, res.data);
  return res.data;
};

export const setTokens = async (access, refresh) => {
  await AsyncStorage.setItem('access_token', access);
  if (refresh) await AsyncStorage.setItem('refresh_token', refresh);
};

export const clearTokens = async () => {
  await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
};

export const setUser = async (user) => {
  await AsyncStorage.setItem('user', JSON.stringify(user));
};

export const getUser = async () => {
  const user = await AsyncStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export default api;
