# Video Game Database — LLM Integration Brief (v1)

**Audience:** Any LLM or agent assisting with ingestion, normalisation, validation, and authoring for our video game database.

**Tone & locale:** British English; ISO 8601 dates (YYYY-MM-DD); 24-hour times; SI units where practical.

---

## 1) Purpose & scope
This document tells the LLM exactly how to help us build and maintain a high‑quality video game database. It defines:
- What entities exist and how they relate.
- Which fields are controlled **lookups** vs **free‑text** vs other primitives.
- The rules for normalising text, matching to lookups, deduplicating, and proposing changes.
- The JSON I/O formats to use for outputs, including confidence scores and reasoning.

> **Important removals:** We do **not** model Middleware/Tech as a lookup (Wwise/FM0D/etc.). We also do **not** model Distributors or Porting Houses as separate roles. Media Types **are** a lookup, and each media item records whether it was uploaded or referenced by URL.

---

## 2) Data model overview
Each field is marked with: **[L] lookup**, **[F] free‑text**, **[N] numeric**, **[B] boolean**, **[D] date/datetime**, **[U] URL**, **[E] enum (small internal)**.

### 2.1 Controlled vocabularies (lookup tables)
All lookups have: `id`, `canonical_name`, `slug`, `description` [F], `parent_id` (optional), `created_at`, `updated_at`. Each has an **Aliases** child table: `alias`, `lookup_table`, `lookup_id`, `locale`, `source`.

- **Platforms [L]**
- **Genres [L]** (broad), **Subgenres [L]** (child of Genre)
- **Themes [L]**
- **Game Modes [L]**
- **Player Perspectives [L]**
- **Art Styles [L]**
- **Engines [L]** (keep; middlewares removed)
- **Companies [L]** (single table; roles joined below)
- **Credit Roles [L]**
- **Regions [L]**, **Languages [L]**
- **Age Rating Boards [L]**, **Rating Categories [L]**, **Content Descriptors [L]**
- **Accessibility Features [L]**
- **Monetisation Types [L]**
- **Release Types [L]**
- **Storefronts [L]**
- **Distribution Formats [L]** (Digital/Physical/Cartridge/Disc)
- **Input Methods [L]**
- **Online Features [L]**
- **Media Types [L]** (Cover, Logo, Key Art, Screenshot, Concept Art, Trailer, Gameplay Video, OST Track, Icon, Banner)
- **Cloud/Streaming Services [L]**
- **External ID Sources [L]** (Steam AppID, GOG, Epic, PlayStation NP/Concept ID, Xbox Product ID, IGDB, MobyGames, OpenCritic, Metacritic, Speedrun.com)

> Use **Aliases** to merge near‑duplicates (e.g., "Action Game" → "Action").

### 2.2 Core entities

#### Game (title‑level concept)
- `id`
- `canonical_title` [F]
- `sort_title` [F]
- `franchise_id` [L] (aka Series; optional)
- `series_position` [N] (optional)
- `synopsis_short` [F]
- `description_long` [F]
- `status` [E] — Announced | In Development | Released | Cancelled | Delisted
- `first_announced_date` [D]
- `first_release_date` [D] — earliest anywhere/any platform
- `primary_genre_id` [L]
- (M2M) `game_genres` [L]
- (M2M) `game_subgenres` [L]
- (M2M) `game_themes` [L]
- (M2M) `game_modes` [L]
- (M2M) `player_perspectives` [L]
- (M2M) `art_styles` [L]
- `monetisation_model_id` [L]
- `business_model_notes` [F]
- `engine_id` [L]
- `coop_supported` [B]
- `max_players_local` [N], `max_players_online` [N]
- `avg_length_main` [N], `avg_length_extra` [N], `avg_length_completionist` [N]
- `official_site` [U], `press_kit_url` [U]
- `age_ratings_summary` [F] (denormalised, optional)
- `cover_asset_id` [L]
- `is_vr_only` [B], `is_vr_supported` [B], `is_cloud_only` [B]
- `crossplay_supported` [B], `crosssave_supported` [B]
- `accessibility_summary` [F]
- `tech_notes` [F] (high‑level tech info; middlewares not modelled as lookup)
- `notes_internal` [F]

