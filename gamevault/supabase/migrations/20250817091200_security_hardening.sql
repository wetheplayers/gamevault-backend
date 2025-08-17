-- migration: security hardening & performance indexes
-- scope: adjust MV access, RLS initplan, and add covering indexes for FK advisories

-- ============================================================================
-- lock down materialized views (prevent anon/auth direct selection if undesired)
-- Note: keep accessible via RPC or server
-- ============================================================================
revoke select on table public.game_statistics from anon;
revoke select on table public.game_statistics from authenticated;

-- ============================================================================
-- RLS initplan optimization: replace auth.uid() calls with (select auth.uid())
-- Updating existing policies where flagged by advisor
-- ============================================================================
drop policy if exists "Users can view their own profile" on public.user_profiles;
create policy "Users can view their own profile" on public.user_profiles
  for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "Users can update their own profile" on public.user_profiles;
create policy "Users can update their own profile" on public.user_profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = (select role from public.user_profiles where id = (select auth.uid())));

drop policy if exists "Admins can view all profiles" on public.user_profiles;
create policy "Admins can view all profiles" on public.user_profiles
  for select to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('superadmin', 'admin')
    )
  );

drop policy if exists "Users can view their own audit logs" on public.audit_logs;
create policy "Users can view their own audit logs" on public.audit_logs
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Admins can view all audit logs" on public.audit_logs;
create policy "Admins can view all audit logs" on public.audit_logs
  for select to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = (select auth.uid()) and role in ('superadmin', 'admin')
    )
  );

-- ============================================================================
-- covering indexes for FK columns flagged by advisor (minimal subset most critical)
-- ============================================================================
create index if not exists idx_age_ratings_game_id on public.age_ratings(game_id);
create index if not exists idx_age_ratings_board_id on public.age_ratings(board_id);
create index if not exists idx_age_ratings_rating_category_id on public.age_ratings(rating_category_id);
create index if not exists idx_age_ratings_region_id on public.age_ratings(region_id);

create index if not exists idx_change_requests_submitted_by on public.change_requests(submitted_by);
create index if not exists idx_change_requests_reviewed_by on public.change_requests(reviewed_by);

create index if not exists idx_companies_created_by on public.companies(created_by);
create index if not exists idx_companies_updated_by on public.companies(updated_by);
create index if not exists idx_companies_deleted_by on public.companies(deleted_by);

create index if not exists idx_credits_credit_role_id on public.credits(credit_role_id);
create index if not exists idx_credits_department_id on public.credits(department_id);
create index if not exists idx_credits_created_by on public.credits(created_by);

create index if not exists idx_editions_release_type_id on public.editions(release_type_id);
create index if not exists idx_editions_created_by on public.editions(created_by);
create index if not exists idx_editions_updated_by on public.editions(updated_by);
create index if not exists idx_editions_deleted_by on public.editions(deleted_by);

create index if not exists idx_entity_versions_changed_by on public.entity_versions(changed_by);

create index if not exists idx_external_ids_source_id on public.external_ids(source_id);
create index if not exists idx_external_ids_region_id on public.external_ids(region_id);
create index if not exists idx_external_ids_created_by on public.external_ids(created_by);

create index if not exists idx_game_aliases_region_id on public.game_aliases(region_id);
create index if not exists idx_game_aliases_created_by on public.game_aliases(created_by);

create index if not exists idx_game_localisations_created_by on public.game_localisations(created_by);

create index if not exists idx_games_franchise_id on public.games(franchise_id);
create index if not exists idx_games_primary_genre_id on public.games(primary_genre_id);
create index if not exists idx_games_monetisation_model_id on public.games(monetisation_model_id);
create index if not exists idx_games_engine_id on public.games(engine_id);
create index if not exists idx_games_created_by on public.games(created_by);
create index if not exists idx_games_updated_by on public.games(updated_by);
create index if not exists idx_games_deleted_by on public.games(deleted_by);

create index if not exists idx_lookup_aliases_created_by on public.lookup_aliases(created_by);
create index if not exists idx_lookups_created_by on public.lookups(created_by);
create index if not exists idx_lookups_updated_by on public.lookups(updated_by);
create index if not exists idx_lookups_deleted_by on public.lookups(deleted_by);

create index if not exists idx_media_media_type_id on public.media(media_type_id);
create index if not exists idx_media_language_id on public.media(language_id);
create index if not exists idx_media_created_by on public.media(created_by);
create index if not exists idx_media_updated_by on public.media(updated_by);
create index if not exists idx_media_deleted_by on public.media(deleted_by);

create index if not exists idx_moderation_queue_reported_by on public.moderation_queue(reported_by);
create index if not exists idx_moderation_queue_assigned_to on public.moderation_queue(assigned_to);
create index if not exists idx_moderation_queue_resolved_by on public.moderation_queue(resolved_by);

create index if not exists idx_people_country_id on public.people(country_id);
create index if not exists idx_people_created_by on public.people(created_by);
create index if not exists idx_people_updated_by on public.people(updated_by);
create index if not exists idx_people_deleted_by on public.people(deleted_by);

create index if not exists idx_release_languages_language_id on public.release_languages(language_id);
create index if not exists idx_release_languages_created_by on public.release_languages(created_by);

create index if not exists idx_releases_region_id on public.releases(region_id);
create index if not exists idx_releases_platform_id on public.releases(platform_id);
create index if not exists idx_releases_distribution_format_id on public.releases(distribution_format_id);
create index if not exists idx_releases_drm_tech_id on public.releases(drm_tech_id);
create index if not exists idx_releases_storefront_id on public.releases(storefront_id);
create index if not exists idx_releases_created_by on public.releases(created_by);
create index if not exists idx_releases_updated_by on public.releases(updated_by);
create index if not exists idx_releases_deleted_by on public.releases(deleted_by);

create index if not exists idx_system_requirements_os_id on public.system_requirements(os_id);
create index if not exists idx_system_requirements_directx_api_id on public.system_requirements(directx_api_id);
create index if not exists idx_system_requirements_created_by on public.system_requirements(created_by);
create index if not exists idx_system_requirements_updated_by on public.system_requirements(updated_by);

create index if not exists idx_technical_specs_vr_platform_id on public.technical_specs(vr_platform_id);
create index if not exists idx_technical_specs_cloud_provider_id on public.technical_specs(cloud_provider_id);
create index if not exists idx_technical_specs_anti_cheat_id on public.technical_specs(anti_cheat_id);
create index if not exists idx_technical_specs_created_by on public.technical_specs(created_by);
create index if not exists idx_technical_specs_updated_by on public.technical_specs(updated_by);


