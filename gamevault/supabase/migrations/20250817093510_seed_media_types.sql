-- migration: seed media types for media table
-- purpose: provide lookup values for cover, screenshots, trailers, logos, artwork
-- considerations: idempotent inserts using on conflict do nothing

insert into public.lookups (type, canonical_name, slug, sort_order, is_active)
values
  ('media_type', 'Cover', 'cover', 1, true),
  ('media_type', 'Screenshot', 'screenshot', 2, true),
  ('media_type', 'Trailer', 'trailer', 3, true),
  ('media_type', 'Logo', 'logo', 4, true),
  ('media_type', 'Artwork', 'artwork', 5, true)
on conflict (type, slug) do nothing;


