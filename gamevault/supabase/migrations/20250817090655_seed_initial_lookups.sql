-- migration: seed essential lookups (platforms, genres, regions)
-- purpose: provide baseline controlled vocabularies referenced throughout the app
-- considerations: idempotent inserts using on conflict do nothing

-- platforms
insert into public.lookups (type, canonical_name, slug, sort_order)
values
  ('platform', 'pc', 'pc', 1),
  ('platform', 'playstation 5', 'playstation-5', 2),
  ('platform', 'xbox series x/s', 'xbox-series-x-s', 3),
  ('platform', 'nintendo switch', 'nintendo-switch', 4),
  ('platform', 'playstation 4', 'playstation-4', 5),
  ('platform', 'xbox one', 'xbox-one', 6)
on conflict (type, slug) do nothing;

-- genres
insert into public.lookups (type, canonical_name, slug, sort_order)
values
  ('genre', 'action', 'action', 1),
  ('genre', 'adventure', 'adventure', 2),
  ('genre', 'rpg', 'rpg', 3),
  ('genre', 'strategy', 'strategy', 4),
  ('genre', 'simulation', 'simulation', 5),
  ('genre', 'sports', 'sports', 6),
  ('genre', 'racing', 'racing', 7),
  ('genre', 'puzzle', 'puzzle', 8)
on conflict (type, slug) do nothing;

-- regions
insert into public.lookups (type, canonical_name, slug, sort_order)
values
  ('region', 'north america', 'north-america', 1),
  ('region', 'europe', 'europe', 2),
  ('region', 'japan', 'japan', 3),
  ('region', 'global', 'global', 4)
on conflict (type, slug) do nothing;


