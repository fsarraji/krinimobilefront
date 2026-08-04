export function resolveApiUrl(raw, fallback) {
  let base = typeof raw === 'string' && raw.trim() ? raw.trim() : fallback || '';
  base = base.replace(/\/+$/, '');
  if (!base.endsWith('/api')) base = `${base}/api`;
  return `${base}/`;
}

export function resolveMediaUrl(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const base = resolveApiUrl(process.env.EXPO_PUBLIC_API_URL, 'https://kriniback.onrender.com/api/');
  const origin = base.replace(/\/api\/?$/, '');
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}
