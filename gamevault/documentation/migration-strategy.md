# Database Migration Strategy

## Overview
This document outlines the step-by-step migration strategy for implementing the GameVault database schema in Supabase.

## Migration Phases

### Phase 1: Foundation (Week 1)
Core infrastructure and user management system.

#### Migration 1.1: User Management
```sql
-- File: 20240101000001_create_user_management.sql
-- Purpose: Set up user profiles and permissions system
-- Dependencies: Supabase Auth

-- Create user role enum
create type user_role as enum ('superadmin', 'admin', 'moderator', 'user');

-- User profiles
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

-- Enable RLS
alter table public.user_profiles enable row level security;

-- Create RLS policies
create policy "user_profiles_own_select" on public.user_profiles
  for select to authenticated
  using (id = auth.uid());

-- Create indexes
create index idx_user_profiles_username on public.user_profiles(username);
create index idx_user_profiles_role on public.user_profiles(role);

-- Create trigger for new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profiles (id, username, display_name)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'display_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

#### Migration 1.2: Audit System
```sql
-- File: 20240101000002_create_audit_system.sql
-- Purpose: Implement audit logging
-- Dependencies: user_profiles

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

-- Enable RLS
alter table public.audit_logs enable row level security;

-- Indexes for performance
create index idx_audit_logs_user_id on public.audit_logs(user_id);
create index idx_audit_logs_table_record on public.audit_logs(table_name, record_id);
create index idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- Audit function
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

#### Migration 1.3: Permissions System
```sql
-- File: 20240101000003_create_permissions.sql
-- Purpose: Set up role-based permissions
-- Dependencies: user_role enum

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

-- Enable RLS
alter table public.permissions enable row level security;

-- Seed initial permissions
insert into public.permissions (resource, action, role) values
  -- Superadmin permissions
  ('*', '*', 'superadmin'),
  -- Admin permissions  
  ('games', 'create', 'admin'),
  ('games', 'read', 'admin'),
  ('games', 'update', 'admin'),
  ('games', 'delete', 'admin'),
  -- Moderator permissions
  ('games', 'read', 'moderator'),
  ('games', 'update', 'moderator'),
  -- User permissions
  ('games', 'read', 'user');
```

### Phase 2: Lookup System (Week 1-2)

#### Migration 2.1: Unified Lookups Table
```sql
-- File: 20240102000001_create_lookups.sql
-- Purpose: Create unified lookup system
-- Dependencies: audit system

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

-- Enable RLS
alter table public.lookups enable row level security;

-- Create indexes
create index idx_lookups_type_active on public.lookups(type) where deleted_at is null;
create index idx_lookups_slug on public.lookups(slug);
create index idx_lookups_parent_id on public.lookups(parent_id);

-- Create audit trigger
create trigger audit_lookups
  after insert or update or delete on public.lookups
  for each row execute function public.create_audit_log();
```

#### Migration 2.2: Lookup Aliases
```sql
-- File: 20240102000002_create_lookup_aliases.sql
-- Purpose: Support alternative names for lookups
-- Dependencies: lookups

create table public.lookup_aliases (
  id uuid default gen_random_uuid() primary key,
  lookup_id uuid references public.lookups(id) on delete cascade,
  alias varchar(255) not null,
  locale varchar(10),
  source varchar(100),
  created_at timestamptz default now() not null,
  created_by uuid references auth.users(id)
);

-- Enable RLS
alter table public.lookup_aliases enable row level security;

-- Create indexes
create index idx_lookup_aliases_lookup_id on public.lookup_aliases(lookup_id);
create index idx_lookup_aliases_alias on public.lookup_aliases(alias);
```

