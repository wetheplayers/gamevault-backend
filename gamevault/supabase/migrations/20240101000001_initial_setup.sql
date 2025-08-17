-- Migration: Initial GameVault Database Setup
-- Purpose: Create foundational tables for user management, audit system, and core infrastructure
-- Dependencies: Supabase Auth
-- Author: GameVault Team
-- Date: 2024-01-01

-- ============================================================================
-- ENUMERATIONS
-- ============================================================================

-- User role enumeration
create type user_role as enum ('superadmin', 'admin', 'moderator', 'user');

-- Game status enumeration
create type game_status as enum ('announced', 'in_development', 'released', 'cancelled', 'delisted');

-- Media source enumeration
create type media_source as enum ('uploaded_file', 'external_url', 'embedded');

-- ============================================================================
-- USER MANAGEMENT
-- ============================================================================

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

-- Enable RLS on user_profiles
alter table public.user_profiles enable row level security;

-- RLS Policies for user_profiles
create policy "Users can view their own profile" on public.user_profiles
  for select to authenticated
  using (id = auth.uid());

create policy "Users can update their own profile" on public.user_profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.user_profiles where id = auth.uid()));

create policy "Admins can view all profiles" on public.user_profiles
  for select to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role in ('superadmin', 'admin')
    )
  );

-- ============================================================================
-- PERMISSIONS SYSTEM
-- ============================================================================

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

-- Enable RLS on permissions
alter table public.permissions enable row level security;

-- RLS Policy for permissions (read-only for authenticated users)
create policy "Authenticated users can read permissions" on public.permissions
  for select to authenticated
  using (true);

-- Seed initial permissions
insert into public.permissions (resource, action, role) values
  -- Superadmin has all permissions
  ('*', '*', 'superadmin'),
  
  -- Admin permissions
  ('games', 'create', 'admin'),
  ('games', 'read', 'admin'),
  ('games', 'update', 'admin'),
  ('games', 'delete', 'admin'),
  ('users', 'read', 'admin'),
  ('users', 'update', 'admin'),
  ('reports', 'read', 'admin'),
  ('reports', 'create', 'admin'),
  
  -- Moderator permissions
  ('games', 'read', 'moderator'),
  ('games', 'update', 'moderator'),
  ('moderation', 'read', 'moderator'),
  ('moderation', 'update', 'moderator'),
  
  -- User permissions
  ('games', 'read', 'user'),
  ('changes', 'create', 'user'),
  ('changes', 'read', 'user');

-- ============================================================================
-- AUDIT SYSTEM
-- ============================================================================

-- Audit logs table
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

-- Enable RLS on audit_logs
alter table public.audit_logs enable row level security;

-- RLS Policies for audit_logs
create policy "Users can view their own audit logs" on public.audit_logs
  for select to authenticated
  using (user_id = auth.uid());

create policy "Admins can view all audit logs" on public.audit_logs
  for select to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role in ('superadmin', 'admin')
    )
  );

create policy "System can insert audit logs" on public.audit_logs
  for insert to authenticated
  with check (true);

-- Create indexes for audit_logs
create index idx_audit_logs_user_id on public.audit_logs(user_id);
create index idx_audit_logs_table_record on public.audit_logs(table_name, record_id);
create index idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

-- Function to create audit log entries
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

-- Function to handle new user signup
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
    coalesce(new.raw_user_meta_data->>'username', new.email),
    new.raw_user_meta_data->>'display_name'
  );
  return new;
end;
$$;

-- Function to get current user role
create or replace function public.get_user_role()
returns user_role
language sql
security invoker
stable
set search_path = ''
as $$
  select role from public.user_profiles where id = auth.uid();
$$;

-- Function to check if user has permission
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
  )
  or exists (
    select 1 from public.permissions
    where resource = '*'
    and action = '*'
    and role = (select public.get_user_role())
  );
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger to update updated_at on user_profiles
create trigger update_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.update_updated_at();

-- Trigger to audit user_profiles changes
create trigger audit_user_profiles
  after insert or update or delete on public.user_profiles
  for each row execute function public.create_audit_log();

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Create storage buckets for media
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('covers', 'covers', true),
  ('screenshots', 'screenshots', true),
  ('trailers', 'trailers', true),
  ('logos', 'logos', true)
on conflict (id) do nothing;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Avatar bucket policies
create policy "Users can upload their own avatar" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Anyone can view avatars" on storage.objects
  for select to public
  using (bucket_id = 'avatars');

-- Game media bucket policies (covers, screenshots, etc.)
create policy "Moderators can upload game media" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('covers', 'screenshots', 'trailers', 'logos') and
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role in ('superadmin', 'admin', 'moderator')
    )
  );

create policy "Anyone can view game media" on storage.objects
  for select to public
  using (bucket_id in ('covers', 'screenshots', 'trailers', 'logos'));

-- ============================================================================
-- COMMENTS
-- ============================================================================

comment on table public.user_profiles is 'Extended user profiles with roles and preferences';
comment on table public.permissions is 'Role-based access control permissions matrix';
comment on table public.audit_logs is 'Audit trail for all database changes';
comment on function public.get_user_role() is 'Returns the current user role for RLS policies';
comment on function public.has_permission(text, text) is 'Checks if current user has specific permission';

-- ============================================================================
-- ROLLBACK SCRIPT (Save as separate file: 20240101000001_initial_setup_rollback.sql)
-- ============================================================================
-- drop trigger if exists on_auth_user_created on auth.users;
-- drop trigger if exists update_user_profiles_updated_at on public.user_profiles;
-- drop trigger if exists audit_user_profiles on public.user_profiles;
-- drop function if exists public.handle_new_user();
-- drop function if exists public.update_updated_at();
-- drop function if exists public.create_audit_log();
-- drop function if exists public.get_user_role();
-- drop function if exists public.has_permission(text, text);
-- drop table if exists public.audit_logs cascade;
-- drop table if exists public.permissions cascade;
-- drop table if exists public.user_profiles cascade;
-- drop type if exists user_role cascade;
-- drop type if exists game_status cascade;
-- drop type if exists media_source cascade;
-- delete from storage.buckets where id in ('avatars', 'covers', 'screenshots', 'trailers', 'logos');
