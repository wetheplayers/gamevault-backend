# Row Level Security (RLS) Policies Documentation

## Overview
This document defines all Row Level Security policies for the GameVault database, ensuring proper access control based on user roles.

## Role Hierarchy
1. **Superadmin**: Full system access, can manage all data and users
2. **Admin**: Full CRUD on game data, user management (except superadmins)
3. **Moderator**: Read all, update game data, handle moderation queue
4. **User**: Read-only access to published content

## RLS Policy Implementation

### 1. User Profiles Table

```sql
-- Enable RLS
alter table public.user_profiles enable row level security;

-- Superadmin: full access
create policy "user_profiles_superadmin_all" on public.user_profiles
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'superadmin'
    )
  );

-- Admin: can manage non-superadmin users
create policy "user_profiles_admin_select" on public.user_profiles
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "user_profiles_admin_update" on public.user_profiles
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (role != 'superadmin');

-- Users can view and update their own profile
create policy "user_profiles_own_select" on public.user_profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy "user_profiles_own_update" on public.user_profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid() and 
    role = (select role from public.user_profiles where id = auth.uid())
  );
```

### 2. Games Table

```sql
-- Enable RLS
alter table public.games enable row level security;

-- Superadmin: full access
create policy "games_superadmin_all" on public.games
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'superadmin'
    )
  );

-- Admin: full CRUD
create policy "games_admin_all" on public.games
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Moderator: read all, update non-deleted
create policy "games_moderator_select" on public.games
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'moderator'
    )
  );

create policy "games_moderator_update" on public.games
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'moderator'
    ) and deleted_at is null
  );

-- Authenticated users: read published games
create policy "games_authenticated_select" on public.games
  for select
  to authenticated
  using (
    status in ('released', 'cancelled', 'delisted') and 
    deleted_at is null
  );

-- Anonymous users: read published games only
create policy "games_anon_select" on public.games
  for select
  to anon
  using (
    status = 'released' and 
    deleted_at is null
  );
```

### 3. Editions Table

```sql
-- Enable RLS
alter table public.editions enable row level security;

-- Superadmin: full access
create policy "editions_superadmin_all" on public.editions
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'superadmin'
    )
  );

-- Admin: full CRUD
create policy "editions_admin_all" on public.editions
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Moderator: read and update
create policy "editions_moderator_select" on public.editions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'moderator'
    )
  );

create policy "editions_moderator_update" on public.editions
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'moderator'
    ) and deleted_at is null
  );

-- Users: read editions of published games
create policy "editions_user_select" on public.editions
  for select
  to authenticated
  using (
    deleted_at is null and
    exists (
      select 1 from public.games
      where id = editions.game_id
      and status in ('released', 'cancelled', 'delisted')
      and deleted_at is null
    )
  );

-- Anonymous: read editions of released games only
create policy "editions_anon_select" on public.editions
  for select
  to anon
  using (
    deleted_at is null and
    exists (
      select 1 from public.games
      where id = editions.game_id
      and status = 'released'
      and deleted_at is null
    )
  );
```

### 4. Releases Table

```sql
-- Enable RLS
alter table public.releases enable row level security;

-- Similar pattern for releases
create policy "releases_superadmin_all" on public.releases
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'superadmin'
    )
  );

create policy "releases_admin_all" on public.releases
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "releases_moderator_select" on public.releases
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'moderator'
    )
  );

create policy "releases_moderator_update" on public.releases
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'moderator'
    ) and deleted_at is null
  );

-- Users see releases for accessible editions
create policy "releases_user_select" on public.releases
  for select
  to authenticated
  using (
    deleted_at is null and
    exists (
      select 1 from public.editions e
      join public.games g on e.game_id = g.id
      where e.id = releases.edition_id
      and g.status in ('released', 'cancelled', 'delisted')
      and g.deleted_at is null
      and e.deleted_at is null
    )
  );
```

### 5. Lookups Table

```sql
-- Enable RLS
alter table public.lookups enable row level security;

-- Everyone can read active lookups
create policy "lookups_select_all" on public.lookups
  for select
  to authenticated, anon
  using (is_active = true and deleted_at is null);

-- Superadmin: full access
create policy "lookups_superadmin_all" on public.lookups
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'superadmin'
    )
  );

-- Admin: can create and update lookups
create policy "lookups_admin_insert" on public.lookups
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "lookups_admin_update" on public.lookups
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Moderator: can suggest new lookups via change requests
-- (No direct insert/update on lookups table)
```

### 6. Media Table

```sql
-- Enable RLS
alter table public.media enable row level security;

-- Superadmin & Admin: full access
create policy "media_superadmin_all" on public.media
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role in ('superadmin', 'admin')
    )
  );

-- Moderator: can add and update media
create policy "media_moderator_insert" on public.media
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'moderator'
    )
  );

create policy "media_moderator_update" on public.media
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'moderator'
    ) and deleted_at is null
  );

-- Everyone can view non-NSFW media for accessible content
create policy "media_public_select" on public.media
  for select
  to authenticated, anon
  using (
    deleted_at is null and
    is_nsfw = false and
    case entity_type
      when 'game' then exists (
        select 1 from public.games
        where id = media.entity_id::uuid
        and status = 'released'
        and deleted_at is null
      )
      when 'edition' then exists (
        select 1 from public.editions e
        join public.games g on e.game_id = g.id
        where e.id = media.entity_id::uuid
        and g.status = 'released'
        and g.deleted_at is null
        and e.deleted_at is null
      )
      when 'release' then exists (
        select 1 from public.releases r
        join public.editions e on r.edition_id = e.id
        join public.games g on e.game_id = g.id
        where r.id = media.entity_id::uuid
        and g.status = 'released'
        and g.deleted_at is null
        and e.deleted_at is null
        and r.deleted_at is null
      )
      else false
    end
  );
```

