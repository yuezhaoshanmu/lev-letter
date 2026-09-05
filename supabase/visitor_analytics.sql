create extension if not exists pgcrypto;

create table if not exists public.visitor_logs (
  id uuid primary key default gen_random_uuid(),
  ip_address text,
  user_agent text,
  device text check (device in ('PC', 'Mobile', 'Tablet')),
  session_id text not null,
  entry_time timestamptz not null default now(),
  leave_time timestamptz,
  duration_seconds integer,
  last_page text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.visitor_logs add column if not exists is_admin boolean not null default false;
create index if not exists visitor_logs_is_admin_idx on public.visitor_logs(is_admin);

create table if not exists public.visitor_events (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid references public.visitor_logs(id) on delete cascade,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  session_id uuid,
  page text,
  event_time timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

alter table public.visitor_events alter column visitor_id drop not null;
alter table public.visitor_events add column if not exists session_id uuid;
alter table public.visitor_events add column if not exists page text;
alter table public.visitor_events add column if not exists event_time timestamptz;
alter table public.visitor_events add column if not exists metadata jsonb;
alter table public.visitor_events alter column event_time set default now();
alter table public.visitor_events alter column metadata set default '{}'::jsonb;
update public.visitor_events set event_time = created_at where event_time is null;
update public.visitor_events set metadata = event_data where metadata is null;
alter table public.visitor_events alter column event_time set not null;
alter table public.visitor_events alter column metadata set not null;

create table if not exists public.visitor_sessions (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  ip_address text,
  user_agent text,
  device text check (device in ('PC', 'Mobile', 'Tablet')),
  entry_time timestamptz not null default now(),
  leave_time timestamptz,
  duration_seconds integer,
  entry_page text not null default '/',
  exit_page text,
  created_at timestamptz not null default now()
);

create index if not exists visitor_logs_entry_idx on public.visitor_logs(entry_time desc);
create index if not exists visitor_logs_session_idx on public.visitor_logs(session_id);
create index if not exists visitor_events_visitor_idx on public.visitor_events(visitor_id);
create index if not exists visitor_events_type_idx on public.visitor_events(event_type);
create index if not exists visitor_sessions_visitor_idx on public.visitor_sessions(visitor_id);
create index if not exists visitor_sessions_entry_idx on public.visitor_sessions(entry_time desc);
create index if not exists visitor_events_session_idx on public.visitor_events(session_id);
create index if not exists visitor_events_time_idx on public.visitor_events(event_time asc);
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'visitor_events_session_id_fkey'
      and conrelid = 'public.visitor_events'::regclass
  ) then
    alter table public.visitor_events
      add constraint visitor_events_session_id_fkey
      foreign key (session_id) references public.visitor_sessions(id) on delete cascade;
  end if;
end $$;

alter table public.visitor_logs enable row level security;
alter table public.visitor_events enable row level security;
alter table public.visitor_sessions enable row level security;
drop policy if exists "anon_insert_visitor_logs" on public.visitor_logs;
create policy "anon_insert_visitor_logs" on public.visitor_logs for insert to anon with check (true);
drop policy if exists "admin_select_visitor_logs" on public.visitor_logs;
create policy "admin_select_visitor_logs" on public.visitor_logs for select to authenticated using (true);
drop policy if exists "admin_select_visitor_events" on public.visitor_events;
create policy "admin_select_visitor_events" on public.visitor_events for select to authenticated using (true);
drop policy if exists "admin_select_visitor_sessions" on public.visitor_sessions;
create policy "admin_select_visitor_sessions" on public.visitor_sessions for select to authenticated using (true);
