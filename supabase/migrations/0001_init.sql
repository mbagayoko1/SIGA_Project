-- ============================================================================
-- SIGA Portal — initial schema
-- Stores ALL portal data: WCA countries, PDP indicator catalog + attributed
-- observations (revisioned), users/audit/module-access, IRRF ledger,
-- quarterly monitoring reports, and editable module content blocks.
--
-- Apply with:  supabase db push   (or paste into the Supabase SQL editor)
-- ============================================================================

-- ---------- Reference: geography -------------------------------------------
create table if not exists countries (
  iso3          text primary key check (char_length(iso3) = 3),
  name          text not null,
  m49_code      text not null,
  region        text not null check (region in ('West Africa', 'Central Africa')),
  population_m  numeric,
  unfpa_active  boolean not null default true,
  crisis_level  smallint not null default 0 check (crisis_level between 0 and 5),
  idp_k         numeric not null default 0,
  refugee_k     numeric not null default 0
);

-- ---------- Reference: PDP indicator catalog --------------------------------
create table if not exists domains (
  id            text primary key,                -- slug, e.g. 'family-planning'
  name          text not null unique,            -- 'Family Planning'
  outcome_id    text not null check (outcome_id in ('outcome1','outcome2','outcome3','outcome4')),
  outcome_label text not null,
  color         text not null,
  icon          text not null
);

create table if not exists subdomains (
  id        text primary key,                    -- slug, e.g. 'family-planning/method-mix'
  domain_id text not null references domains(id) on delete cascade,
  name      text not null,
  unique (domain_id, name)
);

create table if not exists indicators (
  code         text primary key,                 -- PDP indicator_code, e.g. '33.1'
  subdomain_id text not null references subdomains(id) on delete cascade,
  name         text not null,
  short        text not null,
  unit         text not null,
  inverse      boolean not null default false    -- true = higher is better
);

-- ---------- Observations (revisioned, with provenance) ----------------------
create table if not exists revisions (
  id                    bigint generated always as identity primary key,
  generated_at          timestamptz not null default now(),
  current_year          int not null,
  primary_source        text not null default 'UNFPA PDP',
  stale_threshold_years int not null default 3,
  sources_used          text[] not null default '{}'
);

create table if not exists indicator_values (
  id             bigint generated always as identity primary key,
  revision_id    bigint not null references revisions(id) on delete cascade,
  indicator_code text not null references indicators(code) on delete cascade,
  iso3           text not null references countries(iso3) on delete cascade,
  value          numeric,                        -- null = no observation
  source         text not null,
  source_url     text not null default '',
  reference_year int,
  fetched_at     timestamptz,
  is_stale       boolean not null default false,
  fallback_used  boolean not null default false,
  unique (revision_id, indicator_code, iso3)
);
create index if not exists idx_indicator_values_lookup
  on indicator_values (indicator_code, iso3, revision_id desc);

-- ---------- Users, audit, module access --------------------------------------
create table if not exists profiles (
  uid             text primary key,              -- matches auth.uid() once Supabase Auth is wired
  email           text not null unique,
  display_name    text not null,
  role            text not null default 'viewer' check (role in ('admin','editor','viewer')),
  active          boolean not null default true,
  allowed_modules text[],                        -- null = all modules
  title           text,
  department      text,
  location        text,
  bio             text,
  photo_url       text,
  last_active     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists activity_logs (
  id        bigint generated always as identity primary key,
  user_id   text not null,
  user_name text not null,
  action    text not null,
  metadata  jsonb,
  ts        timestamptz not null default now()
);
create index if not exists idx_activity_logs_ts on activity_logs (ts desc);

create table if not exists module_access (
  module_key text primary key,                   -- ViewMode key, e.g. 'analytics'
  enabled    boolean not null default true
);

-- ---------- IRRF results framework -------------------------------------------
create table if not exists irrf_ledger (
  id               text primary key,             -- '1.1', '2.3', ...
  label            text not null,
  baseline         numeric not null,
  target_2029      numeric not null,
  current_regional numeric not null,
  unit             text not null,
  outcome_id       text not null check (outcome_id in ('outcome1','outcome2','outcome3','outcome4'))
);

-- ---------- Quarterly monitoring reports (Quantum Tracker) --------------------
create table if not exists monitoring_reports (
  id                bigint generated always as identity primary key,
  office            text not null,
  period            text not null,
  uploaded_by       text,
  uploaded_at       timestamptz not null default now(),
  total_milestones  int not null default 0,
  progress_reported int not null default 0,
  yet_to_report     int not null default 0,
  achieved          int not null default 0,
  not_achieved      int not null default 0,
  overachieved      int not null default 0,
  raw_file_path     text                          -- path in the 'monitoring-reports' Storage bucket
);

create table if not exists monitoring_outputs (
  id        bigint generated always as identity primary key,
  report_id bigint not null references monitoring_reports(id) on delete cascade,
  code      text not null,
  title     text not null
);

create table if not exists monitoring_milestones (
  id          bigint generated always as identity primary key,
  output_id   bigint not null references monitoring_outputs(id) on delete cascade,
  label       text not null,
  status      text not null check (status in ('Achieved','Overachieved','Not Achieved','Yet to be Reported')),
  responsible text
);

-- ---------- Editable module content (was hardcoded component arrays) ---------
create table if not exists content_blocks (
  id      bigint generated always as identity primary key,
  module  text not null,                          -- 'sp-alignment' | 'political' | 'dynamics' | ...
  key     text not null,
  payload jsonb not null,
  unique (module, key)
);

-- ============================================================================
-- Row-Level Security
--   Reference data: public read; writes only via service_role (seed/CI scripts).
--   Operational data: authenticated read/write; admin-gated where destructive.
--   is_admin() looks the caller up in profiles by auth.uid().
-- ============================================================================
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where uid = auth.uid()::text and role = 'admin' and active
  );
