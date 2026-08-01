import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import api, { getCached, setCached } from '../api';

export function useData(url, { force = false } = {}) {
  const [data, setData] = useState(() => (force ? undefined : getCached(url)));
  const [loading, setLoading] = useState(() => (force ? true : getCached(url) === undefined));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (mode) => {
      const isRefresh = mode === 'refresh';
      if (isRefresh) setRefreshing(true);
      else if (getCached(url) === undefined) setLoading(true);
      try {
        const res = await api.get(url);
        setCached(url, res.data);
        setData(res.data);
        setError(null);
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [url]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { data, loading, refreshing, error, refresh: () => load('refresh'), reload: () => load() };
}
