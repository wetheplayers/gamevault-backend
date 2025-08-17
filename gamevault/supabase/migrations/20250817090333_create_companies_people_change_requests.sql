-- migration: companies, people, credits, external ids, age ratings, change management
-- purpose: adds companies/people domain, credits, external ids & ratings, change requests workflow with rls
-- considerations: rls and least privilege, audit/update triggers, performance indexes

-- =====================================================================================
-- companies
-- =====================================================================================
create table if not exists public.companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  country_id uuid references public.lookups(id),
  founded_date date,
  website text,
  description text,
  is_defunct boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);

comment on table public.companies is 'Companies involved in game development and publishing.';

alter table public.companies enable row level security;

create index if not exists idx_companies_country on public.companies(country_id) where deleted_at is null;

drop trigger if exists update_companies_updated_at on public.companies;
create trigger update_companies_updated_at
  before update on public.companies
  for each row execute function public.update_updated_at();

drop trigger if exists audit_companies on public.companies;
create trigger audit_companies
  after insert or update or delete on public.companies
  for each row execute function public.create_audit_log();

drop policy if exists "companies public select" on public.companies;
create policy "companies public select"
  on public.companies
  for select
  to authenticated, anon
  using (deleted_at is null);

drop policy if exists "companies mod insert" on public.companies;
create policy "companies mod insert"
  on public.companies
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  );

drop policy if exists "companies mod update" on public.companies;
create policy "companies mod update"
  on public.companies
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    ) and deleted_at is null
  )
  with check (
    exists (
      select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    ) and deleted_at is null
  );

drop policy if exists "companies admin delete" on public.companies;
create policy "companies admin delete"
  on public.companies
  for delete
  to authenticated
  using (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('admin','superadmin')));

-- =====================================================================================
-- game_company_roles
-- =====================================================================================
create table if not exists public.game_company_roles (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  role_id uuid references public.lookups(id) not null,
  region_id uuid references public.lookups(id),
  notes text,
  created_at timestamptz default now() not null,
  created_by uuid references auth.users(id)
);

alter table public.game_company_roles enable row level security;
create index if not exists idx_gcr_game_id on public.game_company_roles(game_id);
create index if not exists idx_gcr_company_id on public.game_company_roles(company_id);

drop policy if exists "gcr public select" on public.game_company_roles;
create policy "gcr public select"
  on public.game_company_roles
  for select
  to authenticated, anon
  using (true);

