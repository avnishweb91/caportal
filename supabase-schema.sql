-- CAPortal Supabase Schema
-- Run this in your Supabase project's SQL editor

-- Enable Row Level Security on all tables

-- ── Profiles (one per authenticated CA) ───────────────────────────────────
create table profiles (
  id          uuid references auth.users on delete cascade primary key,
  name        text,
  role        text default 'CA',
  firm_name   text,
  city        text,
  plan        text default 'Starter',
  created_at  timestamptz default now()
);
alter table profiles enable row level security;
create policy "Profiles: own rows only"
  on profiles for all using (auth.uid() = id);

-- ── Clients ────────────────────────────────────────────────────────────────
create table clients (
  id           bigserial primary key,
  ca_id        uuid references profiles(id) on delete cascade,
  name         text not null,
  pan          text not null,
  phone        text,
  email        text,
  type         text default 'Individual ITR',
  plan         text default 'Starter',
  status       text default 'waiting_docs',
  fee_amount   integer default 0,
  fee_paid     boolean default false,
  docs_total   integer default 0,
  docs_received integer default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
alter table clients enable row level security;
create policy "Clients: own CA rows only"
  on clients for all using (auth.uid() = ca_id);

-- ── Documents ──────────────────────────────────────────────────────────────
create table documents (
  id          bigserial primary key,
  client_id   bigint references clients(id) on delete cascade,
  ca_id       uuid references profiles(id) on delete cascade,
  name        text not null,
  uploaded    boolean default false,
  upload_date text,
  file_url    text,
  created_at  timestamptz default now()
);
alter table documents enable row level security;
create policy "Documents: own CA rows only"
  on documents for all using (auth.uid() = ca_id);

-- ── Timeline events ────────────────────────────────────────────────────────
create table timeline_events (
  id          bigserial primary key,
  client_id   bigint references clients(id) on delete cascade,
  ca_id       uuid references profiles(id) on delete cascade,
  action      text not null,
  event_time  text,
  type        text default 'gray',
  created_at  timestamptz default now()
);
alter table timeline_events enable row level security;
create policy "Timeline: own CA rows only"
  on timeline_events for all using (auth.uid() = ca_id);

-- ── Reminders ──────────────────────────────────────────────────────────────
create table reminders (
  id          bigserial primary key,
  ca_id       uuid references profiles(id) on delete cascade,
  client_id   bigint references clients(id) on delete cascade,
  client_name text,
  message     text,
  via         text default 'WhatsApp',
  status      text default 'sent',
  sent_at     timestamptz default now()
);
alter table reminders enable row level security;
create policy "Reminders: own CA rows only"
  on reminders for all using (auth.uid() = ca_id);

-- ── Payments ───────────────────────────────────────────────────────────────
create table payments (
  id             bigserial primary key,
  ca_id          uuid references profiles(id) on delete cascade,
  client_id      bigint references clients(id) on delete cascade,
  razorpay_id    text,
  amount         integer,
  currency       text default 'INR',
  status         text default 'captured',
  description    text,
  paid_at        timestamptz default now()
);
alter table payments enable row level security;
create policy "Payments: own CA rows only"
  on payments for all using (auth.uid() = ca_id);

-- ── Auto-update updated_at on clients ─────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger clients_updated_at
  before update on clients
  for each row execute procedure set_updated_at();
