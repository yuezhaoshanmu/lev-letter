create extension if not exists pgcrypto;

create table if not exists public.response_history (
  id uuid primary key default gen_random_uuid(),
  choice text not null check (choice in ('willing', 'friend', 'time')),
  created_at timestamptz not null default now(),
  ip_address text,
  user_agent text
);

create index if not exists response_history_created_idx
on public.response_history (created_at desc);

alter table public.response_history enable row level security;
