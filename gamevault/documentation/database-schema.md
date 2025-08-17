# GameVault Database Schema Documentation

## Overview
This document defines the complete database schema for GameVault, a video game database management system built on Supabase with PostgreSQL.

## Core Principles
- **UUID Primary Keys**: All tables use UUID with `gen_random_uuid()`
- **Row Level Security (RLS)**: Enabled on all tables
- **Audit Fields**: All tables include audit tracking
- **Soft Deletes**: Implemented via `deleted_at` timestamp
- **British English**: Used throughout for consistency

## Schema Structure

### 1. User Management & Authentication

```sql
-- User profiles extending Supabase auth.users
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username varchar(50) unique not null,
  display_name varchar(100),
  role user_role not null default 'user',
  avatar_url text,
  bio text,
  preferences jsonb default '{}',
  is_active boolean default true,
  last_activity_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- User role enumeration
create type user_role as enum ('superadmin', 'admin', 'moderator', 'user');

-- Permissions matrix
create table public.permissions (
  id uuid default gen_random_uuid() primary key,
  resource varchar(50) not null,
  action varchar(20) not null,
  role user_role not null,
  conditions jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(resource, action, role)
);

-- Audit trail for all changes
create table public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  action varchar(20) not null,
  table_name varchar(50) not null,
  record_id uuid not null,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now() not null
);

-- Moderation queue for content review
create table public.moderation_queue (
  id uuid default gen_random_uuid() primary key,
  entity_type varchar(50) not null,
  entity_id uuid not null,
  reason text,
  reported_by uuid references auth.users(id),
  assigned_to uuid references auth.users(id),
  status varchar(20) default 'pending',
  moderator_notes text,
  created_at timestamptz default now() not null,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id)
);
```

### 2. Lookup Tables System

```sql
-- Unified lookup system for all controlled vocabularies
create table public.lookups (
  id uuid default gen_random_uuid() primary key,
  type varchar(50) not null,
  canonical_name varchar(255) not null,
  slug varchar(255) not null,
  description text,
  parent_id uuid references public.lookups(id),
  metadata jsonb default '{}',
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  unique(type, slug)
);

-- Lookup aliases for alternative names
create table public.lookup_aliases (
  id uuid default gen_random_uuid() primary key,
  lookup_id uuid references public.lookups(id) on delete cascade,
  alias varchar(255) not null,
  locale varchar(10),
  source varchar(100),
  created_at timestamptz default now() not null,
  created_by uuid references auth.users(id)
);

-- Index for performance
create index idx_lookups_type_active on public.lookups(type) where deleted_at is null;
create index idx_lookups_slug on public.lookups(slug);
create index idx_lookup_aliases_alias on public.lookup_aliases(alias);
```

### 3. Core Game Entities

```sql
-- Games table (main entity)
create table public.games (
  id uuid default gen_random_uuid() primary key,
  canonical_title text not null,
  sort_title text not null,
  franchise_id uuid references public.lookups(id),
  series_position integer,
  synopsis_short text,
  description_long text,
  status game_status not null default 'announced',
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
  -- Audit fields
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  -- Constraints
  constraint check_vr_consistency check (not is_vr_only or is_vr_supported)
);

-- Game status enumeration
create type game_status as enum ('announced', 'in_development', 'released', 'cancelled', 'delisted');

-- Many-to-many relationships for games
create table public.game_genres (
  game_id uuid references public.games(id) on delete cascade,
  genre_id uuid references public.lookups(id) on delete cascade,
  primary key (game_id, genre_id)
);

create table public.game_themes (
  game_id uuid references public.games(id) on delete cascade,
  theme_id uuid references public.lookups(id) on delete cascade,
  primary key (game_id, theme_id)
);

create table public.game_modes (
  game_id uuid references public.games(id) on delete cascade,
  mode_id uuid references public.lookups(id) on delete cascade,
  primary key (game_id, mode_id)
);

-- Localised titles
create table public.game_localisations (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) on delete cascade,
  locale varchar(10) not null,
  display_title text not null,
  romanised_title text,
  is_official boolean default false,
  created_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  unique(game_id, locale)
);

-- Game aliases
create table public.game_aliases (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) on delete cascade,
  alias text not null,
  region_id uuid references public.lookups(id),
  source varchar(100),
  created_at timestamptz default now() not null,
  created_by uuid references auth.users(id)
);
```

### 4. Editions & Releases

