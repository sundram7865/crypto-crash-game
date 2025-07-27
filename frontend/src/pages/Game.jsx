import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from '@clerk/clerk-react';

const socket = io('http://localhost:3000');

export default function Game() {
  const [multiplier, setMultiplier] = useState(1.0);
  const [betAmount, setBetAmount] = useState(10);
  const [currency, setCurrency] = useState('BTC');
  const [isBetting, setIsBetting] = useState(false);
  const [bets, setBets] = useState([]);
  const [crashPoint, setCrashPoint] = useState(null);

  const { getToken } = useAuth();

  useEffect(() => {
    socket.on('multiplier_update', (value) => {
      setMultiplier(value);
    });

    socket.on('round_crash', (value) => {
      setCrashPoint(value);
      setIsBetting(false);
    });

    socket.on('round_start', ({ crashPoint }) => {
      setCrashPoint(null);
      setMultiplier(1.0);
    });

    socket.on('new_bet', (bet) => {
      setBets((prev) => [bet, ...prev.slice(0, 15)]);
    });

    return () => {
      socket.off('multiplier_update');
      socket.off('round_crash');
      socket.off('round_start');
      socket.off('new_bet');
    };
  }, []);

  const handlePlaceBet = async () => {
    const token = await getToken();
    socket.auth = { token };
    socket.emit('place_bet', { amount: betAmount, currency });
    setIsBetting(true);
  };

  const handleCashout = () => {
    socket.emit('cashout');
    setIsBetting(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <header className="text-red-500 text-4xl font-bold text-center mb-4">Crypto Crash</header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left: Bets List */}
        <div className="bg-gray-900 rounded-xl p-4 overflow-y-auto max-h-[70vh]">
          <h2 className="text-lg font-semibold mb-2">All Bets</h2>
          <ul className="space-y-1 text-sm">
            {bets.map((bet, i) => (
              <li key={i} className="flex justify-between">
                <span>{bet.player || 'Player'}</span>
                <span>
                  {bet.cryptoAmount} {bet.currency} <span className="text-gray-400">(${bet.usdValue})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Center: Game Display */}
        <div className="bg-gradient-to-br from-black to-gray-900 rounded-xl flex flex-col items-center justify-center p-6 relative">
          <div className="text-6xl font-bold text-green-400 mb-4">{multiplier.toFixed(2)}x</div>
          {crashPoint && (
            <div className="text-red-500 text-xl absolute bottom-6">Crashed at: {crashPoint}x</div>
          )}
          <div className="absolute right-10 bottom-10 text-4xl">✈️</div>
        </div>

        {/* Right: Bet Panel */}
        <div className="bg-gray-900 rounded-xl p-4 flex flex-col items-center gap-4">
          <h2 className="text-lg font-semibold">Place Your Bet</h2>

          {/* Currency Selection */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full text-black p-2 rounded mb-2"
          >
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="ETH">Ethereum (ETH)</option>
          </select>

          <div className="flex items-center gap-2">
            <button onClick={() => setBetAmount(betAmount - 1)} className="px-2 py-1 bg-gray-700 rounded">-</button>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(parseFloat(e.target.value))}
              className="w-24 text-black px-2 py-1 rounded"
            />
            <button onClick={() => setBetAmount(betAmount + 1)} className="px-2 py-1 bg-gray-700 rounded">+</button>
          </div>

          <button
            onClick={handlePlaceBet}
            disabled={isBetting}
            className="w-full py-2 bg-green-500 rounded text-black font-bold text-lg"
          >
            Bet ${betAmount} in {currency}
          </button>

          <button
            onClick={handleCashout}
            disabled={!isBetting}
            className="w-full py-2 bg-yellow-400 rounded text-black font-bold text-lg"
          >
            Cash Out
          </button>
        </div>
      </div>
    </div>
  );
}