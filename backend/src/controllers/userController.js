import User from '../models/User.js';

/**
 * Syncs a Clerk-authenticated user with your local MongoDB
 * @param {string} userId - Clerk user ID
 * @param {string} username - Optional username (can be from Clerk metadata)
 * @returns {Promise<User>}
 */
export async function syncUser(userId, username = 'anonymous') {
  let user = await User.findById(userId);
  if (!user) {
    user = new User({
      _id: userId,
      username,
      wallet: {
        BTC: 0,
        ETH: 0
      }
    });
    await user.save();
  }
  return user;
}

/**
 * Get user wallet with crypto and USD equivalent
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
 * Add or subtract funds to/from user's wallet
 */
export async function updateUserWallet(userId, currency, delta) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  if (!['BTC', 'ETH'].includes(currency)) {
    throw new Error('Unsupported currency');
  }

  user.wallet[currency] += delta;

  if (user.wallet[currency] < 0) {
    throw new Error('Insufficient funds');
  }

  await user.save();
  return user.wallet;
}
