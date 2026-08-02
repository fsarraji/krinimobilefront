import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api';

export function usePaginatedList(baseUrl, { pageSize = 10, search = '', filters = {}, enabled = true } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [next, setNext] = useState(null);
  const [total, setTotal] = useState(null);
  const [error, setError] = useState(null);
  const [queryKey, setQueryKey] = useState('');
  const searchRef = useRef(search);
  const filtersRef = useRef(filters);
  const initialRun = useRef(true);
  const filterKey = JSON.stringify(filters);
  const totalPages = total == null ? null : Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => { searchRef.current = search; }, [search]);
  useEffect(() => { filtersRef.current = filters; }, [filters]);

  useEffect(() => {
    const t = setTimeout(() => {
      setQueryKey(`${search.trim()}|${filterKey}`);
    }, 300);
    return () => clearTimeout(t);
  }, [search, filterKey]);

  const buildUrl = useCallback((page = 1) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('page_size', String(pageSize));
    if (searchRef.current.trim()) params.set('search', searchRef.current.trim());
    Object.entries(filtersRef.current).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    });
    const qs = params.toString();
    return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${qs}`;
  }, [baseUrl, pageSize]);

  const fetchPage = useCallback(async (page, { append = false } = {}) => {
    const url = buildUrl(page);
    try {
      const res = await api.get(url);
      const pageData = res.data.results || res.data || [];
      setItems(prev => (append ? [...prev, ...pageData] : pageData));
      setPage(page);
      setNext(res.data.next || null);
      setTotal(res.data.count ?? null);
      setError(null);
      return res.data;
    } catch (e) {
      setError(e);
      throw e;
    }
  }, [buildUrl]);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      await fetchPage(1, { append: false });
    } catch (e) { /* handled */ } finally {
      setLoading(false);
    }
  }, [enabled, fetchPage]);

  const loadMore = useCallback(async () => {
    if (!next || loadingMore || loading) return;
    setLoadingMore(true);
    try {
      const url = new URL(next, 'http://x');
      const page = url.searchParams.get('page') || '2';
      await fetchPage(page, { append: true });
    } catch (e) { /* handled */ } finally {
      setLoadingMore(false);
    }
  }, [next, loadingMore, loading, fetchPage]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPage(1, { append: false });
    } catch (e) { /* handled */ } finally {
      setRefreshing(false);
    }
  }, [fetchPage]);

  const goToPage = useCallback(async (p) => {
    const target = Math.min(Math.max(1, p), totalPages || 1);
    if (target === page || loading) return;
    setLoading(true);
    try {
      await fetchPage(target, { append: false });
    } catch (e) { /* handled */ } finally {
      setLoading(false);
    }
  }, [page, totalPages, loading, fetchPage]);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      let active = true;
      load();
      return () => { active = false; };
    }, [enabled, load])
  );

  useEffect(() => {
    if (initialRun.current) {
      initialRun.current = false;
      return;
    }
    if (enabled) load();
  }, [enabled, queryKey, load]);

  return { items, loading, refreshing, loadingMore, page, total, totalPages, next, error, load, loadMore, refresh, goToPage, reload: load };
}
