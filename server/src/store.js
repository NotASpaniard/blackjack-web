import { nanoid } from 'nanoid';

const USE_MEMORY = process.env.MEMORY_STORE === '1' || !process.env.DATABASE_URL;

let storeImpl;

if (USE_MEMORY) {
  const memory = {
    users: [],
    sessions: {},
    wallets: {},
    tx: [],
    audits: [],
  };
  storeImpl = {
    async getUserByEmail(email) { return memory.users.find(u => u.email === email || u.name === email); },
    async getUserById(id) { return memory.users.find(u => u.id === id); },
    async ensureAdmin(passHash) {
      if (!memory.users.find(u => u.name === 'admin')) {
        const user = { id: 'u_admin', email: 'admin@example.com', name: 'admin', nick: 'Admin', role: 'admin', passHash };
        memory.users.push(user); memory.wallets[user.id] = 1000;
      }
    },
    async createUser({ email, name, nick, passHash }) {
      const id = nanoid(); const user = { id, email, name, nick, role: 'user', passHash };
      memory.users.push(user); memory.wallets[id] = 0; return user;
    },
    async createSession(userId) { const token = nanoid(32); memory.sessions[token] = { userId, createdAt: Date.now() }; return token; },
    async getSession(token) { return memory.sessions[token]; },
    async deleteSession(token) { delete memory.sessions[token]; },
    async getBalance(userId) { return memory.wallets[userId] || 0; },
    async addBalance(userId, delta) { memory.wallets[userId] = Math.max(0, (memory.wallets[userId] || 0) + delta); return memory.wallets[userId]; },
    async addTransaction(userId, amount) { memory.tx.push({ id: memory.tx.length + 1, userId, amount, ts: Date.now() }); },
    async addAudit(actorUserId, action, details) { memory.audits.push({ id: memory.audits.length + 1, actorUserId, action, details, ts: Date.now() }); },
  };
} else {
  const { pool } = await import('./db.js');
  storeImpl = {
    async getUserByEmail(email) { const r = await pool.query('select * from users where email=$1 or name=$1 limit 1', [email]); return r.rows[0]; },
    async getUserById(id) { const r = await pool.query('select * from users where id=$1 limit 1', [id]); return r.rows[0]; },
    async ensureAdmin(passHash) { const r = await pool.query('select id from users where name=$1 limit 1', ['admin']); if (!r.rows[0]) { const id = 'u_admin'; await pool.query('insert into users(id,email,name,nick,role,pass_hash) values($1,$2,$3,$4,$5,$6)', [id, 'admin@example.com', 'admin', 'Admin', 'admin', passHash]); await pool.query('insert into wallets(user_id,balance) values($1,$2)', [id, 1000]); } },
    async createUser({ email, name, nick, passHash }) { const id = nanoid(); await pool.query('insert into users(id,email,name,nick,role,pass_hash) values($1,$2,$3,$4,$5,$6)', [id, email, name, nick, 'user', passHash]); await pool.query('insert into wallets(user_id,balance) values($1,$2)', [id, 0]); const r = await pool.query('select * from users where id=$1', [id]); return r.rows[0]; },
    async createSession(userId) { const token = nanoid(32); await pool.query('insert into sessions(token,user_id) values($1,$2)', [token, userId]); return token; },
    async getSession(token) { const r = await pool.query('select * from sessions where token=$1', [token]); return r.rows[0]; },
    async deleteSession(token) { await pool.query('delete from sessions where token=$1', [token]); },
    async getBalance(userId) { const r = await pool.query('select balance from wallets where user_id=$1', [userId]); return Number(r.rows[0]?.balance || 0); },
    async addBalance(userId, delta) { const r = await pool.query('update wallets set balance = GREATEST(0, balance + $2) where user_id=$1 returning balance', [userId, delta]); return Number(r.rows[0].balance); },
    async addTransaction(userId, amount) { await pool.query('insert into transactions(user_id,amount) values($1,$2)', [userId, amount]); },
    async addAudit(actorUserId, action, details) { await pool.query('insert into audit_logs(actor_user_id,action,details) values($1,$2,$3)', [actorUserId, action, details ? JSON.stringify(details) : null]); },
  };
}

export const store = storeImpl;

