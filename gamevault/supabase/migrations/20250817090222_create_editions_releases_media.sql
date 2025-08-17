-- migration: create editions, releases, technical specs, media and related rls
-- purpose: adds sku-level entities, platform/region releases, technical specs, and media management with rls
-- considerations: rls everywhere, carefully scoped policies, performance indexes, audit/update triggers

-- =====================================================================================
-- editions
-- =====================================================================================
create table if not exists public.editions (
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
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);

comment on table public.editions is 'Game editions/SKUs with optional contents and merchandising fields.';

alter table public.editions enable row level security;

create index if not exists idx_editions_game_id on public.editions(game_id) where deleted_at is null;

drop trigger if exists update_editions_updated_at on public.editions;
create trigger update_editions_updated_at
  before update on public.editions
  for each row execute function public.update_updated_at();

drop trigger if exists audit_editions on public.editions;
create trigger audit_editions
  after insert or update or delete on public.editions
  for each row execute function public.create_audit_log();

drop policy if exists "editions anon select released" on public.editions;
create policy "editions anon select released"
  on public.editions
  for select
  to anon
  using (
    deleted_at is null and exists (
      select 1 from public.games g
      where g.id = public.editions.game_id and g.status = 'released' and g.deleted_at is null
    )
  );

drop policy if exists "editions auth select published" on public.editions;
create policy "editions auth select published"
  on public.editions
  for select
  to authenticated
  using (
    deleted_at is null and exists (
      select 1 from public.games g
      where g.id = public.editions.game_id and g.status in ('released','cancelled','delisted') and g.deleted_at is null
    )
  );

drop policy if exists "editions mod insert" on public.editions;
create policy "editions mod insert"
  on public.editions
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  );

drop policy if exists "editions mod update" on public.editions;
create policy "editions mod update"
  on public.editions
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

drop policy if exists "editions admin delete" on public.editions;
create policy "editions admin delete"
  on public.editions
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('admin','superadmin')
    )
  );

-- =====================================================================================
-- releases
-- =====================================================================================
create table if not exists public.releases (
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
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  constraint check_player_counts check (max_players_local >= min_players_local and max_players_online >= min_players_online)
);

comment on table public.releases is 'Platform and region-specific releases for each edition.';

alter table public.releases enable row level security;

create index if not exists idx_releases_edition_id on public.releases(edition_id) where deleted_at is null;
create index if not exists idx_releases_platform_id on public.releases(platform_id) where deleted_at is null;
create index if not exists idx_releases_release_date on public.releases(release_date);

drop trigger if exists update_releases_updated_at on public.releases;
create trigger update_releases_updated_at
  before update on public.releases
  for each row execute function public.update_updated_at();

drop trigger if exists audit_releases on public.releases;
create trigger audit_releases
  after insert or update or delete on public.releases
  for each row execute function public.create_audit_log();

drop policy if exists "releases anon select released" on public.releases;
create policy "releases anon select released"
  on public.releases
  for select
  to anon
  using (
    deleted_at is null and exists (
      select 1 from public.editions e
      join public.games g on g.id = e.game_id
      where e.id = public.releases.edition_id and g.status = 'released' and g.deleted_at is null and e.deleted_at is null
    )
  );

drop policy if exists "releases auth select published" on public.releases;
create policy "releases auth select published"
  on public.releases
  for select
  to authenticated
  using (
    deleted_at is null and exists (
      select 1 from public.editions e
      join public.games g on g.id = e.game_id
      where e.id = public.releases.edition_id and g.status in ('released','cancelled','delisted') and g.deleted_at is null and e.deleted_at is null
    )
  );

drop policy if exists "releases mod insert" on public.releases;
create policy "releases mod insert"
  on public.releases
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  );

drop policy if exists "releases mod update" on public.releases;
create policy "releases mod update"
  on public.releases
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

