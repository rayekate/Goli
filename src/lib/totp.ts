/**
 * Lightweight TOTP (Time-based One-Time Password) implementation
 * Compatible with Google Authenticator, Authy, etc.
 * Uses Node.js crypto — no external dependencies needed.
 */
import crypto from 'crypto';

const TOTP_PERIOD = 30; // seconds
const TOTP_DIGITS = 6;
const ISSUER = 'GoldXchange';

/** Generate a random base32-encoded secret */
export function generateSecret(): string {
  const buffer = crypto.randomBytes(20);
  return base32Encode(buffer);
}

/** Generate the otpauth:// URI for QR code scanning */
export function getOtpAuthUri(secret: string, email: string): string {
  const encodedIssuer = encodeURIComponent(ISSUER);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

/** Verify a TOTP code. Allows ±1 window drift for clock skew. */
export function verifyTOTP(secret: string, code: string): boolean {
  if (!secret || !code || code.length !== TOTP_DIGITS) return false;

  const now = Math.floor(Date.now() / 1000);

  // Check current window and ±1 for clock drift
  for (let drift = -1; drift <= 1; drift++) {
    const counter = Math.floor((now + drift * TOTP_PERIOD) / TOTP_PERIOD);
    const expected = generateHOTP(secret, counter);
    if (timingSafeEqual(expected, code)) {
      return true;
    }
  }
  return false;
}

/** Generate an HOTP code for a given counter */
function generateHOTP(secret: string, counter: number): string {
  const decodedSecret = base32Decode(secret);

  // Counter as 8-byte big-endian buffer
  const buffer = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    buffer[i] = counter & 0xff;
    counter = counter >> 8;
  }

  const hmac = crypto.createHmac('sha1', decodedSecret);
  hmac.update(buffer);
  const digest = hmac.digest();

  // Dynamic truncation
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, TOTP_DIGITS);
  return otp.toString().padStart(TOTP_DIGITS, '0');
}

/** Timing-safe string comparison */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto.timingSafeEqual(bufA, bufB);
}

// ─── Base32 Encoding/Decoding ────────────────────────────────────────────────
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_CHARS.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}