**Localised titles** (child): `game_id`, `locale`, `display_title` [F], `romanised_title` [F], `official` [B]

**Alternate titles / aliases** (child): `game_id`, `alias` [F], `region_id` [L], `source` [F]

#### Edition / SKU
- `id`, `game_id`
- `edition_name` [F] (e.g., Deluxe, Complete)
- `release_type_id` [L] (Remaster, Remake, Port, Collection…)
- `includes_base_game` [B]
- (M2M) `included_dlcs` → DLC entity [L]
- `bonus_content_description` [F]
- `physical_contents` [F]
- `digital_contents` [F]
- `sku_code` [F]
- `default_cover_asset_id` [L]
- `is_port` [B] (optional convenience flag)

#### Release (platform/region specific)
- `id`, `edition_id`, `platform_id` [L], `region_id` [L]
- `release_date` [D]
- `distribution_format_id` [L]
- `min_players_local` [N], `max_players_local` [N]
- `min_players_online` [N], `max_players_online` [N]
- `crosssave_available` [B]
- (M2M) `supported_languages` [L] with roles: Interface/Audio/Subtitles
- `install_size_gb` [N]
- `requires_online` [B]
- `drm_tech_name` [F]
- `storefront_id` [L], `store_product_id` [F], `store_url` [U]
- `delisted_date` [D], `delisted_reason` [F]
- (M2M) `release_publishers` via Companies/roles (role = Publisher; region optional)
- `patch_baseline_version` [F]
- `notes` [F] (use for porting mentions)

#### Companies & roles
**Companies**: `id`, `name` [F], `country` [F], `founded_date` [D], `website` [U], `description` [F], `is_defunct` [B]

**GameCompanyRole** (join): `game_id`, `company_id`, `role_id` [L], `region_id` [L] (optional), `notes` [F]

**Allowed roles**: Developer, Co‑Developer, **Publisher**, QA, Localisation, Marketing, Support Studio. *(No Distributor; no Porting House.)*

#### People & credits
**People**: `id`, `full_name` [F], `country` [F], `dob` [D], `website` [U], `bio` [F]

**Credits**: `game_id`, `person_id`, `credit_role_id` [L], `department_id` [L] (optional), `is_lead` [B], `order_index` [N], `notes` [F]

#### Ratings (age‑rating boards)
- `id`, `game_id`, `board_id` [L], `rating_category_id` [L]
- (M2M) `descriptor_ids` [L], `interactive_elements` [F]
- `rating_date` [D], `certificate_id` [F], `region_id` [L], `notes` [F]

#### Technical Specs (per Release)
- `release_id`
- `resolution_modes` [F] (e.g., "1440p–2160p dynamic")
- `framerate_modes` [F] (e.g., "30/60/120 with VRR")
- `hdr_supported` [B], `vrr_supported` [B], `ray_tracing` [B]
- `upscaler_name` [F] (e.g., "DLSS 3.7", "FSR 3")
- `graphics_presets_notes` [F]
- (M2M) `input_methods` [L]
- `vr_supported` [B], `vr_required` [B], `vr_platform_id` [L]
- `cloud_saves` [B], `cloud_provider_name` [F]
- `anti_cheat_name` [F]

#### System Requirements (PC, per Release)
- **Minimum**: `os_id` [L], `cpu_name` [F], `gpu_name` [F], `ram_gb` [N], `storage_gb` [N], `directx_api_id` [L], `notes` [F]
- **Recommended**: same fields

#### Media
- `id`, `game_id` or `edition_id`/`release_id`
- `media_type_id` [L] (e.g., Trailer)
- `title` [F], `caption` [F], `credit` [F]
- **Source/storage**
  - `asset_source` [E] — UploadedFile | ExternalURL | Embedded
  - `file_url` [U] (for uploads/CDN)
  - `source_url` [U] (original/external)
  - `embed_provider` [F] (e.g., YouTube, Vimeo, SoundCloud)
  - `embed_id` [F] (e.g., YouTube video ID)