#### Migration 2.3: Seed Essential Lookups
```sql
-- File: 20240102000003_seed_lookups.sql
-- Purpose: Initial lookup data
-- Dependencies: lookups table

-- Platforms
insert into public.lookups (type, canonical_name, slug, sort_order) values
  ('platform', 'PC', 'pc', 1),
  ('platform', 'PlayStation 5', 'playstation-5', 2),
  ('platform', 'Xbox Series X/S', 'xbox-series-x-s', 3),
  ('platform', 'Nintendo Switch', 'nintendo-switch', 4),
  ('platform', 'PlayStation 4', 'playstation-4', 5),
  ('platform', 'Xbox One', 'xbox-one', 6);

-- Genres
insert into public.lookups (type, canonical_name, slug, sort_order) values
  ('genre', 'Action', 'action', 1),
  ('genre', 'Adventure', 'adventure', 2),
  ('genre', 'RPG', 'rpg', 3),
  ('genre', 'Strategy', 'strategy', 4),
  ('genre', 'Simulation', 'simulation', 5),
  ('genre', 'Sports', 'sports', 6),
  ('genre', 'Racing', 'racing', 7),
  ('genre', 'Puzzle', 'puzzle', 8);

-- Continue with other lookup types...
```

### Phase 3: Core Game Tables (Week 2)

#### Migration 3.1: Games Table
```sql
-- File: 20240103000001_create_games.sql
-- Purpose: Main games table
-- Dependencies: lookups, audit system

-- Create game status enum
create type game_status as enum (
  'announced', 
  'in_development', 
  'released', 
  'cancelled', 
  'delisted'
);

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
  -- ... other fields ...
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  -- Constraints
  constraint check_vr_consistency check (not is_vr_only or is_vr_supported)
);

-- Enable RLS
alter table public.games enable row level security;

-- Create indexes
create index idx_games_status on public.games(status) where deleted_at is null;
create index idx_games_first_release_date on public.games(first_release_date);
create index idx_games_canonical_title_trgm on public.games 
  using gin(canonical_title gin_trgm_ops);

-- Full-text search
create index idx_games_fts on public.games using gin(
  to_tsvector('english', 
    coalesce(canonical_title, '') || ' ' || 
    coalesce(synopsis_short, '') || ' ' || 
    coalesce(description_long, ''))
);

-- Audit trigger
create trigger audit_games
  after insert or update or delete on public.games
  for each row execute function public.create_audit_log();
```

#### Migration 3.2: Game Relationships
```sql
-- File: 20240103000002_create_game_relationships.sql
-- Purpose: Many-to-many relationships for games
-- Dependencies: games, lookups

-- Game genres
create table public.game_genres (
  game_id uuid references public.games(id) on delete cascade,
  genre_id uuid references public.lookups(id) on delete cascade,
  primary key (game_id, genre_id)
);

-- Game themes
create table public.game_themes (
  game_id uuid references public.games(id) on delete cascade,
  theme_id uuid references public.lookups(id) on delete cascade,
  primary key (game_id, theme_id)
);

-- Game modes
create table public.game_modes (
  game_id uuid references public.games(id) on delete cascade,
  mode_id uuid references public.lookups(id) on delete cascade,
  primary key (game_id, mode_id)
);

-- Enable RLS on all
alter table public.game_genres enable row level security;
alter table public.game_themes enable row level security;
alter table public.game_modes enable row level security;
```

### Phase 4: Editions & Releases (Week 2-3)

#### Migration 4.1: Editions Table
```sql
-- File: 20240104000001_create_editions.sql
-- Purpose: Game editions/SKUs
-- Dependencies: games

create table public.editions (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  edition_name text not null,
  release_type_id uuid references public.lookups(id),
  includes_base_game boolean default true,
  -- ... other fields ...
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);

-- Enable RLS and create indexes
alter table public.editions enable row level security;
create index idx_editions_game_id on public.editions(game_id) where deleted_at is null;
```

