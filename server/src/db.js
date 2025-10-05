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
    balance bigint not null default 0 check (balance >= 0)
  );
  create table if not exists transactions (
    id bigserial primary key,
    user_id text not null references users(id) on delete cascade,
    amount bigint not null,
    created_at timestamptz not null default now()
  );
  create table if not exists game_rounds (
    id bigserial primary key,
    user_id text not null references users(id) on delete cascade,
    started_at timestamptz not null default now(),
    finished_at timestamptz,
    outcome text,
    bet bigint not null default 0 check (bet >= 0),
    payout bigint not null default 0
  );
  create table if not exists hands (
    id bigserial primary key,
    round_id bigint not null references game_rounds(id) on delete cascade,
    role text not null,
    cards text not null
  );
  create table if not exists audit_logs (
    id bigserial primary key,
    actor_user_id text references users(id) on delete set null,
    action text not null,
    details jsonb,
    created_at timestamptz not null default now()
  );
  create index if not exists idx_sessions_user on sessions(user_id);
  create index if not exists idx_tx_user on transactions(user_id);
  create index if not exists idx_rounds_user on game_rounds(user_id);
  create table if not exists tickets (
    id bigserial primary key,
    user_id text not null references users(id) on delete cascade,
    subject text not null,
    content text not null,
    created_at timestamptz not null default now()
  );
  `);
  await pool.query("alter table users add constraint if not exists chk_role check (role in ('user','admin'))");
}