- **File/meta**: `mime_type` [F], `file_size_bytes` [N], `width` [N], `height` [N], `duration_sec` [N], `checksum` [F]
- **Flags**: `language_id` [L], `is_official` [B], `is_nsfw` [B]

#### External IDs
- `id`, `entity_ref` (Game/Edition/Release), `source_id` [L], `value` [F], `region_id` [L] (optional), `url` [U]

---

## 3) Key tasks for the LLM
1. **Ingest & structure:** Extract entities and fields from unstructured sources (press releases, store pages, reviews) into JSON schemas below.
2. **Normalise to lookups:** Map input strings to canonical lookups using alias rules, slugs, and fuzzy matching with confidence scores.
3. **De‑duplicate:** Identify likely duplicate Games/Companies/Lookups and propose merges with rationale.
4. **Validate:** Check for schema completeness, logical consistency (e.g., `is_vr_only` implies `vr_supported`), and surface anomalies.
5. **Propose additions:** When a term isn’t in a lookup but is appropriate (e.g., a new Subgenre), propose a new lookup candidate with aliases and definition.
6. **Localisation:** Populate Localised Titles and language roles per Release when evidence exists.
7. **Media handling:** Categorise media by type, set `asset_source`, and capture technical metadata.

---

## 4) Normalisation rules
- **Slugs:** lower‑case; strip punctuation; collapse whitespace/hyphens; ASCII‑fold (e.g., "Pokémon" → `pokemon`).
- **Stop‑terms for genres:** remove suffixes like "game", "videogame" when slugging ("Action Game" → `action`).
- **Alias capture:** when mapping a term to a lookup, also propose an Alias record if the literal input isn’t yet present.
- **Synonyms:** treat “Shoot ’em up” ≡ “Shmup”; “JRPG” ≡ “Japanese RPG”; “Twin‑stick Shooter” ≡ “Twin Stick Shooter”.
- **Hierarchies:** keep **Genre** (broad) separate from **Subgenre** (specific) and **Theme** (narrative tone). Avoid mixed terms like “Action‑Adventure” by representing both as Genre + Subgenre pair if needed.
- **Regions/Languages:** prefer lookups over free strings; use ISO 639‑1 for languages, standard region set for regions.
- **Dates:** if only a month/year is known, set the first day of the period and add `precision: "month"|"year"` in the `decisions` block.

---

## 5) Deduplication guidance
Compute a **duplicate confidence** (0–1) using weighted features; propose a merge when ≥ 0.85.

**Features (suggested weights):**
- Canonical/alias title similarity (0.35)
- Shared external IDs (hard match) (0.35)
- Earliest release date proximity (±30 days) (0.1)
- Developer/Publisher overlap (0.1)
- Franchise/Series context (0.05)
- Genre/Platform overlap (0.05)

**Merge proposal output:** specify `winner_id`, `loser_id`, and a mapped field merge plan (e.g., union of genres, earliest `first_release_date`, prefer non‑null `cover_asset_id`).

---

## 6) Output format (envelope)
All LLM outputs should be a single JSON object with this shape:

```json
{
  "task": "ingest|normalise|dedupe|validate|propose_lookup|update",
  "input_source": {
    "type": "url|html|text|api",
    "value": "..."
  },
  "entities": {
    "games": [ { /* Game schema */ } ],
    "editions": [ { /* Edition schema */ } ],
    "releases": [ { /* Release schema */ } ],
    "companies": [ { /* Company schema */ } ],
    "people": [ { /* People schema */ } ],
    "ratings": [ { /* Rating schema */ } ],
    "media": [ { /* Media schema */ } ],
    "external_ids": [ { /* External ID schema */ } ]
  },
  "lookup_matches": [
    {
      "table": "genres|platforms|...",
      "input": "Action Game",
      "matched_id": 12,
      "matched_name": "Action",
      "confidence": 0.97,
      "aliases_to_add": ["Action Game"],
      "notes": "Stop-term removal + alias present"
    }
  ],
  "proposed_lookups": [
    {
      "table": "subgenres",
      "canonical_name": "Soulslike",
      "definition": "Action RPGs characterised by stamina-based combat and bonfire-style checkpoints.",
      "aliases": ["Souls-like"],
      "parent_id": 4
    }
  ],
  "dedupe_proposals": [
    {
      "entity": "games",
      "winner_id": "game_123",
      "loser_id": "game_987",
      "confidence": 0.91,
      "rationale": "Title and Steam AppID match; dates ±1 day",
      "field_merge_plan": {"first_release_date": "min", "cover_asset_id": "prefer-non-null"}
    }
  ],
  "validation": {
    "errors": [ {"path": "releases[0].platform_id", "message": "Missing required lookup id"} ],
    "warnings": [ {"path": "games[0].avg_length_main", "message": "Outlier: 500 hours"} ]
  }
}
```