### 7. Audit Logs Table

```sql
-- Enable RLS
alter table public.audit_logs enable row level security;

-- Superadmin: read all audit logs
create policy "audit_logs_superadmin_select" on public.audit_logs
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'superadmin'
    )
  );

-- Admin: read audit logs
create policy "audit_logs_admin_select" on public.audit_logs
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Users: read their own audit logs
create policy "audit_logs_own_select" on public.audit_logs
  for select
  to authenticated
  using (user_id = auth.uid());

-- System: allow inserts (via triggers/functions)
create policy "audit_logs_system_insert" on public.audit_logs
  for insert
  to authenticated
  with check (true);
```

### 8. Moderation Queue Table

```sql
-- Enable RLS
alter table public.moderation_queue enable row level security;

-- Superadmin & Admin: full access
create policy "moderation_queue_admin_all" on public.moderation_queue
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role in ('superadmin', 'admin')
    )
  );

-- Moderator: read all, update assigned items
create policy "moderation_queue_moderator_select" on public.moderation_queue
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'moderator'
    )
  );

create policy "moderation_queue_moderator_update" on public.moderation_queue
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'moderator'
    ) and (assigned_to = auth.uid() or assigned_to is null)
  );

-- Users: can create reports
create policy "moderation_queue_user_insert" on public.moderation_queue
  for insert
  to authenticated
  with check (
    reported_by = auth.uid()
  );

-- Users: can view their own reports
create policy "moderation_queue_user_select_own" on public.moderation_queue
  for select
  to authenticated
  using (reported_by = auth.uid());
```

### 9. Change Requests Table

```sql
-- Enable RLS
alter table public.change_requests enable row level security;

-- Superadmin & Admin: full access
create policy "change_requests_admin_all" on public.change_requests
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role in ('superadmin', 'admin')
    )
  );

-- Moderator: can create and view all
create policy "change_requests_moderator_insert" on public.change_requests
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'moderator'
    ) and submitted_by = auth.uid()
  );

create policy "change_requests_moderator_select" on public.change_requests
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'moderator'
    )
  );

-- Users: can submit and view their own
create policy "change_requests_user_insert" on public.change_requests
  for insert
  to authenticated
  with check (submitted_by = auth.uid());

create policy "change_requests_user_select_own" on public.change_requests
  for select
  to authenticated
  using (submitted_by = auth.uid());
```

## Storage Policies

```sql
-- Covers bucket: admins and moderators can upload
create policy "covers_upload" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'covers' and
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role in ('superadmin', 'admin', 'moderator')
    )
  );

-- Everyone can view covers
create policy "covers_select" on storage.objects
  for select
  to authenticated, anon
  using (bucket_id = 'covers');

-- Screenshots bucket: similar policies
create policy "screenshots_upload" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'screenshots' and
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role in ('superadmin', 'admin', 'moderator')
    )
  );

create policy "screenshots_select" on storage.objects
  for select
  to authenticated, anon
  using (bucket_id = 'screenshots');

-- Avatar bucket: users can upload their own
create policy "avatars_upload_own" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_select" on storage.objects
  for select
  to authenticated, anon
  using (bucket_id = 'avatars');
```

## Performance Optimisation

### Indexes for RLS Performance

```sql
-- Index for role checks (most common RLS pattern)
create index idx_user_profiles_id_role on public.user_profiles(id, role);

-- Index for game status checks
create index idx_games_status_deleted on public.games(status, deleted_at);

-- Index for entity relationships
create index idx_editions_game_id on public.editions(game_id) where deleted_at is null;
create index idx_releases_edition_id on public.releases(edition_id) where deleted_at is null;

-- Index for media entity lookups
create index idx_media_entity_type_id on public.media(entity_type, entity_id) where deleted_at is null;
```

### Helper Functions for RLS

```sql
-- Check user role (cached per statement)
create or replace function public.get_user_role()
returns user_role
language sql
security invoker
stable
set search_path = ''
as $$
  select role from public.user_profiles where id = auth.uid();
$$;

-- Check if user has permission
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

-- Optimised RLS policies using helper functions
create policy "games_optimised_select" on public.games
  for select
  to authenticated
  using (
    case (select public.get_user_role())
      when 'superadmin' then true
      when 'admin' then true
      when 'moderator' then true
      when 'user' then status in ('released', 'cancelled', 'delisted') and deleted_at is null
      else false
    end
  );
```

## Testing RLS Policies

```sql
-- Test as different roles
-- Set role to test
set role authenticated;
set request.jwt.claims to '{"sub": "user-uuid-here"}';

-- Test queries
select * from public.games; -- Should only see published games for regular users

-- Reset role
reset role;
```

## Monitoring & Debugging

```sql
-- View current RLS policies
select 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- Check if RLS is enabled on tables
select 
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```
