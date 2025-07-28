import crypto from 'crypto';

/**
 * Generate a provably fair crash point using HMAC-SHA256.
 * @param {string} seed - Server secret seed
 * @param {number} roundId - Unique round ID (e.g. 1, 2, 3...)
 * @returns {number} Crash multiplier (e.g. 1.85x)
 */
export function generateCrashPoint(seed, roundId) {
  const hash = crypto
    .createHmac('sha256', seed)
    .update(String(roundId))
    .digest('hex');

  const h = parseInt(hash.substring(0, 13), 16); // Take first 52 bits
  const e = Math.pow(2, 52);

  const result = Math.floor((100 * e) / (e - h)) / 100;

  return Math.max(1.0, result);
}
