import { generateCrashPoint } from '../utils/crashAlgo.js';
import { verifyToken } from '@clerk/clerk-sdk-node';
import { getUserWallet, updateWallet } from '../services/walletService.js';
import { getCryptoPrices } from '../services/priceService.js';

let roundId = 1;
let currentMultiplier = 1.0;
let activeBets = {}; // { userId: { ...bet } }

export function handleSockets(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const user = await verifyToken(token);
      socket.user = {
        id: user.sub,
        username: user.username || user.email_addresses?.[0]?.email_address || 'Player'
      };
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 ${socket.user.id} connected`);

    socket.on('place_bet', async ({ amount, currency }) => {
      const userId = socket.user.id;
      const username = socket.user.username;

      try {
        const prices = await getCryptoPrices();
        const usdPrice = prices[currency];
        const cryptoAmount = amount / usdPrice;

        const wallet = await getUserWallet(userId);
        if (!wallet[currency] || wallet[currency] < cryptoAmount) {
          return; // Insufficient balance
        }

        // Deduct from wallet (simulate)
        await updateWallet(userId, currency, -cryptoAmount);

        const bet = {
          player: username,
          currency,
          usdValue: amount,
          cryptoAmount: parseFloat(cryptoAmount.toFixed(6)),
          status: 'active',
          multiplier: null
        };

        activeBets[userId] = { ...bet, startMultiplier: currentMultiplier };
        io.emit('new_bet', bet);
        console.log(`🎯 Bet from ${userId}: $${amount} in ${currency}`);
      } catch (err) {
        console.error('Error placing bet:', err);
      }
    });

    socket.on('cashout', async () => {
      const userId = socket.user.id;
      const bet = activeBets[userId];
      if (!bet) return;

      bet.status = 'cashed_out';
      bet.multiplier = currentMultiplier;

      // Simulate cashout back to wallet
      const payout = bet.cryptoAmount * currentMultiplier;
      await updateWallet(userId, bet.currency, payout);

      io.emit('bet_cashout', bet);
      delete activeBets[userId];
      console.log(`💸 ${userId} cashed out at ${currentMultiplier}x`);
    });
  });

  // 🔁 Game loop
  setInterval(async () => {
    const seed = 'secret-seed';
    const crashPoint = generateCrashPoint(seed, roundId);
    currentMultiplier = 1.0;

    io.emit('round_start', { roundId, crashPoint });

    const interval = setInterval(() => {
      if (currentMultiplier >= crashPoint) {
        io.emit('round_crash', crashPoint);
        activeBets = {}; // clear all remaining active bets
        clearInterval(interval);
        roundId++;
      } else {
        currentMultiplier = parseFloat((currentMultiplier + 0.01).toFixed(2));
        io.emit('multiplier_update', currentMultiplier);
      }
    }, 100);
  }, 10000);
}
