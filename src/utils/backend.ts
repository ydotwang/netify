export function getBackendUrl(): string {
  // 1. Use explicit env variable when provided (suitable for production deploy).
  const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (envUrl && envUrl.length > 0) {
    // If we are on localhost we still prefer the local backend.
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://127.0.0.1:8000';
      }
    }
    return envUrl.replace(/\/$/, ''); // strip trailing slash
  }

  // 2. Fallback – during local development always point at the laptop's Uvicorn.
  return 'http://127.0.0.1:8000';
} 