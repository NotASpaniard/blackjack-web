import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { store } from '../store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const COOKIE_NAME = 'sid';
const COOKIE_OPTIONS = { httpOnly: true, sameSite: 'lax' };

export const authRouter = Router();

function userPublic(u) { const { passHash, ...rest } = u; return rest; }

authRouter.post('/register', async (req, res) => {
  const { name, email, password, nick } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  if (store.getUserByEmail(email)) return res.status(409).json({ error: 'Email exists' });
  const passHash = await bcrypt.hash(password, 10);
  const user = store.createUser({ name, email, nick, passHash });
  return res.json({ user: userPublic(user) });
});

authRouter.post('/login', async (req, res) => {
  const { id, password } = req.body || {};
  const user = store.getUserByEmail(id || '');
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password || '', user.passHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = store.createSession(user.id);
  const jwtToken = jwt.sign({ sid: token }, JWT_SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE_NAME, jwtToken, COOKIE_OPTIONS);
  return res.json({ user: userPublic(user) });
});

authRouter.post('/logout', (req, res) => {
  const jwtToken = req.cookies[COOKIE_NAME];
  try {
    const { sid } = jwt.verify(jwtToken, JWT_SECRET);
    store.deleteSession(sid);
  } catch {}
  res.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
  return res.json({ ok: true });
});

authRouter.get('/me', (req, res) => {
  const jwtToken = req.cookies[COOKIE_NAME];
  if (!jwtToken) return res.status(401).json({ error: 'No session' });
  try {
    const { sid } = jwt.verify(jwtToken, JWT_SECRET);
    const sess = store.getSession(sid);
    if (!sess) return res.status(401).json({ error: 'Invalid session' });
    const user = store.getUserById(sess.userId);
    if (!user) return res.status(401).json({ error: 'Invalid user' });
    return res.json({ user: userPublic(user) });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

