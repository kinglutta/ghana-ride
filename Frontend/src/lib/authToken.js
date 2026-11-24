/**
 * YENKO role-aware token storage.
 *
 * The old app used one `localStorage.token`, so signing in as a Captain
 * overwrote the Rider session. Each role now gets its own slot while legacy
 * sessions are migrated automatically on first read.
 */

const STORAGE_KEYS = {
    rider: 'yenko:rider:token',
    captain: 'yenko:captain:token',
    admin: 'yenko:admin:token',
};

const LEGACY_KEY = 'token';

/** Pick the role that owns the current browser route. */
export const roleForPath = (path = window.location.pathname) => {
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/captain') || path.startsWith('/driver')) return 'captain';
    return 'rider';
};

/** Move an old shared token into the slot for the role that needs it. */
const migrateLegacy = (role) => {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return;

    const key = STORAGE_KEYS[role];
    if (key && !localStorage.getItem(key)) {
        localStorage.setItem(key, legacy);
    }
    localStorage.removeItem(LEGACY_KEY);
};

/** Read the token for a role, defaulting to the role of the current page. */
export const getToken = (role = roleForPath()) => {
    if (!role) return '';

    migrateLegacy(role);
    const token = localStorage.getItem(STORAGE_KEYS[role]);
    if (token) return token;

    // Admin accounts authenticate through the user endpoint, so an admin
    // session can safely fall back to the rider/user token slot.
    if (role === 'admin') return getToken('rider');
    return '';
};

/** Store a token in the slot for the given role. */
export const setToken = (role, token) => {
    if (!token) return;
    localStorage.setItem(STORAGE_KEYS[role], token);
    migrateLegacy(role);
};

/** Clear the token for a role. Clearing admin also clears the shared user slot. */
export const clearToken = (role = roleForPath()) => {
    if (role === 'admin') {
        localStorage.removeItem(STORAGE_KEYS.admin);
        localStorage.removeItem(STORAGE_KEYS.rider);
    } else {
        localStorage.removeItem(STORAGE_KEYS[role]);
    }
    localStorage.removeItem(LEGACY_KEY);
};

/** Used only by explicit full sign-out flows. */
export const clearAllTokens = () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem(LEGACY_KEY);
};

export default getToken;