```sql
-- Editions (SKUs)
create table public.editions (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  edition_name text not null,
  release_type_id uuid references public.lookups(id),
  includes_base_game boolean default true,
  bonus_content_description text,
  physical_contents text,
  digital_contents text,
  sku_code varchar(100),
  default_cover_asset_id uuid,
  is_port boolean default false,
  -- Audit fields
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);

-- Releases (platform/region specific)
create table public.releases (
  id uuid default gen_random_uuid() primary key,
  edition_id uuid references public.editions(id) on delete cascade not null,
  platform_id uuid references public.lookups(id) not null,
  region_id uuid references public.lookups(id) not null,
  release_date date,
  distribution_format_id uuid references public.lookups(id),
  min_players_local integer default 1,
  max_players_local integer,
  min_players_online integer default 0,
  max_players_online integer,
  crosssave_available boolean default false,
  install_size_gb numeric(10,2),
  requires_online boolean default false,
  drm_tech_id uuid references public.lookups(id),
  storefront_id uuid references public.lookups(id),
  store_product_id varchar(255),
  store_url text,
  delisted_date date,
  delisted_reason text,
  patch_baseline_version varchar(50),
  notes text,
  -- Audit fields
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  -- Constraints
  constraint check_player_counts check (
    max_players_local >= min_players_local and
    max_players_online >= min_players_online
  )
);

-- Release languages support
create table public.release_languages (
  id uuid default gen_random_uuid() primary key,
  release_id uuid references public.releases(id) on delete cascade,
  language_id uuid references public.lookups(id),
  has_interface boolean default false,
  has_audio boolean default false,
  has_subtitles boolean default false,
  unique(release_id, language_id)
);
```

### 5. Companies & People

```sql
-- Companies
create table public.companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  country_id uuid references public.lookups(id),
  founded_date date,
  website text,
  description text,
  is_defunct boolean default false,
  -- Audit fields
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);

-- Game-Company relationships
create table public.game_company_roles (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  role_id uuid references public.lookups(id) not null,
  region_id uuid references public.lookups(id),
  notes text,
  created_at timestamptz default now() not null,
  created_by uuid references auth.users(id)
);

-- People
create table public.people (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  country_id uuid references public.lookups(id),
  date_of_birth date,
  website text,
  bio text,
  -- Audit fields
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);

-- Credits
create table public.credits (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) on delete cascade,
  person_id uuid references public.people(id) on delete cascade,
  credit_role_id uuid references public.lookups(id) not null,
  department_id uuid references public.lookups(id),
  is_lead boolean default false,
  order_index integer,
  notes text,
  created_at timestamptz default now() not null,
  created_by uuid references auth.users(id)
);
```

### 6. Technical Specifications

```sql
-- Technical specs per release
create table public.technical_specs (
  id uuid default gen_random_uuid() primary key,
  release_id uuid references public.releases(id) on delete cascade unique,
  resolution_modes text,
  framerate_modes text,
  hdr_supported boolean default false,
  vrr_supported boolean default false,
  ray_tracing boolean default false,
  upscaler_name varchar(100),
  graphics_presets_notes text,
  vr_supported boolean default false,
  vr_required boolean default false,
  vr_platform_id uuid references public.lookups(id),
  cloud_saves boolean default false,
  cloud_provider_id uuid references public.lookups(id),
  anti_cheat_id uuid references public.lookups(id),
  -- Audit fields
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

-- System requirements (PC)
create table public.system_requirements (
  id uuid default gen_random_uuid() primary key,
  release_id uuid references public.releases(id) on delete cascade,
  requirement_type varchar(20) not null, -- 'minimum' or 'recommended'
  os_id uuid references public.lookups(id),
  cpu_name text,
  gpu_name text,
  ram_gb integer,
  storage_gb integer,
  directx_api_id uuid references public.lookups(id),
  notes text,
  -- Audit fields
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  unique(release_id, requirement_type)
);
```

### 7. Media Management

```sql
-- Media assets
create table public.media (
  id uuid default gen_random_uuid() primary key,
  entity_type varchar(20) not null, -- 'game', 'edition', 'release'
  entity_id uuid not null,
  media_type_id uuid references public.lookups(id) not null,
  title text,
  caption text,
  credit text,
  asset_source media_source not null,
  storage_bucket varchar(50),
  storage_path text,
  cdn_url text generated always as (
    case 
      when storage_bucket is not null and storage_path is not null 
      then 'https://[project].supabase.co/storage/v1/object/public/' || storage_bucket || '/' || storage_path
      else null
    end
  ) stored,
  source_url text,
  embed_provider varchar(50),
  embed_id varchar(100),
  mime_type varchar(100),
  file_size_bytes bigint,
  width integer,
  height integer,
  duration_sec integer,
  checksum varchar(255),
  language_id uuid references public.lookups(id),
  is_official boolean default false,
  is_nsfw boolean default false,
  -- Audit fields
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);

-- Media source enumeration
create type media_source as enum ('uploaded_file', 'external_url', 'embedded');
```

### 8. External IDs & Ratings

