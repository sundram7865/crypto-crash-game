import User from '../models/User.js';

/**
 * Sync or create a user using socket.id or custom user ID.
 * @param {string} userId - A unique identifier (e.g., socket.id)
 * @param {string} username - Optional username like "Player3029"
 * @returns {Promise<User>}
 */
export async function syncUser(userId, username = 'anonymous') {
  let user = await User.findById(userId);

  if (!user) {
    user = new User({
      _id: userId,
      username,
      wallet: {
        BTC: 1.0,   // default BTC balance
        ETH: 10.0   // default ETH balance
      }
    });
    await user.save();
  }

  return user;
}

/**
 * Get wallet balance with real-time USD equivalents.
 * @param {string} userId
 * @param {{ BTC: number, ETH: number }} prices - Live crypto prices
 * @returns {{
 *   BTC: number,
 *   ETH: number,
 *   USD: { BTC: string, ETH: string }
 * }}
 */
export async function getUserWallet(userId, prices) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  return {
    BTC: user.wallet.BTC,
    ETH: user.wallet.ETH,
    USD: {
      BTC: (user.wallet.BTC * prices.BTC).toFixed(2),
      ETH: (user.wallet.ETH * prices.ETH).toFixed(2)
    }
  };
}

/**
 * Update user's crypto wallet by delta.
 * @param {string} userId
 * @param {'BTC' | 'ETH'} currency
 * @param {number} delta - positive or negative amount
 * @returns {Promise<{ BTC: number, ETH: number }>}
 */
export async function updateUserWallet(userId, currency, delta) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (!['BTC', 'ETH'].includes(currency)) {
    throw new Error('Unsupported currency');
  }

  const newBalance = user.wallet[currency] + delta;
  if (newBalance < 0) {
    throw new Error('Insufficient funds');
  }

  user.wallet[currency] = newBalance;
  await user.save();
  return user.wallet;
}
