/**
 * Unique Browser / Device Identification Engine
 * Generates and persists a robust browser fingerprint for the respondent's device.
 * Used to enforce single-user / single-device research integrity in academic surveys.
 */

const BROWSER_ID_STORAGE_KEY = 'unitins_device_fingerprint_v1';
const BROWSER_ID_COOKIE_NAME = 'unitins_device_id';

/**
 * Computes a hash code from an input string.
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Gets or creates a persistent unique browser identifier.
 */
export function getBrowserDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'SRV-DEFAULT-ID';
  }

  // 1. Check localStorage
  try {
    const localId = localStorage.getItem(BROWSER_ID_STORAGE_KEY);
    if (localId && localId.startsWith('BRW-')) {
      return localId;
    }
  } catch {
    // localStorage might be restricted
  }

  // 2. Check Cookie
  try {
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${BROWSER_ID_COOKIE_NAME}=`));
    if (match) {
      const val = match.split('=')[1];
      if (val && val.startsWith('BRW-')) {
        // Sync back to localStorage
        try {
          localStorage.setItem(BROWSER_ID_STORAGE_KEY, val);
        } catch {}
        return val;
      }
    }
  } catch {}

  // 3. Generate new deterministic hardware/environment seed + entropy
  const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const lang = navigator.language || 'pt-BR';
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const platform = navigator.platform || 'unknown';
  const ua = navigator.userAgent || 'generic';

  const envSeed = simpleHash(`${screenInfo}_${tz}_${lang}_${hardwareConcurrency}_${platform}_${ua}`);
  const randomEntropy = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();

  const generatedId = `BRW-${envSeed.toUpperCase()}-${timestamp}-${randomEntropy}`;

  // Persist across localStorage and Cookie (expires in 365 days)
  try {
    localStorage.setItem(BROWSER_ID_STORAGE_KEY, generatedId);
  } catch {}

  try {
    const maxAge = 365 * 24 * 60 * 60; // 1 year
    document.cookie = `${BROWSER_ID_COOKIE_NAME}=${generatedId}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {}

  return generatedId;
}
