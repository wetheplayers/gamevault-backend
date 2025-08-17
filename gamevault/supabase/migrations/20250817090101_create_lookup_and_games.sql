-- migration: create lookup system, games, and relationships
-- purpose: establishes unified lookups, games core entity, m2m relationships, rls policies, triggers, and indexes
-- considerations: all tables enable rls; policies grant least-privilege by role; performance indexes included

-- =====================================================================================
-- extensions (safe to run repeatedly)
-- =====================================================================================
create extension if not exists pg_trgm with schema extensions;
create extension if not exists btree_gin with schema extensions;

-- =====================================================================================
-- lookups
-- =====================================================================================
create table if not exists public.lookups (
  id uuid default gen_random_uuid() primary key,
  type varchar(50) not null,
  canonical_name varchar(255) not null,
  slug varchar(255) not null,
  description text,
  parent_id uuid references public.lookups(id),
  metadata jsonb default '{}'::jsonb,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  unique (type, slug)
);

comment on table public.lookups is 'Unified lookup system for all controlled vocabularies.';

alter table public.lookups enable row level security;

-- indexes for performance
create index if not exists idx_lookups_type_active on public.lookups(type) where deleted_at is null;
create index if not exists idx_lookups_slug on public.lookups(slug);
create index if not exists idx_lookups_parent_id on public.lookups(parent_id);

-- triggers
drop trigger if exists update_lookups_updated_at on public.lookups;
create trigger update_lookups_updated_at
  before update on public.lookups
  for each row execute function public.update_updated_at();

drop trigger if exists audit_lookups on public.lookups;
create trigger audit_lookups
  after insert or update or delete on public.lookups
  for each row execute function public.create_audit_log();

-- rls policies for lookups
drop policy if exists "lookups select public active" on public.lookups;
create policy "lookups select public active"
  on public.lookups
  for select
  to authenticated, anon
  using (is_active = true and deleted_at is null);

drop policy if exists "lookups admin insert" on public.lookups;
create policy "lookups admin insert"
  on public.lookups
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('admin','superadmin')
    )
  );

drop policy if exists "lookups admin update" on public.lookups;
create policy "lookups admin update"
  on public.lookups
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('admin','superadmin')
    )
  )
  with check (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('admin','superadmin')
    )
  );

drop policy if exists "lookups superadmin delete" on public.lookups;
create policy "lookups superadmin delete"
  on public.lookups
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role = 'superadmin'
    )
  );

-- =====================================================================================
-- lookup_aliases
-- =====================================================================================
create table if not exists public.lookup_aliases (
  id uuid default gen_random_uuid() primary key,
  lookup_id uuid references public.lookups(id) on delete cascade,
  alias varchar(255) not null,
  locale varchar(10),
  source varchar(100),
  created_at timestamptz default now() not null,
  created_by uuid references auth.users(id)
);

comment on table public.lookup_aliases is 'Alternative names (aliases) for lookups, optionally localized.';

alter table public.lookup_aliases enable row level security;

create index if not exists idx_lookup_aliases_lookup_id on public.lookup_aliases(lookup_id);
create index if not exists idx_lookup_aliases_alias on public.lookup_aliases(alias);

drop trigger if exists audit_lookup_aliases on public.lookup_aliases;
create trigger audit_lookup_aliases
  after insert or update or delete on public.lookup_aliases
  for each row execute function public.create_audit_log();

-- rls
drop policy if exists "lookup_aliases select public" on public.lookup_aliases;
create policy "lookup_aliases select public"
  on public.lookup_aliases
  for select
  to authenticated, anon
  using (true);

drop policy if exists "lookup_aliases mod insert" on public.lookup_aliases;
create policy "lookup_aliases mod insert"
  on public.lookup_aliases
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  );

drop policy if exists "lookup_aliases admin update" on public.lookup_aliases;
create policy "lookup_aliases admin update"
  on public.lookup_aliases
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('admin','superadmin')
    )
  )
  with check (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('admin','superadmin')
    )
  );

drop policy if exists "lookup_aliases admin delete" on public.lookup_aliases;
create policy "lookup_aliases admin delete"
  on public.lookup_aliases
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('admin','superadmin')
    )
  );

-- =====================================================================================
-- games (core entity)
-- =====================================================================================
create table if not exists public.games (
  id uuid default gen_random_uuid() primary key,
  canonical_title text not null,
  sort_title text not null,
  franchise_id uuid references public.lookups(id),
  series_position integer,
  synopsis_short text,
  description_long text,
  status public.game_status not null default 'announced',
  first_announced_date date,
  first_release_date date,
  primary_genre_id uuid references public.lookups(id),
  monetisation_model_id uuid references public.lookups(id),
  business_model_notes text,
  engine_id uuid references public.lookups(id),
  coop_supported boolean default false,
  max_players_local integer,
  max_players_online integer,
  avg_length_main numeric(5,2),
  avg_length_extra numeric(5,2),
  avg_length_completionist numeric(5,2),
  official_site text,
  press_kit_url text,
  age_ratings_summary text,
  cover_asset_id uuid,
  is_vr_only boolean default false,
  is_vr_supported boolean default false,
  is_cloud_only boolean default false,
  crossplay_supported boolean default false,
  crosssave_supported boolean default false,
  accessibility_summary text,
  tech_notes text,
  notes_internal text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  constraint check_vr_consistency check (not is_vr_only or is_vr_supported)
);

