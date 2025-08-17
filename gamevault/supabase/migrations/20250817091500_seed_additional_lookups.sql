-- migration: seed additional lookups for engines, monetisation models, themes, modes, release types, distribution formats, drm techs, storefronts, and age ratings
-- purpose: provide baseline controlled vocabularies for dropdowns used by the app
-- considerations: idempotent inserts using on conflict do nothing; safe to re-run

-- engines
insert into public.lookups (type, canonical_name, slug, sort_order)
values
  ('engine', 'Unreal Engine', 'unreal-engine', 1),
  ('engine', 'Unity', 'unity', 2),
  ('engine', 'Godot', 'godot', 3),
  ('engine', 'Custom Engine', 'custom-engine', 10)
on conflict (type, slug) do nothing;

-- monetisation models
insert into public.lookups (type, canonical_name, slug, sort_order)
values
  ('monetisation_model', 'Premium (Paid)', 'premium-paid', 1),
  ('monetisation_model', 'Free-to-Play', 'free-to-play', 2),
  ('monetisation_model', 'Subscription', 'subscription', 3),
  ('monetisation_model', 'Paid + Microtransactions', 'paid-plus-mtx', 4)
on conflict (type, slug) do nothing;

-- themes
insert into public.lookups (type, canonical_name, slug, sort_order)
values
  ('theme', 'Sci-Fi', 'sci-fi', 1),
  ('theme', 'Fantasy', 'fantasy', 2),
  ('theme', 'Horror', 'horror', 3),
  ('theme', 'Mystery', 'mystery', 4),
  ('theme', 'Post-Apocalyptic', 'post-apocalyptic', 5),
  ('theme', 'Historical', 'historical', 6)
on conflict (type, slug) do nothing;

-- modes
insert into public.lookups (type, canonical_name, slug, sort_order)
values
  ('mode', 'Single-player', 'single-player', 1),
  ('mode', 'Multiplayer', 'multiplayer', 2),
  ('mode', 'Co-op', 'co-op', 3),
  ('mode', 'Massively Multiplayer', 'massively-multiplayer', 4),
  ('mode', 'Battle Royale', 'battle-royale', 5),
  ('mode', 'Split-screen', 'split-screen', 6)
on conflict (type, slug) do nothing;

-- release types
insert into public.lookups (type, canonical_name, slug, sort_order)
values
  ('release_type', 'Standard Edition', 'standard-edition', 1),
  ('release_type', 'Deluxe Edition', 'deluxe-edition', 2),
  ('release_type', 'Collector''s Edition', 'collectors-edition', 3),
  ('release_type', 'Complete Edition', 'complete-edition', 4),
  ('release_type', 'Game of the Year Edition', 'goty-edition', 5)
on conflict (type, slug) do nothing;

-- distribution formats
insert into public.lookups (type, canonical_name, slug, sort_order)
values
  ('distribution_format', 'Digital Download', 'digital-download', 1),
  ('distribution_format', 'Physical Disc', 'physical-disc', 2),
  ('distribution_format', 'Physical Cartridge', 'physical-cartridge', 3),
  ('distribution_format', 'Cloud Streaming', 'cloud-streaming', 4)
on conflict (type, slug) do nothing;

-- drm technologies
insert into public.lookups (type, canonical_name, slug, sort_order)
values
  ('drm_tech', 'None', 'none', 1),
  ('drm_tech', 'Denuvo', 'denuvo', 2),
  ('drm_tech', 'Steam DRM', 'steam-drm', 3)
on conflict (type, slug) do nothing;

-- storefronts
insert into public.lookups (type, canonical_name, slug, sort_order)
values
  ('storefront', 'Steam', 'steam', 1),
  ('storefront', 'Epic Games Store', 'epic-games-store', 2),
  ('storefront', 'PlayStation Store', 'playstation-store', 3),
  ('storefront', 'Xbox Store', 'xbox-store', 4),
  ('storefront', 'Nintendo eShop', 'nintendo-eshop', 5),
  ('storefront', 'GOG', 'gog', 6)
on conflict (type, slug) do nothing;

-- age rating boards
insert into public.lookups (type, canonical_name, slug, sort_order)
values
  ('age_rating_board', 'ESRB', 'esrb', 1),
  ('age_rating_board', 'PEGI', 'pegi', 2),
  ('age_rating_board', 'CERO', 'cero', 3)
on conflict (type, slug) do nothing;

-- age rating categories (prefixed for clarity)
insert into public.lookups (type, canonical_name, slug, sort_order)
values
  -- esrb
  ('age_rating_category', 'ESRB E', 'esrb-e', 10),
  ('age_rating_category', 'ESRB E10+', 'esrb-e10-plus', 11),
  ('age_rating_category', 'ESRB T', 'esrb-t', 12),
  ('age_rating_category', 'ESRB M', 'esrb-m', 13),
  ('age_rating_category', 'ESRB AO', 'esrb-ao', 14),
  -- pegi
  ('age_rating_category', 'PEGI 3', 'pegi-3', 20),
  ('age_rating_category', 'PEGI 7', 'pegi-7', 21),
  ('age_rating_category', 'PEGI 12', 'pegi-12', 22),
  ('age_rating_category', 'PEGI 16', 'pegi-16', 23),
  ('age_rating_category', 'PEGI 18', 'pegi-18', 24),
  -- cero
  ('age_rating_category', 'CERO A', 'cero-a', 30),
  ('age_rating_category', 'CERO B', 'cero-b', 31),
  ('age_rating_category', 'CERO C', 'cero-c', 32),
  ('age_rating_category', 'CERO D', 'cero-d', 33),
  ('age_rating_category', 'CERO Z', 'cero-z', 34)
on conflict (type, slug) do nothing;