---

## 7) Entity JSON schemas
*(Identifiers may be temporary client IDs before persistence.)*

**Game**
```json
{
  "temp_id": "game_tmp_001",
  "canonical_title": "...",
  "sort_title": "...",
  "franchise_id": 0,
  "series_position": 0,
  "synopsis_short": "...",
  "description_long": "...",
  "status": "Announced|In Development|Released|Cancelled|Delisted",
  "first_announced_date": "YYYY-MM-DD",
  "first_release_date": "YYYY-MM-DD",
  "primary_genre_id": 0,
  "game_genres": [0],
  "game_subgenres": [0],
  "game_themes": [0],
  "game_modes": [0],
  "player_perspectives": [0],
  "art_styles": [0],
  "monetisation_model_id": 0,
  "business_model_notes": "...",
  "engine_id": 0,
  "coop_supported": true,
  "max_players_local": 0,
  "max_players_online": 0,
  "avg_length_main": 0,
  "avg_length_extra": 0,
  "avg_length_completionist": 0,
  "official_site": "https://...",
  "press_kit_url": "https://...",
  "age_ratings_summary": "...",
  "cover_asset_id": 0,
  "is_vr_only": false,
  "is_vr_supported": false,
  "is_cloud_only": false,
  "crossplay_supported": false,
  "crosssave_supported": false,
  "accessibility_summary": "...",
  "tech_notes": "...",
  "notes_internal": "...",
  "localised_titles": [
    {"locale": "en-GB", "display_title": "...", "romanised_title": "...", "official": true}
  ],
  "aliases": [
    {"alias": "...", "region_id": 0, "source": "..."}
  ]
}
```

**Edition**
```json
{
  "temp_id": "ed_tmp_001",
  "game_ref": "game_tmp_001|game_id",
  "edition_name": "Deluxe Edition",
  "release_type_id": 0,
  "includes_base_game": true,
  "included_dlcs": [0],
  "bonus_content_description": "...",
  "physical_contents": "...",
  "digital_contents": "...",
  "sku_code": "...",
  "default_cover_asset_id": 0,
  "is_port": false
}
```

**Release**
```json
{
  "temp_id": "rel_tmp_001",
  "edition_ref": "ed_tmp_001|edition_id",
  "platform_id": 0,
  "region_id": 0,
  "release_date": "YYYY-MM-DD",
  "distribution_format_id": 0,
  "min_players_local": 1,
  "max_players_local": 4,
  "min_players_online": 0,
  "max_players_online": 16,
  "crosssave_available": true,
  "supported_languages": [
    {"language_id": 0, "roles": ["Interface", "Audio", "Subtitles"]}
  ],
  "install_size_gb": 50,
  "requires_online": false,
  "drm_tech_name": "Denuvo",
  "storefront_id": 0,
  "store_product_id": "...",
  "store_url": "https://...",
  "delisted_date": null,
  "delisted_reason": null,
  "release_publishers": [ {"company_id": 0, "region_id": 0} ],
  "patch_baseline_version": "1.0.0",
  "notes": "PC version port credit here"
}
```

**Company**
```json
{
  "temp_id": "co_tmp_001",
  "name": "...",
  "country": "...",
  "founded_date": "YYYY-MM-DD",
  "website": "https://...",
  "description": "...",
  "is_defunct": false
}
```

**GameCompanyRole**
```json
{
  "game_ref": "game_tmp_001|game_id",
  "company_ref": "co_tmp_001|company_id",
  "role_id": 0,
  "region_id": 0,
  "notes": "..."
}
```