drop policy if exists "gcr mod insert" on public.game_company_roles;
create policy "gcr mod insert"
  on public.game_company_roles
  for insert
  to authenticated
  with check (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')));

drop policy if exists "gcr mod update" on public.game_company_roles;
create policy "gcr mod update"
  on public.game_company_roles
  for update
  to authenticated
  using (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')))
  with check (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')));

drop policy if exists "gcr admin delete" on public.game_company_roles;
create policy "gcr admin delete"
  on public.game_company_roles
  for delete
  to authenticated
  using (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('admin','superadmin')));

-- =====================================================================================
-- people
-- =====================================================================================
create table if not exists public.people (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  country_id uuid references public.lookups(id),
  date_of_birth date,
  website text,
  bio text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);

comment on table public.people is 'People (developers, artists, etc.) with optional metadata.';

alter table public.people enable row level security;

drop trigger if exists update_people_updated_at on public.people;
create trigger update_people_updated_at
  before update on public.people
  for each row execute function public.update_updated_at();

drop trigger if exists audit_people on public.people;
create trigger audit_people
  after insert or update or delete on public.people
  for each row execute function public.create_audit_log();

drop policy if exists "people public select" on public.people;
create policy "people public select"
  on public.people
  for select
  to authenticated, anon
  using (deleted_at is null);

drop policy if exists "people mod insert" on public.people;
create policy "people mod insert"
  on public.people
  for insert
  to authenticated
  with check (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')));

drop policy if exists "people mod update" on public.people;
create policy "people mod update"
  on public.people
  for update
  to authenticated
  using (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')) and deleted_at is null)
  with check (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')) and deleted_at is null);

drop policy if exists "people admin delete" on public.people;
create policy "people admin delete"
  on public.people
  for delete
  to authenticated
  using (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('admin','superadmin')));

-- =====================================================================================
-- credits (people to games)
-- =====================================================================================
create table if not exists public.credits (
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

alter table public.credits enable row level security;
create index if not exists idx_credits_game_id on public.credits(game_id);
create index if not exists idx_credits_person_id on public.credits(person_id);

drop policy if exists "credits public select" on public.credits;
create policy "credits public select"
  on public.credits
  for select
  to authenticated, anon
  using (true);

drop policy if exists "credits mod insert" on public.credits;
create policy "credits mod insert"
  on public.credits
  for insert
  to authenticated
  with check (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')));

drop policy if exists "credits mod update" on public.credits;
create policy "credits mod update"
  on public.credits
  for update
  to authenticated
  using (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')))
  with check (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')));

drop policy if exists "credits admin delete" on public.credits;
create policy "credits admin delete"
  on public.credits
  for delete
  to authenticated
  using (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('admin','superadmin')));

-- =====================================================================================
-- external ids & age ratings
-- =====================================================================================
create table if not exists public.external_ids (
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

alter table public.external_ids enable row level security;
create index if not exists idx_external_ids_entity on public.external_ids(entity_type, entity_id);

drop policy if exists "external_ids public select" on public.external_ids;
create policy "external_ids public select"
  on public.external_ids
  for select
  to authenticated, anon
  using (true);

drop policy if exists "external_ids mod insert" on public.external_ids;
create policy "external_ids mod insert"
  on public.external_ids
  for insert
  to authenticated
  with check (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')));

drop policy if exists "external_ids mod update" on public.external_ids;
create policy "external_ids mod update"
  on public.external_ids
  for update
  to authenticated
  using (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')))
  with check (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')));

drop policy if exists "external_ids admin delete" on public.external_ids;
create policy "external_ids admin delete"
  on public.external_ids
  for delete
  to authenticated
  using (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('admin','superadmin')));

create table if not exists public.age_ratings (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.games(id) on delete cascade,
  board_id uuid references public.lookups(id) not null,
  rating_category_id uuid references public.lookups(id) not null,
  interactive_elements text,
  rating_date date,
  certificate_id varchar(100),
  region_id uuid references public.lookups(id),
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

alter table public.age_ratings enable row level security;

create table if not exists public.rating_descriptors (
  rating_id uuid references public.age_ratings(id) on delete cascade,
  descriptor_id uuid references public.lookups(id),
  primary key (rating_id, descriptor_id)
);

alter table public.rating_descriptors enable row level security;

drop policy if exists "age_ratings public select" on public.age_ratings;
create policy "age_ratings public select"
  on public.age_ratings
  for select
  to authenticated, anon
  using (true);

drop policy if exists "rating_descriptors public select" on public.rating_descriptors;
create policy "rating_descriptors public select"
  on public.rating_descriptors
  for select
  to authenticated, anon
  using (true);

drop policy if exists "age_ratings mod write" on public.age_ratings;
create policy "age_ratings mod write"
  on public.age_ratings
  for insert
  to authenticated
  with check (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')));

drop policy if exists "age_ratings mod update" on public.age_ratings;
create policy "age_ratings mod update"
  on public.age_ratings
  for update
  to authenticated
  using (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')))
  with check (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')));

-- =====================================================================================
-- change requests workflow
-- =====================================================================================
create table if not exists public.change_requests (
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

comment on table public.change_requests is 'Proposed content changes routed through moderation workflow.';

alter table public.change_requests enable row level security;

drop trigger if exists audit_change_requests on public.change_requests;
create trigger audit_change_requests
  after insert or update or delete on public.change_requests
  for each row execute function public.create_audit_log();

drop policy if exists "cr own insert" on public.change_requests;
create policy "cr own insert"
  on public.change_requests
  for insert
  to authenticated
  with check ((select auth.uid()) = submitted_by);

drop policy if exists "cr own select" on public.change_requests;
create policy "cr own select"
  on public.change_requests
  for select
  to authenticated
  using ((select auth.uid()) = submitted_by);

drop policy if exists "cr mod select all" on public.change_requests;
create policy "cr mod select all"
  on public.change_requests
  for select
  to authenticated
  using (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')));

drop policy if exists "cr mod update" on public.change_requests;
create policy "cr mod update"
  on public.change_requests
  for update
  to authenticated
  using (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')))
  with check (exists (select 1 from public.user_profiles where id = (select auth.uid()) and role in ('moderator','admin','superadmin')));


