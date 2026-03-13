create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now(),
  unique (user_id, platform)
);

alter table public.push_tokens enable row level security;

create policy "Users can manage their own push tokens"
  on public.push_tokens
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