```sql
-- External IDs (Steam, GOG, etc.)
create table public.external_ids (
  id uuid default gen_random_uuid() primary key,
  entity_type varchar(20) not null,
  entity_id uuid not null,
  source_id uuid references public.lookups(id) not null,
  value text not null,
  region_id uuid references public.lookups(id),
  url text,
  created_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  unique(entity_type, entity_id, source_id, region_id)
);

-- Age ratings
create table public.age_ratings (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) on delete cascade,
  board_id uuid references public.lookups(id) not null,
  rating_category_id uuid references public.lookups(id) not null,
  interactive_elements text,
  rating_date date,
  certificate_id varchar(100),
  region_id uuid references public.lookups(id),
  notes text,
  -- Audit fields
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

-- Rating descriptors (many-to-many)
create table public.rating_descriptors (
  rating_id uuid references public.age_ratings(id) on delete cascade,
  descriptor_id uuid references public.lookups(id),
  primary key (rating_id, descriptor_id)
);
```

### 9. Change Management

```sql
-- Change requests for moderation workflow
create table public.change_requests (
  id uuid default gen_random_uuid() primary key,
  entity_type varchar(50) not null,
  entity_id uuid,
  proposed_changes jsonb not null,
  justification text,
  confidence_score numeric(3,2),
  submitted_by uuid references auth.users(id),
  reviewed_by uuid references auth.users(id),
  status varchar(20) default 'pending',
  review_notes text,
  created_at timestamptz default now() not null,
  reviewed_at timestamptz,
  approved_at timestamptz
);

-- Version history for major entities
create table public.entity_versions (
  id uuid default gen_random_uuid() primary key,
  entity_type varchar(50) not null,
  entity_id uuid not null,
  version_number integer not null,
  changes jsonb not null,
  changed_by uuid references auth.users(id),
  change_reason text,
  created_at timestamptz default now() not null
);
```

## Indexes for Performance

```sql
-- Games
create index idx_games_status on public.games(status) where deleted_at is null;
create index idx_games_first_release_date on public.games(first_release_date);
create index idx_games_canonical_title_trgm on public.games using gin(canonical_title gin_trgm_ops);
create index idx_games_fts on public.games using gin(
  to_tsvector('english', coalesce(canonical_title, '') || ' ' || 
    coalesce(synopsis_short, '') || ' ' || coalesce(description_long, ''))
);

-- Releases
create index idx_releases_edition_id on public.releases(edition_id) where deleted_at is null;
create index idx_releases_platform_id on public.releases(platform_id) where deleted_at is null;
create index idx_releases_release_date on public.releases(release_date);

-- Media
create index idx_media_entity on public.media(entity_type, entity_id) where deleted_at is null;
create index idx_media_type on public.media(media_type_id) where deleted_at is null;

-- Audit
create index idx_audit_logs_user_id on public.audit_logs(user_id);
create index idx_audit_logs_table_record on public.audit_logs(table_name, record_id);
create index idx_audit_logs_created_at on public.audit_logs(created_at desc);
```

## Database Functions

```sql
-- Auto-update timestamps
create or replace function public.update_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

-- Apply trigger to all tables with updated_at
create trigger update_games_updated_at 
  before update on public.games 
  for each row 
  execute function public.update_updated_at();

-- Repeat for all tables...

-- Soft delete function
create or replace function public.soft_delete()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.deleted_at := now();
  new.deleted_by := auth.uid();
  return new;
end;
$$;

-- Audit log function
create or replace function public.create_audit_log()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) values (
    auth.uid(),
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );
  return new;
end;
$$;
```

## Storage Buckets

```sql
-- Create storage buckets for media
insert into storage.buckets (id, name, public)
values 
  ('covers', 'covers', true),
  ('screenshots', 'screenshots', true),
  ('trailers', 'trailers', true),
  ('logos', 'logos', true),
  ('avatars', 'avatars', true);
```

## Initial Data Seeds

```sql
-- Seed permissions
insert into public.permissions (resource, action, role) values
  -- Superadmin: full access to everything
  ('games', 'create', 'superadmin'),
  ('games', 'read', 'superadmin'),
  ('games', 'update', 'superadmin'),
  ('games', 'delete', 'superadmin'),
  -- Admin: full CRUD on games
  ('games', 'create', 'admin'),
  ('games', 'read', 'admin'),
  ('games', 'update', 'admin'),
  ('games', 'delete', 'admin'),
  -- Moderator: read and update only
  ('games', 'read', 'moderator'),
  ('games', 'update', 'moderator'),
  -- User: read only
  ('games', 'read', 'user');

-- Seed essential lookups
insert into public.lookups (type, canonical_name, slug, sort_order) values
  -- Platforms
  ('platform', 'PlayStation 5', 'playstation-5', 1),
  ('platform', 'Xbox Series X/S', 'xbox-series-x-s', 2),
  ('platform', 'PC', 'pc', 3),
  ('platform', 'Nintendo Switch', 'nintendo-switch', 4),
  -- Genres
  ('genre', 'Action', 'action', 1),
  ('genre', 'Adventure', 'adventure', 2),
  ('genre', 'RPG', 'rpg', 3),
  ('genre', 'Strategy', 'strategy', 4),
  -- Regions
  ('region', 'North America', 'north-america', 1),
  ('region', 'Europe', 'europe', 2),
  ('region', 'Japan', 'japan', 3),
  ('region', 'Global', 'global', 4);
```
