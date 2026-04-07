create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.flashcats_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  max_decks integer not null default 3 check (max_decks > 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.flashcats_decks (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  is_public boolean not null default false,
  field_definitions jsonb not null default '[]'::jsonb,
  cards jsonb not null default '[]'::jsonb,
  card_count integer not null default 0 check (card_count >= 0 and card_count <= 100),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint flashcats_field_definitions_is_array check (jsonb_typeof(field_definitions) = 'array'),
  constraint flashcats_cards_is_array check (jsonb_typeof(cards) = 'array'),
  constraint flashcats_field_definitions_count check (jsonb_array_length(field_definitions) between 1 and 3),
  constraint flashcats_cards_match_count check (jsonb_array_length(cards) = card_count)
);

create table if not exists public.flashcats_user_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id uuid not null references public.flashcats_decks(id) on delete cascade,
  front_fields text[] not null,
  back_fields text[] not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, deck_id),
  constraint flashcats_front_fields_nonempty check (coalesce(array_length(front_fields, 1), 0) >= 1),
  constraint flashcats_back_fields_nonempty check (coalesce(array_length(back_fields, 1), 0) >= 1)
);

create or replace function public.validate_flashcats_deck_payload()
returns trigger
language plpgsql
as $$
declare
  field jsonb;
  card jsonb;
  seen_labels text[] := '{}';
begin
  if jsonb_array_length(new.field_definitions) < 1 or jsonb_array_length(new.field_definitions) > 3 then
    raise exception 'FlashCats decks must define between 1 and 3 fields.';
  end if;

  foreach field in array (select array_agg(value) from jsonb_array_elements(new.field_definitions)) loop
    if coalesce(trim(field->>'label'), '') = '' then
      raise exception 'FlashCats field labels cannot be blank.';
    end if;

    if field->>'key' not in ('field_1', 'field_2', 'field_3') then
      raise exception 'FlashCats field keys must be field_1, field_2, or field_3.';
    end if;

    if lower(field->>'label') = any(seen_labels) then
      raise exception 'FlashCats field labels must be unique.';
    end if;

    seen_labels := array_append(seen_labels, lower(field->>'label'));
  end loop;

  if jsonb_array_length(new.cards) > 100 then
    raise exception 'FlashCats decks can contain at most 100 cards.';
  end if;

  foreach card in array (select array_agg(value) from jsonb_array_elements(new.cards)) loop
    if jsonb_typeof(card) <> 'object' then
      raise exception 'Each FlashCats card must be a JSON object.';
    end if;

    if coalesce(trim(card->>'id'), '') = '' then
      raise exception 'Each FlashCats card must include an id.';
    end if;
  end loop;

  new.card_count = jsonb_array_length(new.cards);
  return new;
end;
$$;

create or replace function public.ensure_flashcats_user_can_create_deck()
returns trigger
language plpgsql
as $$
declare
  profile record;
  current_deck_count integer;
begin
  insert into public.flashcats_users (user_id)
  values (new.user_id)
  on conflict (user_id) do nothing;

  select *
  into profile
  from public.flashcats_users
  where user_id = new.user_id
  for update;

  select count(*)
  into current_deck_count
  from public.flashcats_decks
  where user_id = new.user_id;

  if current_deck_count >= profile.max_decks then
    raise exception 'You have reached your FlashCats deck limit.';
  end if;

  return new;
end;
$$;

drop trigger if exists flashcats_users_set_updated_at on public.flashcats_users;
create trigger flashcats_users_set_updated_at
before update on public.flashcats_users
for each row
execute function public.set_updated_at();

drop trigger if exists flashcats_decks_set_updated_at on public.flashcats_decks;
create trigger flashcats_decks_set_updated_at
before update on public.flashcats_decks
for each row
execute function public.set_updated_at();

drop trigger if exists flashcats_decks_validate_payload on public.flashcats_decks;
create trigger flashcats_decks_validate_payload
before insert or update on public.flashcats_decks
for each row
execute function public.validate_flashcats_deck_payload();

drop trigger if exists flashcats_decks_limit_check on public.flashcats_decks;
create trigger flashcats_decks_limit_check
before insert on public.flashcats_decks
for each row
execute function public.ensure_flashcats_user_can_create_deck();

drop trigger if exists flashcats_preferences_set_updated_at on public.flashcats_user_preferences;
create trigger flashcats_preferences_set_updated_at
before update on public.flashcats_user_preferences
for each row
execute function public.set_updated_at();

alter table public.flashcats_users enable row level security;
alter table public.flashcats_decks enable row level security;
alter table public.flashcats_user_preferences enable row level security;

drop policy if exists "flashcats_users_select_own" on public.flashcats_users;
create policy "flashcats_users_select_own"
on public.flashcats_users
for select
using (auth.uid() = user_id);

drop policy if exists "flashcats_users_insert_own" on public.flashcats_users;
create policy "flashcats_users_insert_own"
on public.flashcats_users
for insert
with check (auth.uid() = user_id);

drop policy if exists "flashcats_users_update_own" on public.flashcats_users;
create policy "flashcats_users_update_own"
on public.flashcats_users
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "flashcats_decks_select_public_or_owner" on public.flashcats_decks;
create policy "flashcats_decks_select_public_or_owner"
on public.flashcats_decks
for select
using (is_public = true or auth.uid() = user_id);

drop policy if exists "flashcats_decks_insert_own" on public.flashcats_decks;
create policy "flashcats_decks_insert_own"
on public.flashcats_decks
for insert
with check (auth.uid() = user_id);

drop policy if exists "flashcats_decks_update_own" on public.flashcats_decks;
create policy "flashcats_decks_update_own"
on public.flashcats_decks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "flashcats_decks_delete_own" on public.flashcats_decks;
create policy "flashcats_decks_delete_own"
on public.flashcats_decks
for delete
using (auth.uid() = user_id);

drop policy if exists "flashcats_preferences_select_own" on public.flashcats_user_preferences;
create policy "flashcats_preferences_select_own"
on public.flashcats_user_preferences
for select
using (auth.uid() = user_id);

drop policy if exists "flashcats_preferences_insert_own" on public.flashcats_user_preferences;
create policy "flashcats_preferences_insert_own"
on public.flashcats_user_preferences
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.flashcats_decks
    where flashcats_decks.id = deck_id
      and (flashcats_decks.is_public = true or flashcats_decks.user_id = auth.uid())
  )
);

drop policy if exists "flashcats_preferences_update_own" on public.flashcats_user_preferences;
create policy "flashcats_preferences_update_own"
on public.flashcats_user_preferences
for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.flashcats_decks
    where flashcats_decks.id = deck_id
      and (flashcats_decks.is_public = true or flashcats_decks.user_id = auth.uid())
  )
);

drop policy if exists "flashcats_preferences_delete_own" on public.flashcats_user_preferences;
create policy "flashcats_preferences_delete_own"
on public.flashcats_user_preferences
for delete
using (auth.uid() = user_id);
