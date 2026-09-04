alter table confession_responses
add column if not exists message text;

alter table confession_responses
alter column choice drop not null;

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.confession_responses'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%choice%';
  if constraint_name is not null then
    execute format('alter table public.confession_responses drop constraint %I', constraint_name);
  end if;
end $$;

update public.confession_responses
set choice = case choice
  when 'yes' then 'willing'
  when 'no' then 'friend'
  when 'thinking' then 'time'
  when '愿意' then 'willing'
  when '不愿意' then 'friend'
  when '需要再想一想' then 'time'
  when '我愿意试着靠近你' then 'willing'
  when '我想继续做朋友' then 'friend'
  when '我需要一点时间' then 'time'
  else choice
end
where choice in ('yes', 'no', 'thinking', '愿意', '不愿意', '需要再想一想', '我愿意试着靠近你', '我想继续做朋友', '我需要一点时间');

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.confession_responses'::regclass
      and conname = 'confession_responses_choice_check'
  ) then
    alter table public.confession_responses
      add constraint confession_responses_choice_check
      check (choice in ('willing', 'friend', 'time'));
  end if;
end $$;