**Rating**
```json
{
  "game_ref": "game_tmp_001|game_id",
  "board_id": 0,
  "rating_category_id": 0,
  "descriptor_ids": [0],
  "interactive_elements": "In-Game Purchases, Users Interact",
  "rating_date": "YYYY-MM-DD",
  "certificate_id": "...",
  "region_id": 0,
  "notes": "..."
}
```

**TechnicalSpecs**
```json
{
  "release_ref": "rel_tmp_001|release_id",
  "resolution_modes": "2160p upscaled; dynamic 1440p–2160p",
  "framerate_modes": "30/60/120 with VRR",
  "hdr_supported": true,
  "vrr_supported": true,
  "ray_tracing": false,
  "upscaler_name": "DLSS 3.7",
  "graphics_presets_notes": "Quality/Performance modes",
  "input_methods": [0],
  "vr_supported": false,
  "vr_required": false,
  "vr_platform_id": null,
  "cloud_saves": true,
  "cloud_provider_name": "Steam Cloud",
  "anti_cheat_name": "EAC"
}
```

**SystemRequirements**
```json
{
  "release_ref": "rel_tmp_001|release_id",
  "minimum": {"os_id": 0, "cpu_name": "i5-8400", "gpu_name": "GTX 1060", "ram_gb": 8, "storage_gb": 60, "directx_api_id": 0, "notes": "SSD recommended"},
  "recommended": {"os_id": 0, "cpu_name": "Ryzen 5 5600", "gpu_name": "RTX 2060", "ram_gb": 16, "storage_gb": 60, "directx_api_id": 0, "notes": "1080p60 High"}
}
```

**Media**
```json
{
  "temp_id": "med_tmp_001",
  "entity_ref": {"type": "game|edition|release", "id": "game_tmp_001|game_id"},
  "media_type_id": 0,
  "title": "Reveal Trailer",
  "caption": "...",
  "credit": "Publisher",
  "asset_source": "UploadedFile|ExternalURL|Embedded",
  "file_url": "https://cdn.example/asset.mp4",
  "source_url": "https://youtube.com/watch?v=...",
  "embed_provider": "YouTube",
  "embed_id": "abc123",
  "mime_type": "video/mp4",
  "file_size_bytes": 123456789,
  "width": 1920,
  "height": 1080,
  "duration_sec": 120,
  "checksum": "sha256:...",
  "language_id": 0,
  "is_official": true,
  "is_nsfw": false
}
```

**ExternalID**
```json
{
  "entity_ref": {"type": "game|edition|release", "id": "game_tmp_001|game_id"},
  "source_id": 0,
  "value": "570",
  "region_id": null,
  "url": "https://store.steampowered.com/app/570/"
}
```

---

## 8) Validation rules & heuristics
- `first_release_date` ≤ all `Release.release_date` values for the same Game.
- If `is_vr_only = true` then `vr_supported = true` and at least one VR platform Release exists.
- `max_players_*` ≥ corresponding `min_players_*`.
- If `distribution_format_id = Physical` then `store_url` may be null (but retailer links can be Media/External IDs).
- For Editions with `release_type = Remaster|Remake`, set `is_port` only if it’s a platform move without material content changes (heuristic; include rationale in `decisions`).

---

## 9) Media handling
- Always set `media_type_id` using the lookup. Do **not** create bespoke types per source.
- `asset_source` governs how we store it:
  - **UploadedFile** → `file_url` required; `checksum` strongly recommended.
  - **ExternalURL** → `source_url` required; fetch metadata if available.
  - **Embedded** → `embed_provider` + `embed_id` required; also keep `source_url`.
- Prefer official sources when possible and mark `is_official = true`.
- For trailers, set `language_id` when obvious (e.g., JP trailers).

---

## 10) Accessibility & online features extraction
- Map phrases like “fully remappable controls”, “colour‑blind filters”, “text‑to‑speech” → **Accessibility Features** lookup.
- Map “cross‑play”, “cross‑save”, “cloud saves” → **Online Features** or dedicated booleans (`crossplay_supported`, etc.).
- Add evidence snippets to `decisions.notes` when confidence < 0.8.

