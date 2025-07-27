import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

export const requireAuth = ClerkExpressRequireAuth({
  onError: (err, req, res, next) => {
    res.status(401).json({ error: 'Unauthorized', message: err.message });
  }
});
