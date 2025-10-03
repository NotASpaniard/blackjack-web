import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://blackjack:blackjack@localhost:5432/blackjack';
export const pool = new Pool({ connectionString: DATABASE_URL });

export async function initSchema() {
  await pool.query(`
  create table if not exists users (
    id text primary key,
    email text unique not null,
    name text not null,
    nick text,
    role text not null default 'user',
    pass_hash text not null
  );
  create table if not exists sessions (
    token text primary key,
    user_id text not null references users(id) on delete cascade,
    created_at timestamptz not null default now()
  );
  create table if not exists wallets (
    user_id text primary key references users(id) on delete cascade,
    balance bigint not null default 0
  );
  create table if not exists transactions (
    id bigserial primary key,
    user_id text not null references users(id) on delete cascade,
    amount bigint not null,
    created_at timestamptz not null default now()
  );
  create table if not exists tickets (
    id bigserial primary key,
    user_id text not null references users(id) on delete cascade,
    subject text not null,
    content text not null,
    created_at timestamptz not null default now()
  );
  `);
}

