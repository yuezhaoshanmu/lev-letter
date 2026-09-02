create extension if not exists pgcrypto;

create table if not exists public.confession_responses (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null,
  choice text not null check (choice in ('yes', 'no', 'thinking')),
  submitted_at timestamptz not null default now()
);

create index if not exists confession_responses_visitor_idx
on public.confession_responses (visitor_id);

create index if not exists confession_responses_time_idx
on public.confession_responses (submitted_at desc);

alter table public.confession_responses enable row level security;