#### Migration 4.2: Releases Table
```sql
-- File: 20240104000002_create_releases.sql
-- Purpose: Platform/region specific releases
-- Dependencies: editions, lookups

create table public.releases (
  id uuid default gen_random_uuid() primary key,
  edition_id uuid references public.editions(id) on delete cascade not null,
  platform_id uuid references public.lookups(id) not null,
  region_id uuid references public.lookups(id) not null,
  release_date date,
  -- ... other fields ...
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

-- Enable RLS and create indexes
alter table public.releases enable row level security;
create index idx_releases_edition_id on public.releases(edition_id) where deleted_at is null;
create index idx_releases_platform_id on public.releases(platform_id) where deleted_at is null;
create index idx_releases_release_date on public.releases(release_date);
```

### Phase 5: Media & Storage (Week 3)

#### Migration 5.1: Storage Buckets
```sql
-- File: 20240105000001_create_storage_buckets.sql
-- Purpose: Set up Supabase storage
-- Dependencies: None

-- Create storage buckets
insert into storage.buckets (id, name, public) values
  ('covers', 'covers', true),
  ('screenshots', 'screenshots', true),
  ('trailers', 'trailers', true),
  ('logos', 'logos', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage policies are created in the next migration
```

#### Migration 5.2: Media Table
```sql
-- File: 20240105000002_create_media.sql
-- Purpose: Media management
-- Dependencies: storage buckets

-- Media source enum
create type media_source as enum ('uploaded_file', 'external_url', 'embedded');

create table public.media (
  id uuid default gen_random_uuid() primary key,
  entity_type varchar(20) not null,
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
      then 'https://[project].supabase.co/storage/v1/object/public/' || 
           storage_bucket || '/' || storage_path
      else null
    end
  ) stored,
  -- ... other fields ...
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);

-- Enable RLS and create indexes
alter table public.media enable row level security;
create index idx_media_entity on public.media(entity_type, entity_id) where deleted_at is null;
create index idx_media_type on public.media(media_type_id) where deleted_at is null;
```

### Phase 6: RLS Policies (Week 3-4)

#### Migration 6.1: Core RLS Policies
```sql
-- File: 20240106000001_create_rls_policies.sql
-- Purpose: Implement Row Level Security
-- Dependencies: All tables created

-- Games RLS
create policy "games_superadmin_all" on public.games
  for all to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'superadmin'
    )
  );

create policy "games_admin_all" on public.games
  for all to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Continue with all other policies...
```

### Phase 7: Functions & Triggers (Week 4)

#### Migration 7.1: Helper Functions
```sql
-- File: 20240107000001_create_helper_functions.sql
-- Purpose: Database functions for common operations
-- Dependencies: All tables

-- Update timestamp function
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

-- Get user role function
create or replace function public.get_user_role()
returns user_role
language sql
security invoker
stable
set search_path = ''
as $$
  select role from public.user_profiles where id = auth.uid();
$$;

-- Check permission function
create or replace function public.has_permission(
  p_resource text,
  p_action text
)
returns boolean
language sql
security invoker
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.permissions
    where resource = p_resource
    and action = p_action
    and role = (select public.get_user_role())
  );
$$;
```

#### Migration 7.2: Apply Triggers
```sql
-- File: 20240107000002_apply_triggers.sql
-- Purpose: Apply triggers to all tables
-- Dependencies: Helper functions

-- Apply update_updated_at trigger to all tables
create trigger update_games_updated_at 
  before update on public.games 
  for each row execute function public.update_updated_at();

create trigger update_editions_updated_at 
  before update on public.editions 
  for each row execute function public.update_updated_at();

-- Continue for all tables...
```

### Phase 8: Optimisation (Week 4-5)

#### Migration 8.1: Performance Indexes
```sql
-- File: 20240108000001_create_performance_indexes.sql
-- Purpose: Additional indexes for query performance
-- Dependencies: All tables

-- Composite indexes for common queries
create index idx_games_status_release_date 
  on public.games(status, first_release_date desc) 
  where deleted_at is null;

create index idx_releases_date_platform 
  on public.releases(release_date desc, platform_id) 
  where deleted_at is null;

-- Partial indexes for common filters
create index idx_games_released 
  on public.games(first_release_date desc) 
  where status = 'released' and deleted_at is null;
```

