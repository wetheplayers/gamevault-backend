-- migration: add unique auto-generated slug to games, derived from canonical_title
-- purpose: ensure every game has a stable, unique, url-friendly slug
-- considerations: idempotent where possible; uses trigger to maintain slug on insert/update

-- add column if not exists
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'games' and column_name = 'slug'
  ) then
    alter table public.games add column slug text;
  end if;
end $$;

-- helper: slugify text (lowercase, hyphenate non-alphanum, trim hyphens)
create or replace function public.slugify(p_input text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(p_input, '')),
    '[^a-z0-9]+', '-', 'g'))
$$;

-- helper: generate unique slug for games
create or replace function public.generate_unique_game_slug(p_title text, p_exclude_id uuid default null)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  base text := public.slugify(p_title);
  candidate text;
  suffix int := 1;
  exists_count int;
begin
  if base is null or base = '' then
    base := 'game';
  end if;

  candidate := base;

  loop
    select count(*) into exists_count
    from public.games g
    where g.slug = candidate
      and (p_exclude_id is null or g.id <> p_exclude_id);

    exit when exists_count = 0;
    suffix := suffix + 1;
    candidate := base || '-' || suffix::text;
  end loop;

  return candidate;
end;
$$;

-- trigger to set slug on insert/update of canonical_title
create or replace function public.set_game_slug()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if TG_OP = 'INSERT' then
    if new.slug is null or new.slug = '' then
      new.slug := public.generate_unique_game_slug(new.canonical_title, new.id);
    end if;
  elsif TG_OP = 'UPDATE' then
    if new.canonical_title is distinct from old.canonical_title then
      new.slug := public.generate_unique_game_slug(new.canonical_title, new.id);
    end if;
  end if;
  return new;
end;
$$;

do $$
begin
  if exists (
    select 1 from pg_trigger
    where tgname = 'set_game_slug_trg'
  ) then
    drop trigger set_game_slug_trg on public.games;
  end if;
end $$;

create trigger set_game_slug_trg
  before insert or update of canonical_title on public.games
  for each row execute function public.set_game_slug();

-- backfill existing records via no-op update to fire trigger
update public.games set canonical_title = canonical_title where slug is null;

-- add unique index and not-null constraint (if not present)
do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'idx_games_slug_unique'
  ) then
    create unique index idx_games_slug_unique on public.games(slug);
  end if;
end $$;

alter table public.games alter column slug set not null;


