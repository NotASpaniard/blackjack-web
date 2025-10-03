import { nanoid } from 'nanoid';

const memory = {
  users: [
    // password: 123
    { id: 'u_admin', email: 'admin@example.com', name: 'admin', nick: 'Admin', role: 'admin', passHash: '$2a$10$1aIHf4HqH1r4XwZr1PvwUe7bAwmS/3d9QkpxzJxwqF0JmXxWb9qQe' }
  ],
  sessions: {},
  wallets: { u_admin: 1000 },
};

export const store = {
  getUserByEmail(email) { return memory.users.find(u => u.email === email || u.name === email); },
  getUserById(id) { return memory.users.find(u => u.id === id); },
  createUser({ email, name, nick, passHash }) {
    const id = nanoid();
    const user = { id, email, name, nick, role: 'user', passHash };
    memory.users.push(user);
    memory.wallets[id] = 0;
    return user;
  },
  createSession(userId) { const token = nanoid(32); memory.sessions[token] = { userId, createdAt: Date.now() }; return token; },
  getSession(token) { return memory.sessions[token]; },
  deleteSession(token) { delete memory.sessions[token]; },
  getBalance(userId) { return memory.wallets[userId] || 0; },
  addBalance(userId, delta) { memory.wallets[userId] = Math.max(0, (memory.wallets[userId] || 0) + delta); return memory.wallets[userId]; },
};

