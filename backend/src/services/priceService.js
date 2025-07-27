import apiClient from './apiClient.js';

let cachedPrices = {};
let lastFetch = 0;

export async function fetchPrices() {
  const now = Date.now();
  if (now - lastFetch < 10000 && cachedPrices.BTC) return cachedPrices;

  const res = await apiClient.get('/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
  cachedPrices = {
    BTC: res.data.bitcoin.usd,
    ETH: res.data.ethereum.usd
  };
  lastFetch = now;
  return cachedPrices;
}