$$;

-- Reference tables: SELECT for everyone (the portal is a public site).
do $$
declare t text;
begin
  foreach t in array array['countries','domains','subdomains','indicators','revisions','indicator_values','irrf_ledger','content_blocks']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "public read" on %I', t);
    execute format('create policy "public read" on %I for select to anon, authenticated using (true)', t);
    -- no insert/update/delete policies → only service_role can write
  end loop;
end $$;

-- profiles: everyone authenticated can read; users update themselves; admins manage all.
alter table profiles enable row level security;
drop policy if exists "auth read profiles" on profiles;
create policy "auth read profiles" on profiles for select to authenticated using (true);
drop policy if exists "self update" on profiles;
create policy "self update" on profiles for update to authenticated
  using (uid = auth.uid()::text) with check (uid = auth.uid()::text and role = (select role from profiles p where p.uid = auth.uid()::text));
drop policy if exists "admin all profiles" on profiles;
create policy "admin all profiles" on profiles for all to authenticated
  using (is_admin()) with check (is_admin());

-- activity_logs: authenticated append + read; nobody edits history.
alter table activity_logs enable row level security;
drop policy if exists "auth read logs" on activity_logs;
create policy "auth read logs" on activity_logs for select to authenticated using (true);
drop policy if exists "auth insert logs" on activity_logs;
create policy "auth insert logs" on activity_logs for insert to authenticated with check (true);

-- module_access: authenticated read; admin write.
alter table module_access enable row level security;
drop policy if exists "auth read module_access" on module_access;
create policy "auth read module_access" on module_access for select to anon, authenticated using (true);
drop policy if exists "admin write module_access" on module_access;
create policy "admin write module_access" on module_access for all to authenticated
  using (is_admin()) with check (is_admin());

-- monitoring_*: authenticated read + insert (field uploads); admin delete.
do $$
declare t text;
begin
  foreach t in array array['monitoring_reports','monitoring_outputs','monitoring_milestones']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "auth read" on %I', t);
    execute format('create policy "auth read" on %I for select to authenticated using (true)', t);
    execute format('drop policy if exists "auth insert" on %I', t);
    execute format('create policy "auth insert" on %I for insert to authenticated with check (true)', t);
    execute format('drop policy if exists "admin delete" on %I', t);
    execute format('create policy "admin delete" on %I for delete to authenticated using (is_admin())', t);
  end loop;
end $$;

-- ---------- Storage bucket for original report files -------------------------
insert into storage.buckets (id, name, public)
values ('monitoring-reports', 'monitoring-reports', false)
on conflict (id) do nothing;

drop policy if exists "auth upload reports" on storage.objects;
create policy "auth upload reports" on storage.objects for insert to authenticated
  with check (bucket_id = 'monitoring-reports');
drop policy if exists "auth read reports" on storage.objects;
create policy "auth read reports" on storage.objects for select to authenticated
  using (bucket_id = 'monitoring-reports');
