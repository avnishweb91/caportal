-- CAPortal Supabase Schema
-- Run this in your Supabase project → SQL Editor → New query
-- Safe to re-run — uses IF NOT EXISTS / OR REPLACE throughout
--
-- ── Migration block (safe for existing databases) ─────────────────────────
-- If you ran an earlier version of this schema, these statements bring your
-- existing tables up to date without touching existing data.

-- profiles: add missing columns from older schema runs
alter table if exists profiles
  add column if not exists name text,
  add column if not exists role text default 'CA',
  add column if not exists firm_name text,
  add column if not exists city text,
  add column if not exists phone text,
  add column if not exists membership_no text,
  add column if not exists upi_id text,
  add column if not exists upi_name text,
  add column if not exists trial_start timestamptz default now(),
  add column if not exists plan_expiry timestamptz;

-- clients: add portal_token if the column is missing from an older schema run
alter table if exists clients
  add column if not exists portal_token text unique;

-- acknowledgments: created below — this is a no-op if it already exists
-- (handled by create table if not exists)

-- ─────────────────────────────────────────────────────────────────────────

-- ── Profiles (one per authenticated CA) ───────────────────────────────────
create table if not exists profiles (
  id            uuid references auth.users on delete cascade primary key,
  name          text,
  role          text default 'CA',
  firm_name     text,
  city          text,
  phone         text,
  membership_no text,
  upi_id        text,
  upi_name      text,
  -- Billing
  plan          text default 'trial',        -- trial | starter | pro | firm
  plan_expiry   timestamptz,
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

-- ── Subscription payments (CA paying platform) ────────────────────────────
create table if not exists subscription_payments (
  id              bigserial primary key,
  ca_id           uuid references profiles(id) on delete cascade,
  ca_email        text,
  razorpay_id     text unique,
  plan            text not null,
  amount          integer not null,
  currency        text default 'INR',
  status          text default 'captured',
  plan_start      timestamptz default now(),
  plan_expiry     timestamptz,
  created_at      timestamptz default now()
);
alter table subscription_payments enable row level security;
drop policy if exists "Sub payments: own rows only" on subscription_payments;
drop policy if exists "Subscription payments: own read" on subscription_payments;
create policy "Subscription payments: own read"
  on subscription_payments for select using (auth.uid() = ca_id);

-- ── Clients ────────────────────────────────────────────────────────────────
create table if not exists clients (
  id            bigserial primary key,
  ca_id         uuid references profiles(id) on delete cascade,
  name          text not null,
  pan           text not null,
  phone         text,
  email         text,
  type          text default 'ITR-1',
  plan          text default 'Starter',
  status        text default 'waiting_docs',
  fee_amount    integer default 0,
  fee_paid      boolean default false,
  fee_payment_status text default 'pending',
  docs_total    integer default 0,
  docs_received integer default 0,
  portal_token  text unique not null,
  data          jsonb not null default '{}'::jsonb,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table clients
  add column if not exists fee_payment_status text default 'pending',
  add column if not exists data jsonb not null default '{}'::jsonb;
update clients set portal_token = replace(gen_random_uuid()::text, '-', '') where portal_token is null or portal_token = '';
alter table clients alter column portal_token set not null;
alter table clients enable row level security;

-- CA can do everything on their own clients
drop policy if exists "Clients: own rows only" on clients;
drop policy if exists "Clients: own CA rows only" on clients;
drop policy if exists "Clients: CA full access" on clients;
create policy "Clients: CA full access"
  on clients for all
  using (auth.uid() = ca_id);

-- Do not expose every client row through the anon key. Portal-token access must
-- be implemented through a server-side function that validates the presented
-- token and returns only that client's explicitly approved fields.
drop policy if exists "Clients: portal token read" on clients;

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

-- Preserve existing document rows when upgrading clients to the JSON payload
-- used by the application. This is a no-op for rows already migrated.
update clients c
set data = jsonb_build_object(
  'documents', coalesce((
    select jsonb_agg(jsonb_build_object(
      'name', d.name, 'uploaded', d.uploaded, 'date', d.upload_date, 'fileInfo',
      case when d.file_url is not null then jsonb_build_object('fileUrl', d.file_url) else null end
    ) order by d.id)
    from documents d where d.client_id = c.id
  ), '[]'::jsonb),
  'timeline', coalesce((
    select jsonb_agg(jsonb_build_object('action', t.action, 'time', t.event_time, 'type', t.type) order by t.id desc)
    from timeline_events t where t.client_id = c.id
  ), '[]'::jsonb),
  'acknowledgments', coalesce((
    select jsonb_agg(jsonb_build_object('id', a.id, 'type', a.type, 'refNo', a.ref_no, 'period', a.period, 'filedDate', a.filed_date, 'notes', a.notes) order by a.id)
    from acknowledgments a where a.client_id = c.id
  ), '[]'::jsonb)
)
where c.data = '{}'::jsonb;

-- CA: full access to their clients' documents
drop policy if exists "Documents: own CA rows only" on documents;
drop policy if exists "Documents: CA full access" on documents;
create policy "Documents: CA full access"
  on documents for all
  using (auth.uid() = ca_id);

-- Portal document writes require a server-side endpoint that validates the
-- portal token and binds the upload to that client's document. A policy based
-- only on portal_token IS NOT NULL grants access across all clients.
drop policy if exists "Documents: portal upload" on documents;

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

-- ── Acknowledgments ────────────────────────────────────────────────────────
create table if not exists acknowledgments (
  id          bigserial primary key,
  ca_id       uuid references profiles(id) on delete cascade,
  client_id   bigint references clients(id) on delete cascade,
  type        text not null,              -- itr | gst | tds | other
  ref_no      text not null,
  period      text,
  filed_date  date,
  notes       text,
  created_at  timestamptz default now()
);
alter table acknowledgments enable row level security;
drop policy if exists "Acknowledgments: own CA rows only" on acknowledgments;
create policy "Acknowledgments: own CA rows only"
  on acknowledgments for all using (auth.uid() = ca_id);

-- ── Auto-update updated_at on clients ─────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists clients_updated_at on clients;
create trigger clients_updated_at
  before update on clients
  for each row execute procedure set_updated_at();

-- ── Storage bucket + policies ────────────────────────────────────────────
-- Creates the 'ca-documents' bucket (private, 10MB file limit)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ca-documents',
  'ca-documents',
  false,
  10485760,   -- 10MB in bytes
  array['application/pdf','image/jpeg','image/png','image/jpg']
)
on conflict (id) do nothing;

-- CA: upload files to their own folder  ({ca_id}/...)
drop policy if exists "Storage: CA upload" on storage.objects;
create policy "Storage: CA upload"
  on storage.objects for insert
  with check (
    bucket_id = 'ca-documents'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- CA: read their own files
drop policy if exists "Storage: CA read" on storage.objects;
create policy "Storage: CA read"
  on storage.objects for select
  using (
    bucket_id = 'ca-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- CA: update their own files
drop policy if exists "Storage: CA update" on storage.objects;
create policy "Storage: CA update"
  on storage.objects for update
  using (
    bucket_id = 'ca-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- CA: delete their own files
drop policy if exists "Storage: CA delete" on storage.objects;
create policy "Storage: CA delete"
  on storage.objects for delete
  using (
    bucket_id = 'ca-documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Portal clients (unauthenticated): upload only to portal/{token}/ folder.
-- The 48-char token from crypto.getRandomValues() makes enumeration infeasible.
-- For production, replace with an Edge Function that validates the token against
-- the clients table before accepting the upload.
drop policy if exists "Storage: portal upload" on storage.objects;
create policy "Storage: portal upload"
  on storage.objects for insert
  with check (
    bucket_id = 'ca-documents'
    and (storage.foldername(name))[1] = 'portal'
    and length((storage.foldername(name))[2]) = 48  -- enforces our token length
  );

-- ── Admin stats RPC (run once in Supabase SQL Editor) ───────────────────────
-- Returns signup stats + full user list. Only callable by avnishweb91@gmail.com.
create or replace function admin_get_stats()
returns json language plpgsql security definer as $$
declare
  calling_email text;
begin
  select email into calling_email from auth.users where id = auth.uid();
  if calling_email is distinct from 'avnishweb91@gmail.com' then
    raise exception 'Access denied';
  end if;

  return (
    select json_build_object(
      'total',      count(*),
      'this_week',  count(*) filter (where p.created_at >= now() - interval '7 days'),
      'this_month', count(*) filter (where p.created_at >= now() - interval '30 days'),
      'trial',      count(*) filter (where p.plan = 'trial'),
      'starter',    count(*) filter (where p.plan = 'starter'),
      'pro',        count(*) filter (where p.plan = 'pro'),
      'firm',       count(*) filter (where p.plan = 'firm'),
      'users', coalesce(json_agg(
        json_build_object(
          'id',         p.id,
          'name',       p.name,
          'email',      u.email,
          'plan',       p.plan,
          'city',       p.city,
          'firm_name',  p.firm_name,
          'created_at', p.created_at
        ) order by p.created_at desc
      ) filter (where p.id is not null), '[]')
    )
    from profiles p
    join auth.users u on u.id = p.id
  );
end;
$$;

-- ── RLS verification queries (run these to confirm security) ──────────────
-- After running the schema, open a new SQL Editor tab and run each block
-- as the anon role to confirm cross-CA data leakage is impossible.

-- 1. Confirm RLS is ON for all tables:
-- select tablename, rowsecurity
-- from pg_tables
-- where schemaname = 'public'
-- order by tablename;
-- Expected: rowsecurity = true for ALL rows

-- 2. Confirm anon cannot read any CA data:
-- set role anon;
-- select count(*) from profiles;           -- must return 0
-- select count(*) from clients;            -- must return 0 (portal policy allows per-token only)
-- select count(*) from acknowledgments;    -- must return 0
-- reset role;

-- 3. Confirm no table is missing RLS:
-- select tablename from pg_tables
-- where schemaname = 'public'
-- and rowsecurity = false;
-- Expected: 0 rows
