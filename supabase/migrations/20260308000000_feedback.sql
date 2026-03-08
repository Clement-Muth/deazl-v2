create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  message text not null check (char_length(message) > 0 and char_length(message) <= 2000),
  page_url text,
  created_at timestamptz default now() not null
);

alter table public.feedback enable row level security;

create policy "Users can insert own feedback"
  on public.feedback for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can read own feedback"
  on public.feedback for select
  to authenticated
  using (user_id = auth.uid());