comment on table public.games is 'Primary games entity including business, technical, and accessibility metadata.';

alter table public.games enable row level security;

-- indexes
create index if not exists idx_games_status on public.games(status) where deleted_at is null;
create index if not exists idx_games_first_release_date on public.games(first_release_date);
create index if not exists idx_games_canonical_title_trgm on public.games using gin(canonical_title gin_trgm_ops);
create index if not exists idx_games_fts on public.games using gin(
  to_tsvector('english',
    coalesce(canonical_title,'') || ' ' || coalesce(synopsis_short,'') || ' ' || coalesce(description_long,'')
  )
);

-- triggers
drop trigger if exists update_games_updated_at on public.games;
create trigger update_games_updated_at
  before update on public.games
  for each row execute function public.update_updated_at();

drop trigger if exists audit_games on public.games;
create trigger audit_games
  after insert or update or delete on public.games
  for each row execute function public.create_audit_log();

-- rls policies for games
drop policy if exists "games anon select released" on public.games;
create policy "games anon select released"
  on public.games
  for select
  to anon
  using (status = 'released' and deleted_at is null);

drop policy if exists "games auth select published" on public.games;
create policy "games auth select published"
  on public.games
  for select
  to authenticated
  using (status in ('released','cancelled','delisted') and deleted_at is null);

drop policy if exists "games admin insert" on public.games;
create policy "games admin insert"
  on public.games
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('admin','superadmin','moderator')
    )
  );

drop policy if exists "games mod update" on public.games;
create policy "games mod update"
  on public.games
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    ) and deleted_at is null
  )
  with check (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    ) and deleted_at is null
  );

drop policy if exists "games admin delete" on public.games;
create policy "games admin delete"
  on public.games
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('admin','superadmin')
    )
  );

-- =====================================================================================
-- games relationships (m2m) & aliases/localisations
-- =====================================================================================

create table if not exists public.game_genres (
  game_id uuid references public.games(id) on delete cascade,
  genre_id uuid references public.lookups(id) on delete cascade,
  primary key (game_id, genre_id)
);

alter table public.game_genres enable row level security;
create index if not exists idx_game_genres_game_id on public.game_genres(game_id);
create index if not exists idx_game_genres_genre_id on public.game_genres(genre_id);

drop policy if exists "game_genres anon select released" on public.game_genres;
create policy "game_genres anon select released"
  on public.game_genres
  for select
  to anon
  using (
    exists (
      select 1 from public.games g
      where g.id = public.game_genres.game_id
      and g.status = 'released' and g.deleted_at is null
    )
  );

drop policy if exists "game_genres auth select published" on public.game_genres;
create policy "game_genres auth select published"
  on public.game_genres
  for select
  to authenticated
  using (
    exists (
      select 1 from public.games g
      where g.id = public.game_genres.game_id
      and g.status in ('released','cancelled','delisted') and g.deleted_at is null
    )
  );

drop policy if exists "game_genres mod write" on public.game_genres;
create policy "game_genres mod write"
  on public.game_genres
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  );

drop policy if exists "game_genres mod update" on public.game_genres;
create policy "game_genres mod update"
  on public.game_genres
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  )
  with check (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  );

drop policy if exists "game_genres admin delete" on public.game_genres;
create policy "game_genres admin delete"
  on public.game_genres
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('admin','superadmin')
    )
  );

create table if not exists public.game_themes (
  game_id uuid references public.games(id) on delete cascade,
  theme_id uuid references public.lookups(id) on delete cascade,
  primary key (game_id, theme_id)
);

alter table public.game_themes enable row level security;
create index if not exists idx_game_themes_game_id on public.game_themes(game_id);
create index if not exists idx_game_themes_theme_id on public.game_themes(theme_id);

drop policy if exists "game_themes anon select released" on public.game_themes;
create policy "game_themes anon select released"
  on public.game_themes
  for select
  to anon
  using (
    exists (
      select 1 from public.games g
      where g.id = public.game_themes.game_id
      and g.status = 'released' and g.deleted_at is null
    )
  );

drop policy if exists "game_themes auth select published" on public.game_themes;
create policy "game_themes auth select published"
  on public.game_themes
  for select
  to authenticated
  using (
    exists (
      select 1 from public.games g
      where g.id = public.game_themes.game_id
      and g.status in ('released','cancelled','delisted') and g.deleted_at is null
    )
  );

