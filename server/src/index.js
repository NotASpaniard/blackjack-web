import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.js';
import { walletRouter } from './routes/wallet.js';
import { initSchema } from './db.js';
import bcrypt from 'bcryptjs';
import { store } from './store.js';

const app = express();
const PORT = process.env.PORT || 4000;
const ORIGIN = process.env.ORIGIN || 'http://localhost:3000';

app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/auth', authRouter);
app.use('/wallet', walletRouter);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

initSchema().then(async () => {
  // seed admin user/password 123 if not exists
  const passHash = await bcrypt.hash('123', 10);
  await store.ensureAdmin(passHash);
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
});

