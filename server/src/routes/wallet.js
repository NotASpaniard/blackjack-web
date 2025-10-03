import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { store } from '../store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const COOKIE_NAME = 'sid';

export const walletRouter = Router();

async function requireUser(req, res) {
  const jwtToken = req.cookies[COOKIE_NAME];
  if (!jwtToken) return null;
  try {
    const { sid } = jwt.verify(jwtToken, JWT_SECRET);
    const sess = await store.getSession(sid); if (!sess) return null;
    const user = await store.getUserById(sess.userId); if (!user) return null;
    return user;
  } catch { return null; }
}

walletRouter.get('/balance', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return res.status(401).json({ error: 'Unauthorized' });
  return res.json({ balance: await store.getBalance(user.id) });
});

walletRouter.post('/deposit', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { amount } = req.body || {}; const v = Math.max(1, Math.floor(Number(amount)||0));
  const balance = await store.addBalance(user.id, v); return res.json({ balance });
});

walletRouter.post('/withdraw', async (req, res) => {
  const user = await requireUser(req, res); if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { amount } = req.body || {}; const v = Math.max(1, Math.floor(Number(amount)||0));
  const balance = await store.addBalance(user.id, -v); return res.json({ balance });
});

