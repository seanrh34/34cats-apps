-- Per-user AI request quota. One row per user; edit `remaining` in the
-- Supabase dashboard to grant or revoke requests. A row is created lazily
-- with the app default the first time a user sends an AI request.
create table if not exists public.resume_ai_quotas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  remaining integer not null default 30,
  updated_at timestamptz not null default now()
);

alter table public.resume_ai_quotas enable row level security;

drop policy if exists "resume_ai_quotas_select_own" on public.resume_ai_quotas;
create policy "resume_ai_quotas_select_own"
on public.resume_ai_quotas for select
using (auth.uid() = user_id);

-- Atomically consume one request. Seeds the row with p_default for new
-- users, then decrements only while remaining > 0.
create or replace function public.consume_resume_ai_quota(
  p_user_id uuid,
  p_default integer
)
returns table (allowed boolean, remaining integer)
language plpgsql
security definer
as $$
begin
  insert into public.resume_ai_quotas (user_id, remaining)
  values (p_user_id, p_default)
  on conflict (user_id) do nothing;

  return query
  update public.resume_ai_quotas q
     set remaining = q.remaining - 1,
         updated_at = now()
   where q.user_id = p_user_id
     and q.remaining > 0
  returning true, q.remaining;

  if not found then
    return query
    select false, q.remaining
      from public.resume_ai_quotas q
     where q.user_id = p_user_id;
  end if;
end;
$$;
