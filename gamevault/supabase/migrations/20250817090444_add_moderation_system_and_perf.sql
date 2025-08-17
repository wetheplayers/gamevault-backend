-- migration: moderation system, language & system requirements, versioning, and performance objects
-- purpose: adds moderation_queue & policies, release_languages, system_requirements, entity_versions, and game statistics MV + refresh function; adds helpful indexes
-- considerations: policies follow least privilege with separate rules for each operation; function uses security definer only where necessary

-- =====================================================================================
-- release_languages
-- =====================================================================================
create table if not exists public.release_languages (
  id uuid default gen_random_uuid() primary key,
  release_id uuid references public.releases(id) on delete cascade,
  language_id uuid references public.lookups(id),
  has_interface boolean default false,
  has_audio boolean default false,
  has_subtitles boolean default false,
  created_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  unique(release_id, language_id)
);

comment on table public.release_languages is 'Language support flags per release.';

alter table public.release_languages enable row level security;

create index if not exists idx_release_languages_release_id on public.release_languages(release_id);

drop policy if exists "release_languages public select" on public.release_languages;
create policy "release_languages public select"
  on public.release_languages
  for select
  to authenticated, anon
  using (
    exists (
      select 1 from public.releases r
      join public.editions e on e.id = r.edition_id
      join public.games g on g.id = e.game_id
      where r.id = public.release_languages.release_id
      and g.deleted_at is null and e.deleted_at is null and r.deleted_at is null
    )
  );

drop policy if exists "release_languages mod insert" on public.release_languages;
create policy "release_languages mod insert"
  on public.release_languages
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  );

drop policy if exists "release_languages mod update" on public.release_languages;
create policy "release_languages mod update"
  on public.release_languages
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

drop policy if exists "release_languages admin delete" on public.release_languages;
create policy "release_languages admin delete"
  on public.release_languages
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles where id = (select auth.uid()) and role in ('admin','superadmin')
    )
  );

-- =====================================================================================
-- system_requirements (pc)
-- =====================================================================================
create table if not exists public.system_requirements (
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
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  unique(release_id, requirement_type)
);

comment on table public.system_requirements is 'PC system requirements per release and requirement type.';

alter table public.system_requirements enable row level security;

create index if not exists idx_sysreq_release_id on public.system_requirements(release_id);

drop trigger if exists update_system_requirements_updated_at on public.system_requirements;
create trigger update_system_requirements_updated_at
  before update on public.system_requirements
  for each row execute function public.update_updated_at();

drop policy if exists "system_requirements public select" on public.system_requirements;
create policy "system_requirements public select"
  on public.system_requirements
  for select
  to authenticated, anon
  using (
    exists (
      select 1 from public.releases r
      join public.editions e on e.id = r.edition_id
      join public.games g on g.id = e.game_id
      where r.id = public.system_requirements.release_id
      and g.deleted_at is null and e.deleted_at is null and r.deleted_at is null
    )
  );

drop policy if exists "system_requirements mod insert" on public.system_requirements;
create policy "system_requirements mod insert"
  on public.system_requirements
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  );

drop policy if exists "system_requirements mod update" on public.system_requirements;
create policy "system_requirements mod update"
  on public.system_requirements
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  )
  with check (
    exists (
      select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  );

-- =====================================================================================
-- moderation_queue
-- =====================================================================================
create table if not exists public.moderation_queue (
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

comment on table public.moderation_queue is 'Reports and moderation workflow items for content review.';

alter table public.moderation_queue enable row level security;

drop policy if exists "mq admin all" on public.moderation_queue;
create policy "mq admin all"
  on public.moderation_queue
  for select
  to authenticated
  using (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('admin','superadmin')));

create policy "mq admin all insert"
  on public.moderation_queue
  for insert
  to authenticated
  with check (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('admin','superadmin')));

create policy "mq admin all update"
  on public.moderation_queue
  for update
  to authenticated
  using (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('admin','superadmin')))
  with check (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('admin','superadmin')));

create policy "mq admin all delete"
  on public.moderation_queue
  for delete
  to authenticated
  using (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('admin','superadmin')));

drop policy if exists "mq moderator select" on public.moderation_queue;
create policy "mq moderator select"
  on public.moderation_queue
  for select
  to authenticated
  using (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role = 'moderator'));

drop policy if exists "mq moderator update assigned" on public.moderation_queue;
create policy "mq moderator update assigned"
  on public.moderation_queue
  for update
  to authenticated
  using (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role = 'moderator') and ((select auth.uid()) = assigned_to or assigned_to is null))
  with check (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role = 'moderator'));

drop policy if exists "mq user insert own" on public.moderation_queue;
create policy "mq user insert own"
  on public.moderation_queue
  for insert
  to authenticated
  with check ((select auth.uid()) = reported_by);

drop policy if exists "mq user select own" on public.moderation_queue;
create policy "mq user select own"
  on public.moderation_queue
  for select
  to authenticated
  using ((select auth.uid()) = reported_by);

-- =====================================================================================
-- entity_versions (version history)
-- =====================================================================================
create table if not exists public.entity_versions (
  id uuid default gen_random_uuid() primary key,
  entity_type varchar(50) not null,
  entity_id uuid not null,
  version_number integer not null,
  changes jsonb not null,
  changed_by uuid references auth.users(id),
  change_reason text,
  created_at timestamptz default now() not null
);

comment on table public.entity_versions is 'Version history of major entities with change payloads.';

alter table public.entity_versions enable row level security;

create unique index if not exists idx_entity_versions_unique on public.entity_versions(entity_type, entity_id, version_number);

drop policy if exists "entity_versions admin select" on public.entity_versions;
create policy "entity_versions admin select"
  on public.entity_versions
  for select
  to authenticated
  using (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('admin','superadmin')));

drop policy if exists "entity_versions admin insert" on public.entity_versions;
create policy "entity_versions admin insert"
  on public.entity_versions
  for insert
  to authenticated
  with check (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('admin','superadmin')));

-- =====================================================================================
-- materialized view: game_statistics and refresh function
-- =====================================================================================
drop materialized view if exists public.game_statistics;
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

create unique index if not exists idx_game_statistics_id on public.game_statistics(id);

create or replace function public.refresh_game_statistics()
returns void
language sql
security definer
set search_path = ''
as $$
  refresh materialized view concurrently public.game_statistics;
$$;

comment on function public.refresh_game_statistics() is 'Refreshes the materialized view public.game_statistics.';

-- =====================================================================================
-- performance & rls helper indexes
-- =====================================================================================
create index if not exists idx_user_profiles_id_role on public.user_profiles(id, role);