#### Migration 8.2: Materialised Views
```sql
-- File: 20240108000002_create_materialised_views.sql
-- Purpose: Pre-computed views for complex queries
-- Dependencies: All tables

-- Game statistics view
create materialized view public.game_statistics as
select 
  g.id,
  g.canonical_title,
  count(distinct e.id) as edition_count,
  count(distinct r.id) as release_count,
  count(distinct r.platform_id) as platform_count,
  min(r.release_date) as earliest_release,
  max(r.release_date) as latest_release
from public.games g
left join public.editions e on e.game_id = g.id and e.deleted_at is null
left join public.releases r on r.edition_id = e.id and r.deleted_at is null
where g.deleted_at is null
group by g.id, g.canonical_title;

-- Create index on materialised view
create unique index idx_game_statistics_id on public.game_statistics(id);

-- Refresh function
create or replace function public.refresh_game_statistics()
returns void
language sql
security definer
set search_path = ''
as $$
  refresh materialized view concurrently public.game_statistics;
$$;
```

## Rollback Strategy

Each migration should have a corresponding rollback script:

```sql
-- Rollback example: 20240101000001_create_user_management_rollback.sql
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.user_profiles cascade;
drop type if exists user_role cascade;
```

## Testing Strategy

### 1. Unit Tests for Functions
```sql
-- Test user role function
select public.get_user_role(); -- Should return current user's role

-- Test permission check
select public.has_permission('games', 'read'); -- Should return true/false
```

### 2. RLS Policy Tests
```sql
-- Test as different roles
set role authenticated;
set request.jwt.claims to '{"sub": "test-user-id"}';

-- Try operations
select * from public.games;
insert into public.games (...) values (...);

reset role;
```

### 3. Performance Tests
```sql
-- Explain analyze for query performance
explain analyze
select g.*, array_agg(distinct gg.genre_id) as genres
from public.games g
left join public.game_genres gg on gg.game_id = g.id
where g.status = 'released'
group by g.id
limit 20;
```

## Monitoring & Maintenance

### Database Health Checks
```sql
-- Check table sizes
select 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
from pg_tables
where schemaname = 'public'
order by pg_total_relation_size(schemaname||'.'||tablename) desc;

-- Check slow queries
select 
  query,
  calls,
  mean_exec_time,
  total_exec_time
from pg_stat_statements
order by mean_exec_time desc
limit 10;

-- Check index usage
select 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
from pg_stat_user_indexes
where schemaname = 'public'
order by idx_scan desc;
```

### Regular Maintenance Tasks
1. Weekly: Refresh materialised views
2. Monthly: Analyze tables for query planner
3. Quarterly: Review and optimise indexes
4. Annually: Archive old audit logs

## CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Database Migrations

on:
  push:
    paths:
      - 'supabase/migrations/*.sql'

jobs:
  test-migrations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
      - name: Start Supabase
        run: supabase start
      - name: Run migrations
        run: supabase db push
      - name: Run tests
        run: npm run test:db
      - name: Stop Supabase
        run: supabase stop
```

## Timeline & Resources

### Week 1: Foundation
- User management
- Audit system
- Permissions

### Week 2: Core Data
- Lookup system
- Games table
- Basic relationships

### Week 3: Extended Features
- Editions & Releases
- Media management
- Storage setup

### Week 4: Security & Optimisation
- RLS policies
- Functions & triggers
- Performance indexes

### Week 5: Testing & Deployment
- Comprehensive testing
- Performance tuning
- Production deployment

### Resources Required
- 1 Senior Database Developer
- 1 Backend Developer
- 1 DevOps Engineer (part-time)
- Supabase Pro plan (for production)
