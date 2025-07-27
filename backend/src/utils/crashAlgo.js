import crypto from 'crypto';

export function generateCrashPoint(seed, roundId) {
  const hash = crypto.createHmac('sha256', seed).update(String(roundId)).digest('hex');
  const h = parseInt(hash.substring(0, 13), 16);
  const e = Math.pow(2, 52);
  return Math.max(1.0, Math.floor((100 * e) / (e - h)) / 100);
}
