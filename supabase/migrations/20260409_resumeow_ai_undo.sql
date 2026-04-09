alter table if exists public.resume_ai_change_sets
  add column if not exists previous_resume_data jsonb;

alter table if exists public.resume_ai_change_sets
  drop constraint if exists resume_ai_change_sets_status_check;

alter table if exists public.resume_ai_change_sets
  add constraint resume_ai_change_sets_status_check
  check (status in ('draft', 'applied', 'stale', 'discarded', 'reverted'));
