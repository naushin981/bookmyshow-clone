interface ReelRushRuntimeConfig {
  apiBaseUrl?: string;
}

declare global {
  interface Window {
    REEL_RUSH_CONFIG?: ReelRushRuntimeConfig;
  }
}

export function apiUrl(path: string): string {
  const baseUrl = typeof window === 'undefined'
    ? ''
    : window.REEL_RUSH_CONFIG?.apiBaseUrl?.trim().replace(/\/+$/, '') ?? '';
  return `${baseUrl}${path}`;
}