drop policy if exists "releases admin delete" on public.releases;
create policy "releases admin delete"
  on public.releases
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('admin','superadmin')
    )
  );

-- =====================================================================================
-- technical specs
-- =====================================================================================
create table if not exists public.technical_specs (
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
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id)
);

comment on table public.technical_specs is 'Per-release technical specifications and capabilities.';

alter table public.technical_specs enable row level security;

drop trigger if exists update_technical_specs_updated_at on public.technical_specs;
create trigger update_technical_specs_updated_at
  before update on public.technical_specs
  for each row execute function public.update_updated_at();

drop trigger if exists audit_technical_specs on public.technical_specs;
create trigger audit_technical_specs
  after insert or update or delete on public.technical_specs
  for each row execute function public.create_audit_log();

drop policy if exists "technical_specs auth select" on public.technical_specs;
create policy "technical_specs auth select"
  on public.technical_specs
  for select
  to authenticated, anon
  using (
    exists (
      select 1 from public.releases r
      join public.editions e on e.id = r.edition_id
      join public.games g on g.id = e.game_id
      where r.id = public.technical_specs.release_id
      and g.deleted_at is null and e.deleted_at is null and r.deleted_at is null
    )
  );

drop policy if exists "technical_specs mod upsert" on public.technical_specs;
create policy "technical_specs mod upsert"
  on public.technical_specs
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  );

drop policy if exists "technical_specs mod update" on public.technical_specs;
create policy "technical_specs mod update"
  on public.technical_specs
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

-- =====================================================================================
-- media (generic) - entity types: 'game','edition','release'
-- =====================================================================================
create table if not exists public.media (
  id uuid default gen_random_uuid() primary key,
  entity_type varchar(20) not null,
  entity_id uuid not null,
  media_type_id uuid references public.lookups(id) not null,
  title text,
  caption text,
  credit text,
  asset_source public.media_source not null,
  storage_bucket varchar(50),
  storage_path text,
  cdn_url text generated always as (
    case
      when storage_bucket is not null and storage_path is not null then 'https://[project].supabase.co/storage/v1/object/public/' || storage_bucket || '/' || storage_path
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
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);

comment on table public.media is 'Media assets linked to game entities with derived public cdn_url.';

alter table public.media enable row level security;

create index if not exists idx_media_entity on public.media(entity_type, entity_id) where deleted_at is null;
create index if not exists idx_media_type on public.media(media_type_id) where deleted_at is null;

drop trigger if exists update_media_updated_at on public.media;
create trigger update_media_updated_at
  before update on public.media
  for each row execute function public.update_updated_at();

drop trigger if exists audit_media on public.media;
create trigger audit_media
  after insert or update or delete on public.media
  for each row execute function public.create_audit_log();

drop policy if exists "media public select safe" on public.media;
create policy "media public select safe"
  on public.media
  for select
  to authenticated, anon
  using (
    deleted_at is null and is_nsfw = false and (
      case entity_type
        when 'game' then exists (
          select 1 from public.games g where g.id = media.entity_id and g.deleted_at is null
        )
        when 'edition' then exists (
          select 1 from public.editions e join public.games g on g.id = e.game_id
          where e.id = media.entity_id and e.deleted_at is null and g.deleted_at is null
        )
        when 'release' then exists (
          select 1 from public.releases r join public.editions e on e.id = r.edition_id join public.games g on g.id = e.game_id
          where r.id = media.entity_id and r.deleted_at is null and e.deleted_at is null and g.deleted_at is null
        )
        else false
      end
    )
  );

drop policy if exists "media mod insert" on public.media;
create policy "media mod insert"
  on public.media
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('moderator','admin','superadmin')
    )
  );

drop policy if exists "media mod update" on public.media;
create policy "media mod update"
  on public.media
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

drop policy if exists "media admin delete" on public.media;
create policy "media admin delete"
  on public.media
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('admin','superadmin')
    )
  );


