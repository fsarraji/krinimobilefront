export function resolveApiUrl(raw, fallback) {
  let base = typeof raw === 'string' && raw.trim() ? raw.trim() : fallback || '';
  base = base.replace(/\/+$/, '');
  if (!base.endsWith('/api')) base = `${base}/api`;
  return `${base}/`;
}
