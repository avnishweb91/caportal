-- CAPortal Supabase Schema
-- Run this in your Supabase project SQL Editor (supabase.com → SQL Editor → New query)
-- Safe to re-run — uses IF NOT EXISTS / OR REPLACE throughout

-- ── Profiles (one per authenticated CA) ───────────────────────────────────
create table if not exists profiles (
  id            uuid references auth.users on delete cascade primary key,
  name          text,
  role          text default 'CA',
  firm_name     text,
  city          text,
  phone         text,
  -- Billing
  plan          text default 'trial',        -- trial | starter | pro | firm
  plan_expiry   timestamptz,                 -- null = still in trial
  trial_start   timestamptz default now(),
  created_at    timestamptz default now()
);
alter table profiles enable row level security;
drop policy if exists "Profiles: own rows only" on profiles;
create policy "Profiles: own rows only"
  on profiles for all using (auth.uid() = id);

-- ── Auto-create profile on signup ─────────────────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name, plan, trial_start)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'trial',
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ── Subscription payments (CA paying you for the platform) ────────────────
create table if not exists subscription_payments (
  id              bigserial primary key,
  ca_id           uuid references profiles(id) on delete cascade,
  ca_email        text,
  razorpay_id     text unique,
  plan            text not null,             -- starter | pro | firm
  amount          integer not null,          -- in rupees
  currency        text default 'INR',
  status          text default 'captured',
  plan_start      timestamptz default now(),
  plan_expiry     timestamptz,
  created_at      timestamptz default now()
);
alter table subscription_payments enable row level security;
drop policy if exists "Sub payments: own rows only" on subscription_payments;
create policy "Sub payments: own rows only"
  on subscription_payments for all using (auth.uid() = ca_id);

-- ── Clients ────────────────────────────────────────────────────────────────
create table if not exists clients (
  id            bigserial primary key,
  ca_id         uuid references profiles(id) on delete cascade,
  name          text not null,
  pan           text not null,
  phone         text,
  email         text,
  type          text default 'Individual ITR',
  plan          text default 'Starter',
  status        text default 'waiting_docs',
  fee_amount    integer default 0,
  fee_paid      boolean default false,
  docs_total    integer default 0,
  docs_received integer default 0,
  portal_token  text unique,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table clients enable row level security;
drop policy if exists "Clients: own CA rows only" on clients;
create policy "Clients: own CA rows only"
  on clients for all using (auth.uid() = ca_id);

-- ── Documents ──────────────────────────────────────────────────────────────
create table if not exists documents (
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
drop policy if exists "Documents: own CA rows only" on documents;
create policy "Documents: own CA rows only"
  on documents for all using (auth.uid() = ca_id);

-- ── Timeline events ────────────────────────────────────────────────────────
create table if not exists timeline_events (
  id          bigserial primary key,
  client_id   bigint references clients(id) on delete cascade,
  ca_id       uuid references profiles(id) on delete cascade,
  action      text not null,
  event_time  text,
  type        text default 'gray',
  created_at  timestamptz default now()
);
alter table timeline_events enable row level security;
drop policy if exists "Timeline: own CA rows only" on timeline_events;
create policy "Timeline: own CA rows only"
  on timeline_events for all using (auth.uid() = ca_id);

-- ── Reminders ──────────────────────────────────────────────────────────────
create table if not exists reminders (
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
drop policy if exists "Reminders: own CA rows only" on reminders;
create policy "Reminders: own CA rows only"
  on reminders for all using (auth.uid() = ca_id);

-- ── Client fee payments (client paying CA) ────────────────────────────────
create table if not exists client_payments (
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
alter table client_payments enable row level security;
drop policy if exists "Client payments: own CA rows only" on client_payments;
create policy "Client payments: own CA rows only"
  on client_payments for all using (auth.uid() = ca_id);

-- ── Auto-update updated_at on clients ─────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists clients_updated_at on clients;
create trigger clients_updated_at
  before update on clients
  for each row execute procedure set_updated_at();
