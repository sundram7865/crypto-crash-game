import apiClient from './api.js';

export async function fetchWallet(token) {
  const res = await apiClient.get('/wallet', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return res.data;
}
