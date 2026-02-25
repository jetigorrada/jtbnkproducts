/**
 * Simple client-side auth using SHA-256 hashed credentials.
 * No plain-text credentials are stored in the source code.
 * Session is kept in sessionStorage (cleared when browser tab closes).
 */

const SESSION_KEY = 'pd-auth-session';

// SHA-256 hashes of valid credentials — never stored in plain text
const VALID_USER_HASH = 'c8d161fc7c1ffcbf15f2db3cd3b2570cf47319223360b1aec01e7372010cceea';
const VALID_PASS_HASH = '92325832a54c0f486bd0137ef6a0b26c94b43e272f8084530d5cbd8c02dca9b2';

/**
 * Hash a string using SHA-256 via the Web Crypto API
 */
async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify credentials against stored hashes
 * @returns {boolean}
 */
export async function authenticate(username, password) {
  const userHash = await sha256(username);
  const passHash = await sha256(password);

  if (userHash === VALID_USER_HASH && passHash === VALID_PASS_HASH) {
    // Store a session token (hash of credentials + timestamp)
    const token = await sha256(userHash + passHash + Date.now().toString());
    sessionStorage.setItem(SESSION_KEY, token);
    return true;
  }

  return false;
}

/**
 * Check if user is currently authenticated
 */
export function isAuthenticated() {
  return !!sessionStorage.getItem(SESSION_KEY);
}

/**
 * Log out — clear session
 */
export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}
