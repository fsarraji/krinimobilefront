import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import api, { setTokens, clearTokens, setUser, getUser } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        const decoded = jwtDecode(token);
        const storedUser = await getUser();
        setUserState(storedUser || decoded);
      }
    } catch (e) {
      await clearTokens();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const res = await api.post('token/', { username, password });
    const { access, refresh } = res.data;
    await setTokens(access, refresh);
    const decoded = jwtDecode(access);
    const userData = {
      username: decoded.username,
      role: decoded.role,
      agency_id: decoded.agency_id,
      agency_name: decoded.agency_name,
    };
    await setUser(userData);
    setUserState(userData);
    return userData;
  };

  const logout = async () => {
    await clearTokens();
    setUserState(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isSuperAdmin: user?.role === 'SUPERADMIN', isOwner: user?.role === 'OWNER' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