---

## 11) Company roles guidance
- Use **Publisher** for entities funding/releasing in a region/platform.
- Use **Developer/Co‑Developer** for creators.
- Use **Support Studio** when credited as co‑dev but for a subset of disciplines.
- **Do not** create roles for Distributor or Porting House. Mention porting credits in `Release.notes`.

---

## 12) Error handling & confidence
- Provide `confidence` 0–1 per lookup match and per dedupe proposal.
- For low‑confidence mappings (< 0.7), include alternatives (`candidates: [{id, name, score}]`).
- Flag missing required fields in `validation.errors`.
- Never invent external IDs; if unsure, omit and add a warning.

---

## 13) Worked examples

### 13.1 Normalising a genre alias
**Input:** “Action Game”

**Expected `lookup_matches`:**
```json
[{
  "table": "genres",
  "input": "Action Game",
  "matched_id": 12,
  "matched_name": "Action",
  "confidence": 0.97,
  "aliases_to_add": ["Action Game"],
  "notes": "Stop-term removal + exact slug match"
}]
```

### 13.2 Press release → structured entities
- Create `Game`, `Edition` (Standard), and `Release` rows per announced platform/region/date.
- Populate Companies with roles (Developer, Publisher).
- Add `Media` for the reveal trailer (Embedded → YouTube) and key art (UploadedFile if provided).
- Add Ratings if explicitly stated; otherwise omit.

### 13.3 Dedupe proposal
Two games with same Steam AppID and near‑identical titles:
```json
{
  "dedupe_proposals": [{
    "entity": "games",
    "winner_id": "game_123",
    "loser_id": "game_987",
    "confidence": 0.93,
    "rationale": "Shared external ID (Steam 570) and exact title match",
    "field_merge_plan": {"first_release_date": "min", "cover_asset_id": "prefer-non-null", "game_genres": "union"}
  }]
}
```

---

## 14) Operational guidance for the LLM
- Prefer **precision over recall**: omit fields when not supported by the source evidence.
- Always separate **Game** vs **Edition** vs **Release**; do not overload Game with platform‑specific details.
- Use lookups wherever defined; when not found, propose a `proposed_lookups` entry.
- Provide short *rationales* (1–2 sentences) for non‑obvious decisions in the envelope’s `decisions`/`notes`.
- Keep British spellings (e.g., “localised”).

---

## 15) Non‑goals & exclusions
- No formal modelling of Middleware/Tech as a lookup.
- No Distributor or Porting House roles (use `Release.notes` or `is_port`).
- Do not scrape or fabricate prices unless explicitly instructed for a dedicated pricing module.

---

## 16) Appendices

### 16.1 Enumerations (indicative, not exhaustive)
- **Statuses:** Announced | In Development | Released | Cancelled | Delisted
- **Asset sources:** UploadedFile | ExternalURL | Embedded
- **Release types:** Full Release | Early Access | Beta | Demo | Remaster | Remake | Port | Expansion | Standalone DLC | Collection
- **Monetisation:** Premium | Free‑to‑Play | Subscription | Season Pass | Battle Pass | Cosmetic MTX | Gacha
- **Media types:** Cover | Logo | Key Art | Screenshot | Concept Art | Trailer | Gameplay Video | OST Track | Icon | Banner
- **Roles:** Developer | Co‑Developer | Publisher | QA | Localisation | Marketing | Support Studio

### 16.2 Required fields by entity (MVP)
- **Game:** `canonical_title`, at least one of `primary_genre_id` or `game_genres`, `status`
- **Edition:** `game_id`, `edition_name`
- **Release:** `edition_id`, `platform_id`, `region_id`, `release_date`
- **Media:** `entity_ref`, `media_type_id`, (`file_url` or `source_url` or `embed_*`), `asset_source`

### 16.3 Confidence scale
- **≥ 0.9:** Strong evidence (explicit, cross‑checked)
- **0.7–0.89:** Probable (implicit phrasing, one strong source)
- **< 0.7:** Weak (ambiguous wording); propose candidates instead of choosing

---

**End of brief.**

