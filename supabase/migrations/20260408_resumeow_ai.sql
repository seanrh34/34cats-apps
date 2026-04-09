create extension if not exists pgcrypto;
create extension if not exists vector;

alter table if exists public.resumes
  add column if not exists revision integer not null default 1;

create or replace function public.set_resume_revision()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    if new.title is distinct from old.title or new.resume_data is distinct from old.resume_data then
      new.revision = coalesce(old.revision, 1) + 1;
    else
      new.revision = old.revision;
    end if;
    new.updated_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists resumes_revision_trigger on public.resumes;
create trigger resumes_revision_trigger
before update on public.resumes
for each row
execute function public.set_resume_revision();

create table if not exists public.resume_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  professional_headline text not null default '',
  target_roles text[] not null default '{}',
  years_experience integer,
  location_preferences text[] not null default '{}',
  core_skills text[] not null default '{}',
  education_summary text not null default '',
  domain_focus text[] not null default '{}',
  achievement_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resume_ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'tool')),
  content text not null default '',
  tool_name text,
  tool_call_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.resume_ai_change_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  base_resume_revision integer not null,
  prompt text not null default '',
  summary text not null default '',
  status text not null default 'draft' check (status in ('draft', 'applied', 'stale', 'discarded', 'reverted')),
  previous_resume_data jsonb,
  proposed_resume_data jsonb not null,
  diff_items jsonb not null default '[]'::jsonb,
  citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  applied_at timestamptz
);

create table if not exists public.resume_job_descriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  company text not null default '',
  role text not null default '',
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rag_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete cascade,
  namespace text not null check (namespace in ('user_profile_docs', 'user_resume_history', 'job_descriptions', 'internal_resume_guides')),
  source_type text not null,
  source_id text not null,
  source_key text not null unique,
  title text not null default '',
  content text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rag_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.rag_documents(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete cascade,
  namespace text not null check (namespace in ('user_profile_docs', 'user_resume_history', 'job_descriptions', 'internal_resume_guides')),
  chunk_index integer not null,
  content text not null,
  embedding vector(1024),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.resume_ai_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  last_seen timestamptz not null default now(),
  primary key (user_id, action, window_start)
);

create index if not exists resumes_user_updated_idx
  on public.resumes (user_id, updated_at desc);

create index if not exists resume_ai_messages_user_resume_created_idx
  on public.resume_ai_messages (user_id, resume_id, created_at asc);

create index if not exists resume_ai_change_sets_user_resume_created_idx
  on public.resume_ai_change_sets (user_id, resume_id, created_at desc);

create index if not exists resume_job_descriptions_user_updated_idx
  on public.resume_job_descriptions (user_id, updated_at desc);

create index if not exists rag_documents_namespace_user_idx
  on public.rag_documents (namespace, user_id);

create index if not exists rag_chunks_namespace_user_idx
  on public.rag_chunks (namespace, user_id);

create index if not exists rag_chunks_embedding_idx
  on public.rag_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists resume_profiles_touch_updated_at on public.resume_profiles;
create trigger resume_profiles_touch_updated_at
before update on public.resume_profiles
for each row
execute function public.touch_updated_at();

drop trigger if exists resume_ai_change_sets_touch_updated_at on public.resume_ai_change_sets;
create trigger resume_ai_change_sets_touch_updated_at
before update on public.resume_ai_change_sets
for each row
execute function public.touch_updated_at();

drop trigger if exists resume_job_descriptions_touch_updated_at on public.resume_job_descriptions;
create trigger resume_job_descriptions_touch_updated_at
before update on public.resume_job_descriptions
for each row
execute function public.touch_updated_at();

drop trigger if exists rag_documents_touch_updated_at on public.rag_documents;
create trigger rag_documents_touch_updated_at
before update on public.rag_documents
for each row
execute function public.touch_updated_at();

create or replace function public.match_rag_chunks(
  query_embedding vector(1024),
  filter_user_id uuid,
  filter_resume_id uuid default null,
  filter_namespace text default null,
  match_count integer default 6
)
returns table (
  id uuid,
  document_id uuid,
  user_id uuid,
  resume_id uuid,
  namespace text,
  content text,
  chunk_index integer,
  metadata jsonb,
  similarity double precision
)
language sql
stable
as $$
  select
    rag_chunks.id,
    rag_chunks.document_id,
    rag_chunks.user_id,
    rag_chunks.resume_id,
    rag_chunks.namespace,
    rag_chunks.content,
    rag_chunks.chunk_index,
    rag_chunks.metadata,
    1 - (rag_chunks.embedding <=> query_embedding) as similarity
  from public.rag_chunks
  where rag_chunks.embedding is not null
    and (rag_chunks.user_id = filter_user_id or rag_chunks.user_id is null)
    and (filter_resume_id is null or rag_chunks.resume_id = filter_resume_id or rag_chunks.resume_id is null)
    and (filter_namespace is null or rag_chunks.namespace = filter_namespace)
  order by rag_chunks.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;

