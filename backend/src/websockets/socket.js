import { generateCrashPoint } from '../utils/crashAlgo.js';
import { getUserWallet, updateUserWallet, syncUser } from '../services/walletService.js';
import { getCryptoPrices } from '../services/priceService.js';

let roundId = 1;
let currentMultiplier = 1.0;
let activeBets = {}; // socket.id -> bet

export function handleSockets(io) {
  io.use(async (socket, next) => {
    try {
      const playerName = `Player${Math.floor(1000 + Math.random() * 9000)}`;
      const userId = socket.id;

      // Auto-create user with initial wallet
      await syncUser(userId, playerName);

      socket.user = {
        id: userId,
        username: playerName
      };
      next();
    } catch (err) {
      next(new Error('Failed to initialize user'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 ${socket.user.username} connected`);

    // 📌 Place Bet
    socket.on('place_bet', async ({ amount, currency }) => {
      const userId = socket.user.id;
      const username = socket.user.username;

      try {
        const prices = await getCryptoPrices();
        const usdPrice = prices[currency];
        const cryptoAmount = amount / usdPrice;

        const wallet = await getUserWallet(userId, prices);
        if (!wallet[currency] || wallet[currency] < cryptoAmount) {
          console.log('❌ Insufficient balance for', username);
          return;
        }

        await updateUserWallet(userId, currency, -cryptoAmount);

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

        console.log(`🎯 ${username} bet $${amount} in ${currency}`);
      } catch (err) {
        console.error('❌ Error placing bet:', err.message);
      }
    });

    // 📌 Cashout
    socket.on('cashout', async () => {
      const userId = socket.user.id;
      const bet = activeBets[userId];
      if (!bet) return;

      bet.status = 'cashed_out';
      bet.multiplier = currentMultiplier;

      const payout = bet.cryptoAmount * currentMultiplier;
      await updateUserWallet(userId, bet.currency, payout);

      io.emit('bet_cashout', {
        ...bet,
        player: socket.user.username,
        cashoutAt: currentMultiplier
      });

      delete activeBets[userId];
      console.log(`💸 ${socket.user.username} cashed out at ${currentMultiplier}x`);
    });

    // 📌 Disconnect
    socket.on('disconnect', () => {
      delete activeBets[socket.user.id];
    });
  });

  // 🕹 Game Loop (runs every 10 seconds)
  setInterval(async () => {
    const seed = 'secret-seed';
    const crashPoint = generateCrashPoint(seed, roundId);
    currentMultiplier = 1.0;

    io.emit('round_start', { roundId, crashPoint });

    const interval = setInterval(() => {
      if (currentMultiplier >= crashPoint) {
        io.emit('round_crash', crashPoint);
        activeBets = {};
        clearInterval(interval);
        roundId++;
      } else {
        currentMultiplier = parseFloat((currentMultiplier + 0.01).toFixed(2));
        io.emit('multiplier_update', currentMultiplier);
      }
    }, 100);
  }, 10000);
}
