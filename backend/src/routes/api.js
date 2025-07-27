import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { fetchPrices } from '../services/priceService.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/prices', requireAuth, async (req, res) => {
  const prices = await fetchPrices();
  res.json(prices);
});

router.get('/wallet', requireAuth, async (req, res) => {
  const clerkUserId = req.auth.userId;
  const user = await User.findById(clerkUserId);
  const prices = await fetchPrices();
  res.json({
    BTC: user.wallet.BTC,
    ETH: user.wallet.ETH,
    USD: {
      BTC: (user.wallet.BTC * prices.BTC).toFixed(2),
      ETH: (user.wallet.ETH * prices.ETH).toFixed(2)
    }
  });
});