drop policy if exists "game_themes mod write" on public.game_themes;
create policy "game_themes mod write"
  on public.game_themes
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  );

drop policy if exists "game_themes mod update" on public.game_themes;
create policy "game_themes mod update"
  on public.game_themes
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  )
  with check (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  );

drop policy if exists "game_themes admin delete" on public.game_themes;
create policy "game_themes admin delete"
  on public.game_themes
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('admin','superadmin')
    )
  );

create table if not exists public.game_modes (
  game_id uuid references public.games(id) on delete cascade,
  mode_id uuid references public.lookups(id) on delete cascade,
  primary key (game_id, mode_id)
);

alter table public.game_modes enable row level security;
create index if not exists idx_game_modes_game_id on public.game_modes(game_id);
create index if not exists idx_game_modes_mode_id on public.game_modes(mode_id);

drop policy if exists "game_modes anon select released" on public.game_modes;
create policy "game_modes anon select released"
  on public.game_modes
  for select
  to anon
  using (
    exists (
      select 1 from public.games g
      where g.id = public.game_modes.game_id
      and g.status = 'released' and g.deleted_at is null
    )
  );

drop policy if exists "game_modes auth select published" on public.game_modes;
create policy "game_modes auth select published"
  on public.game_modes
  for select
  to authenticated
  using (
    exists (
      select 1 from public.games g
      where g.id = public.game_modes.game_id
      and g.status in ('released','cancelled','delisted') and g.deleted_at is null
    )
  );

drop policy if exists "game_modes mod write" on public.game_modes;
create policy "game_modes mod write"
  on public.game_modes
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  );

drop policy if exists "game_modes mod update" on public.game_modes;
create policy "game_modes mod update"
  on public.game_modes
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  )
  with check (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  );

drop policy if exists "game_modes admin delete" on public.game_modes;
create policy "game_modes admin delete"
  on public.game_modes
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('admin','superadmin')
    )
  );

create table if not exists public.game_localisations (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) on delete cascade,
  locale varchar(10) not null,
  display_title text not null,
  romanised_title text,
  is_official boolean default false,
  created_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  unique (game_id, locale)
);

alter table public.game_localisations enable row level security;

drop policy if exists "game_localisations anon select" on public.game_localisations;
create policy "game_localisations anon select"
  on public.game_localisations
  for select
  to anon
  using (
    exists (
      select 1 from public.games g
      where g.id = public.game_localisations.game_id
      and g.status = 'released' and g.deleted_at is null
    )
  );

drop policy if exists "game_localisations auth select" on public.game_localisations;
create policy "game_localisations auth select"
  on public.game_localisations
  for select
  to authenticated
  using (
    exists (
      select 1 from public.games g
      where g.id = public.game_localisations.game_id
      and g.status in ('released','cancelled','delisted') and g.deleted_at is null
    )
  );

drop policy if exists "game_localisations mod insert" on public.game_localisations;
create policy "game_localisations mod insert"
  on public.game_localisations
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  );

drop policy if exists "game_localisations mod update" on public.game_localisations;
create policy "game_localisations mod update"
  on public.game_localisations
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  )
  with check (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  );

drop policy if exists "game_localisations admin delete" on public.game_localisations;
create policy "game_localisations admin delete"
  on public.game_localisations
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('admin','superadmin')
    )
  );

create table if not exists public.game_aliases (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) on delete cascade,
  alias text not null,
  region_id uuid references public.lookups(id),
  source varchar(100),
  created_at timestamptz default now() not null,
  created_by uuid references auth.users(id)
);

alter table public.game_aliases enable row level security;
create index if not exists idx_game_aliases_game_id on public.game_aliases(game_id);

drop policy if exists "game_aliases anon select" on public.game_aliases;
create policy "game_aliases anon select"
  on public.game_aliases
  for select
  to anon
  using (
    exists (
      select 1 from public.games g
      where g.id = public.game_aliases.game_id
      and g.status = 'released' and g.deleted_at is null
    )
  );

drop policy if exists "game_aliases auth select" on public.game_aliases;
create policy "game_aliases auth select"
  on public.game_aliases
  for select
  to authenticated
  using (
    exists (
      select 1 from public.games g
      where g.id = public.game_aliases.game_id
      and g.status in ('released','cancelled','delisted') and g.deleted_at is null
    )
  );

drop policy if exists "game_aliases mod insert" on public.game_aliases;
create policy "game_aliases mod insert"
  on public.game_aliases
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  );

drop policy if exists "game_aliases mod update" on public.game_aliases;
create policy "game_aliases mod update"
  on public.game_aliases
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  )
  with check (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  );

drop policy if exists "game_aliases admin delete" on public.game_aliases;
create policy "game_aliases admin delete"
  on public.game_aliases
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('admin','superadmin')
    )
  );


