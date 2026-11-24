/**
 * Server-side admin invite code handling.
 *
 * Codes are never shipped to the browser. Registration is the only place that
 * checks them, so a hidden UI field cannot grant admin access on its own.
 */
const crypto = require('crypto');

const DEV_CODE = 'YENKO-ADMIN-2026';

/** Returns every configured code, newest variable taking priority. */
const getCodes = () => {
    const raw = process.env.ADMIN_SIGNUP_CODES || process.env.ADMIN_SIGNUP_CODE;

    if (raw) {
        return raw
            .split(',')
            .map((code) => code.trim())
            .filter(Boolean);
    }

    // Local convenience only. Production must configure its own code.
    return process.env.NODE_ENV === 'production' ? [] : [DEV_CODE];
};

/** Whether admin self-registration is available right now. */
const isEnabled = () => getCodes().length > 0;

/** Constant-time comparison avoids leaking the code through response timing. */
const matches = (candidate) => {
    const value = String(candidate || '').trim();
    if (!value) return false;

    return getCodes().some((code) => {
        const expected = Buffer.from(code);
        const actual = Buffer.from(value);
        return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
    });
};

module.exports = { DEV_CODE, getCodes, isEnabled, matches };
