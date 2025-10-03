import { nanoid } from 'nanoid';
import { pool } from './db.js';

export const store = {
  async getUserByEmail(email) {
    const r = await pool.query('select * from users where email=$1 or name=$1 limit 1', [email]);
    return r.rows[0];
  },
  async getUserById(id) {
    const r = await pool.query('select * from users where id=$1 limit 1', [id]);
    return r.rows[0];
  },
  async ensureAdmin(passHash) {
    const r = await pool.query('select id from users where name=$1 limit 1', ['admin']);
    if (!r.rows[0]) {
      const id = 'u_admin';
      await pool.query('insert into users(id,email,name,nick,role,pass_hash) values($1,$2,$3,$4,$5,$6)', [id, 'admin@example.com', 'admin', 'Admin', 'admin', passHash]);
      await pool.query('insert into wallets(user_id,balance) values($1,$2)', [id, 1000]);
    }
  },
  async createUser({ email, name, nick, passHash }) {
    const id = nanoid();
    await pool.query('insert into users(id,email,name,nick,role,pass_hash) values($1,$2,$3,$4,$5,$6)', [id, email, name, nick, 'user', passHash]);
    await pool.query('insert into wallets(user_id,balance) values($1,$2)', [id, 0]);
    const r = await pool.query('select * from users where id=$1', [id]);
    return r.rows[0];
  },
  async createSession(userId) {
    const token = nanoid(32);
    await pool.query('insert into sessions(token,user_id) values($1,$2)', [token, userId]);
    return token;
  },
  async getSession(token) {
    const r = await pool.query('select * from sessions where token=$1', [token]);
    return r.rows[0];
  },
  async deleteSession(token) { await pool.query('delete from sessions where token=$1', [token]); },
  async getBalance(userId) { const r = await pool.query('select balance from wallets where user_id=$1', [userId]); return Number(r.rows[0]?.balance || 0); },
  async addBalance(userId, delta) { const r = await pool.query('update wallets set balance = GREATEST(0, balance + $2) where user_id=$1 returning balance', [userId, delta]); return Number(r.rows[0].balance); },
};

