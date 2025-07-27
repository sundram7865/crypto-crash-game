import { generateCrashPoint } from '../utils/crashAlgo.js';
import { verifyToken } from '@clerk/clerk-sdk-node';

let roundId = 1;

export function handleSockets(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const user = await verifyToken(token);
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 ${socket.user.id} connected`);

    socket.on('place_bet', (data) => {
      console.log(`🎯 Bet from ${socket.user.id}: ${JSON.stringify(data)}`);
    });

    socket.on('cashout', () => {
      console.log(`💸 Cashout from ${socket.user.id}`);
    });
  });

  setInterval(() => {
    const seed = 'secret-seed';
    const crashPoint = generateCrashPoint(seed, roundId);
    let multiplier = 1.0;

    io.emit('round_start', { roundId, crashPoint });

    const interval = setInterval(() => {
      if (multiplier >= crashPoint) {
        io.emit('round_crash', crashPoint);
        clearInterval(interval);
        roundId++;
      } else {
        multiplier = parseFloat((multiplier + 0.01).toFixed(2));
        io.emit('multiplier_update', multiplier);
      }
    }, 100);
  }, 10000);
}
