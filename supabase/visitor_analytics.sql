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
  visitor_id uuid not null references public.visitor_logs(id) on delete cascade,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists visitor_logs_entry_idx on public.visitor_logs(entry_time desc);
create index if not exists visitor_logs_session_idx on public.visitor_logs(session_id);
create index if not exists visitor_events_visitor_idx on public.visitor_events(visitor_id);
create index if not exists visitor_events_type_idx on public.visitor_events(event_type);
alter table public.visitor_logs enable row level security;
alter table public.visitor_events enable row level security;