create or replace function public.check_and_increment_resume_ai_rate_limit(
  p_user_id uuid,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  current_count integer,
  limit_value integer,
  retry_after_seconds integer,
  window_started_at timestamptz
)
language plpgsql
security definer
as $$
declare
  v_now timestamptz := now();
  v_window_start timestamptz;
  v_count integer;
begin
  v_window_start :=
    to_timestamp(floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds);

  insert into public.resume_ai_rate_limits (user_id, action, window_start, count, last_seen)
  values (p_user_id, p_action, v_window_start, 1, v_now)
  on conflict (user_id, action, window_start)
  do update set
    count = public.resume_ai_rate_limits.count + 1,
    last_seen = excluded.last_seen
  returning count into v_count;

  return query
  select
    v_count <= p_limit as allowed,
    v_count as current_count,
    p_limit as limit_value,
    greatest(
      0,
      ceil(extract(epoch from ((v_window_start + make_interval(secs => p_window_seconds)) - v_now)))
    )::integer as retry_after_seconds,
    v_window_start as window_started_at;
end;
$$;

alter table public.resume_profiles enable row level security;
alter table public.resume_ai_messages enable row level security;
alter table public.resume_ai_change_sets enable row level security;
alter table public.resume_job_descriptions enable row level security;
alter table public.rag_documents enable row level security;
alter table public.rag_chunks enable row level security;
alter table public.resume_ai_rate_limits enable row level security;

drop policy if exists "resume_profiles_select_own" on public.resume_profiles;
create policy "resume_profiles_select_own"
on public.resume_profiles for select
using (auth.uid() = user_id);

drop policy if exists "resume_profiles_modify_own" on public.resume_profiles;
create policy "resume_profiles_modify_own"
on public.resume_profiles for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "resume_ai_messages_select_own" on public.resume_ai_messages;
create policy "resume_ai_messages_select_own"
on public.resume_ai_messages for select
using (auth.uid() = user_id);

drop policy if exists "resume_ai_messages_modify_own" on public.resume_ai_messages;
create policy "resume_ai_messages_modify_own"
on public.resume_ai_messages for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "resume_ai_change_sets_select_own" on public.resume_ai_change_sets;
create policy "resume_ai_change_sets_select_own"
on public.resume_ai_change_sets for select
using (auth.uid() = user_id);

drop policy if exists "resume_ai_change_sets_modify_own" on public.resume_ai_change_sets;
create policy "resume_ai_change_sets_modify_own"
on public.resume_ai_change_sets for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "resume_job_descriptions_select_own" on public.resume_job_descriptions;
create policy "resume_job_descriptions_select_own"
on public.resume_job_descriptions for select
using (auth.uid() = user_id);

drop policy if exists "resume_job_descriptions_modify_own" on public.resume_job_descriptions;
create policy "resume_job_descriptions_modify_own"
on public.resume_job_descriptions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "rag_documents_select_allowed" on public.rag_documents;
create policy "rag_documents_select_allowed"
on public.rag_documents for select
using (auth.uid() = user_id or user_id is null);

drop policy if exists "rag_documents_modify_allowed" on public.rag_documents;
create policy "rag_documents_modify_allowed"
on public.rag_documents for all
using (auth.uid() = user_id or user_id is null)
with check (auth.uid() = user_id or user_id is null);

drop policy if exists "rag_chunks_select_allowed" on public.rag_chunks;
create policy "rag_chunks_select_allowed"
on public.rag_chunks for select
using (auth.uid() = user_id or user_id is null);

drop policy if exists "rag_chunks_modify_allowed" on public.rag_chunks;
create policy "rag_chunks_modify_allowed"
on public.rag_chunks for all
using (auth.uid() = user_id or user_id is null)
with check (auth.uid() = user_id or user_id is null);

drop policy if exists "resume_ai_rate_limits_select_own" on public.resume_ai_rate_limits;
create policy "resume_ai_rate_limits_select_own"
on public.resume_ai_rate_limits for select
using (auth.uid() = user_id);

drop policy if exists "resume_ai_rate_limits_modify_own" on public.resume_ai_rate_limits;
create policy "resume_ai_rate_limits_modify_own"
on public.resume_ai_rate_limits for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
