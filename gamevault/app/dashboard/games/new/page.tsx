'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'

type GameInsert = Database['public']['Tables']['games']['Insert']
type LookupRow = Database['public']['Tables']['lookups']['Row']

export default function Page() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [genres, setGenres] = useState<LookupRow[]>([])
  const [themes, setThemes] = useState<LookupRow[]>([])
  const [modes, setModes] = useState<LookupRow[]>([])
  const [engines, setEngines] = useState<LookupRow[]>([])
  const [monetisationModels, setMonetisationModels] = useState<LookupRow[]>([])
  const [platforms, setPlatforms] = useState<LookupRow[]>([])
  const [regions, setRegions] = useState<LookupRow[]>([])
  const [releaseTypes, setReleaseTypes] = useState<LookupRow[]>([])
  const [distributionFormats, setDistributionFormats] = useState<LookupRow[]>([])
  const [drmTechs, setDrmTechs] = useState<LookupRow[]>([])
  const [storefronts, setStorefronts] = useState<LookupRow[]>([])
  const [ratingBoards, setRatingBoards] = useState<LookupRow[]>([])
  const [ratingCategories, setRatingCategories] = useState<LookupRow[]>([])

  const [form, setForm] = useState<Partial<GameInsert>>({
    canonical_title: '',
    sort_title: '',
    status: 'announced',
    synopsis_short: '',
    description_long: '',
    first_announced_date: null,
    first_release_date: null,
    primary_genre_id: null,
    engine_id: null,
    monetisation_model_id: null,
    coop_supported: false,
    max_players_local: null,
    max_players_online: null,
    is_vr_supported: false,
    is_vr_only: false,
    is_cloud_only: false,
    crossplay_supported: false,
    crosssave_supported: false,
    official_site: '',
    press_kit_url: '',
    age_ratings_summary: '',
    business_model_notes: '',
    accessibility_summary: '',
    tech_notes: '',
    notes_internal: ''
  })

  // Additional classification selections
  const [additionalGenreIds, setAdditionalGenreIds] = useState<string[]>([])
  const [themeIds, setThemeIds] = useState<string[]>([])
  const [modeIds, setModeIds] = useState<string[]>([])

  // Quick Age Rating
  const [ratingBoardId, setRatingBoardId] = useState<string | null>(null)
  const [ratingCategoryId, setRatingCategoryId] = useState<string | null>(null)
  const [ratingRegionId, setRatingRegionId] = useState<string | null>(null)
  const [ratingDate, setRatingDate] = useState<string | null>(null)
  const [ratingCertificate, setRatingCertificate] = useState<string>('')
  const [ratingInteractive, setRatingInteractive] = useState<string>('')
  const [ratingNotes, setRatingNotes] = useState<string>('')

  // Quick initial Edition + Release
  const [createInitialRelease, setCreateInitialRelease] = useState<boolean>(true)
  const [editionName, setEditionName] = useState<string>('Standard Edition')
  const [releaseTypeId, setReleaseTypeId] = useState<string | null>(null)
  const [releasePlatformId, setReleasePlatformId] = useState<string | null>(null)
  const [releaseRegionId, setReleaseRegionId] = useState<string | null>(null)
  const [releaseDate, setReleaseDate] = useState<string | null>(null)
  const [distributionFormatId, setDistributionFormatId] = useState<string | null>(null)
  const [drmTechId, setDrmTechId] = useState<string | null>(null)
  const [storefrontId, setStorefrontId] = useState<string | null>(null)
  const [storeProductId, setStoreProductId] = useState<string>('')
  const [storeUrl, setStoreUrl] = useState<string>('')

  // Add-lookup sheet state
  const [isAddLookupOpen, setIsAddLookupOpen] = useState<boolean>(false)
  const [addLookupType, setAddLookupType] = useState<string>('')
  const [addLookupLabel, setAddLookupLabel] = useState<string>('')
  const [addLookupName, setAddLookupName] = useState<string>('')
  const [addLookupDescription, setAddLookupDescription] = useState<string>('')
  const [afterAddTarget, setAfterAddTarget] = useState<string>('')

  const slugify = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

  const reloadLookups = async () => {
    const [
      { data: genreData },
      { data: themeData },
      { data: modeData },
      { data: engineData },
      { data: monetiseData },
      { data: platformData },
      { data: regionData },
      { data: releaseTypeData },
      { data: distroData },
      { data: drmData },
      { data: storeData },
      { data: boardData },
      { data: categoryData },
    ] = await Promise.all([
      supabase.from('lookups').select('*').eq('type', 'genre').eq('is_active', true).is('deleted_at', null).order('sort_order'),
      supabase.from('lookups').select('*').eq('type', 'theme').eq('is_active', true).is('deleted_at', null).order('canonical_name'),
      supabase.from('lookups').select('*').eq('type', 'mode').eq('is_active', true).is('deleted_at', null).order('canonical_name'),
      supabase.from('lookups').select('*').eq('type', 'engine').eq('is_active', true).is('deleted_at', null).order('canonical_name'),
      supabase.from('lookups').select('*').eq('type', 'monetisation_model').eq('is_active', true).is('deleted_at', null).order('sort_order'),
      supabase.from('lookups').select('*').eq('type', 'platform').eq('is_active', true).is('deleted_at', null).order('sort_order'),
      supabase.from('lookups').select('*').eq('type', 'region').eq('is_active', true).is('deleted_at', null).order('sort_order'),
      supabase.from('lookups').select('*').eq('type', 'release_type').eq('is_active', true).is('deleted_at', null).order('sort_order'),
      supabase.from('lookups').select('*').eq('type', 'distribution_format').eq('is_active', true).is('deleted_at', null).order('sort_order'),
      supabase.from('lookups').select('*').eq('type', 'drm_tech').eq('is_active', true).is('deleted_at', null).order('canonical_name'),
      supabase.from('lookups').select('*').eq('type', 'storefront').eq('is_active', true).is('deleted_at', null).order('canonical_name'),
      supabase.from('lookups').select('*').in('type', ['age_rating_board', 'rating_board']).eq('is_active', true).is('deleted_at', null).order('canonical_name'),
      supabase.from('lookups').select('*').in('type', ['age_rating_category', 'rating_category']).eq('is_active', true).is('deleted_at', null).order('canonical_name'),
    ])

    setGenres(genreData || [])
    setThemes(themeData || [])
    setModes(modeData || [])
    setEngines(engineData || [])
    setMonetisationModels(monetiseData || [])
    setPlatforms(platformData || [])
    setRegions(regionData || [])
    setReleaseTypes(releaseTypeData || [])
    setDistributionFormats(distroData || [])
    setDrmTechs(drmData || [])
    setStorefronts(storeData || [])
    setRatingBoards(boardData || [])
    setRatingCategories(categoryData || [])
  }

  const openAddLookup = (type: string, label: string, target: string) => {
    setAddLookupType(type)
    setAddLookupLabel(label)
    setAddLookupName('')
    setAddLookupDescription('')
    setAfterAddTarget(target)
    setIsAddLookupOpen(true)
  }

  const handleAddLookup = async () => {
    if (!addLookupType || !addLookupName.trim()) {
      toast.error('Please provide a name')
      return
    }
    try {
      const { data, error } = await supabase
        .from('lookups')
        .insert({
          type: addLookupType,
          canonical_name: addLookupName.trim(),
          slug: slugify(addLookupName),
          description: addLookupDescription || null,
          sort_order: 0,
          is_active: true,
        })
        .select('id')
        .single()
      if (error) throw error

      const newId = data?.id as string
      await reloadLookups()

      switch (afterAddTarget) {
        case 'primary_genre':
          handleChange('primary_genre_id', newId)
          break
        case 'engine':
          handleChange('engine_id', newId)
          break
        case 'monetisation_model':
          handleChange('monetisation_model_id', newId)
          break
        case 'release_type':
          setReleaseTypeId(newId)
          break
        case 'platform':
          setReleasePlatformId(newId)
          break
        case 'region':
          setReleaseRegionId(newId)
          break
        case 'distribution_format':
          setDistributionFormatId(newId)
          break
        case 'drm_tech':
          setDrmTechId(newId)
          break
        case 'storefront':
          setStorefrontId(newId)
          break
        case 'rating_board':
          setRatingBoardId(newId)
          break
        case 'rating_category':
          setRatingCategoryId(newId)
          break
        case 'genre':
          setAdditionalGenreIds(prev => Array.from(new Set([...prev, newId])))
          break
        case 'theme':
          setThemeIds(prev => Array.from(new Set([...prev, newId])))
          break
        case 'mode':
          setModeIds(prev => Array.from(new Set([...prev, newId])))
          break
        default:
          break
      }

      toast.success(`${addLookupLabel} added`)
      setIsAddLookupOpen(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add item'
      toast.error(message)
    }
  }

  useEffect(() => {
    const loadLookups = async () => {
      const [
        { data: genreData },
        { data: themeData },
        { data: modeData },
        { data: engineData },
        { data: monetiseData },
        { data: platformData },
        { data: regionData },
        { data: releaseTypeData },
        { data: distroData },
        { data: drmData },
        { data: storeData },
        { data: boardData },
        { data: categoryData },
      ] = await Promise.all([
        supabase.from('lookups').select('*').eq('type', 'genre').eq('is_active', true).is('deleted_at', null).order('sort_order'),
        supabase.from('lookups').select('*').eq('type', 'theme').eq('is_active', true).is('deleted_at', null).order('canonical_name'),
        supabase.from('lookups').select('*').eq('type', 'mode').eq('is_active', true).is('deleted_at', null).order('canonical_name'),
        supabase.from('lookups').select('*').eq('type', 'engine').eq('is_active', true).is('deleted_at', null).order('canonical_name'),
        supabase.from('lookups').select('*').eq('type', 'monetisation_model').eq('is_active', true).is('deleted_at', null).order('sort_order'),
        supabase.from('lookups').select('*').eq('type', 'platform').eq('is_active', true).is('deleted_at', null).order('sort_order'),
        supabase.from('lookups').select('*').eq('type', 'region').eq('is_active', true).is('deleted_at', null).order('sort_order'),
        supabase.from('lookups').select('*').eq('type', 'release_type').eq('is_active', true).is('deleted_at', null).order('sort_order'),
        supabase.from('lookups').select('*').eq('type', 'distribution_format').eq('is_active', true).is('deleted_at', null).order('sort_order'),
        supabase.from('lookups').select('*').eq('type', 'drm_tech').eq('is_active', true).is('deleted_at', null).order('canonical_name'),
        supabase.from('lookups').select('*').eq('type', 'storefront').eq('is_active', true).is('deleted_at', null).order('canonical_name'),
        supabase.from('lookups').select('*').in('type', ['age_rating_board', 'rating_board']).eq('is_active', true).is('deleted_at', null).order('canonical_name'),
        supabase.from('lookups').select('*').in('type', ['age_rating_category', 'rating_category']).eq('is_active', true).is('deleted_at', null).order('canonical_name'),
      ])

      setGenres(genreData || [])
      setThemes(themeData || [])
      setModes(modeData || [])
      setEngines(engineData || [])
      setMonetisationModels(monetiseData || [])
      setPlatforms(platformData || [])
      setRegions(regionData || [])
      setReleaseTypes(releaseTypeData || [])
      setDistributionFormats(distroData || [])
      setDrmTechs(drmData || [])
      setStorefronts(storeData || [])
      setRatingBoards(boardData || [])
      setRatingCategories(categoryData || [])
    }

    loadLookups()
  }, [supabase])

  const handleChange = (key: keyof GameInsert, value: unknown) => {
    setForm(prev => ({ ...prev, [key]: value as never }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.canonical_title || !form.sort_title) {
      toast.error('Please fill in the required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const payload: GameInsert = {
        canonical_title: form.canonical_title!,
        sort_title: form.sort_title!,
        status: form.status || 'announced',
        synopsis_short: form.synopsis_short || null,
        description_long: form.description_long || null,
        first_announced_date: form.first_announced_date || null,
        first_release_date: form.first_release_date || null,
        primary_genre_id: form.primary_genre_id || null,
        engine_id: form.engine_id || null,
        monetisation_model_id: form.monetisation_model_id || null,
        coop_supported: !!form.coop_supported,
        max_players_local: form.max_players_local ?? null,
        max_players_online: form.max_players_online ?? null,
        is_vr_supported: !!form.is_vr_supported,
        is_vr_only: !!form.is_vr_only,
        is_cloud_only: !!form.is_cloud_only,
        crossplay_supported: !!form.crossplay_supported,
        crosssave_supported: !!form.crosssave_supported,
        official_site: form.official_site || null,
        press_kit_url: form.press_kit_url || null,
        age_ratings_summary: form.age_ratings_summary || null,
        business_model_notes: form.business_model_notes || null,
        accessibility_summary: form.accessibility_summary || null,
        tech_notes: form.tech_notes || null,
        notes_internal: form.notes_internal || null,
      }

      const { data: insertedGame, error: insertGameError } = await supabase
        .from('games')
        .insert(payload)
        .select('id')
        .single()

      if (insertGameError) throw insertGameError

      const gameId = insertedGame?.id as string

      // Insert additional genres
      if (gameId && additionalGenreIds.length > 0) {
        const { error: ggError } = await supabase
          .from('game_genres')
          .insert(additionalGenreIds.map(id => ({ game_id: gameId, genre_id: id })))
        if (ggError) throw ggError
      }

      // Insert themes
      if (gameId && themeIds.length > 0) {
        const { error: gtError } = await supabase
          .from('game_themes')
          .insert(themeIds.map(id => ({ game_id: gameId, theme_id: id })))
        if (gtError) throw gtError
      }

      // Insert modes
      if (gameId && modeIds.length > 0) {
        const { error: gmError } = await supabase
          .from('game_modes')
          .insert(modeIds.map(id => ({ game_id: gameId, mode_id: id })))
        if (gmError) throw gmError
      }

      // Optional: insert age rating quick entry
      if (gameId && ratingBoardId && ratingCategoryId) {
        const { error: arError } = await supabase
          .from('age_ratings')
          .insert({
            game_id: gameId,
            board_id: ratingBoardId,
            rating_category_id: ratingCategoryId,
            region_id: ratingRegionId,
            rating_date: ratingDate,
            certificate_id: ratingCertificate || null,
            interactive_elements: ratingInteractive || null,
            notes: ratingNotes || null,
          })
        if (arError) throw arError
      }

      // Optional: create initial edition + release
      if (gameId && createInitialRelease && releasePlatformId && releaseRegionId) {
        const { data: edition, error: edError } = await supabase
          .from('editions')
          .insert({
            game_id: gameId,
            edition_name: editionName || 'Standard Edition',
            release_type_id: releaseTypeId,
            includes_base_game: true,
          })
          .select('id')
          .single()
        if (edError) throw edError

        const editionId = edition?.id as string
        const { error: relError } = await supabase
          .from('releases')
          .insert({
            edition_id: editionId,
            platform_id: releasePlatformId,
            region_id: releaseRegionId,
            release_date: releaseDate,
            distribution_format_id: distributionFormatId,
            drm_tech_id: drmTechId,
            storefront_id: storefrontId,
            store_product_id: storeProductId || null,
            store_url: storeUrl || null,
          })
        if (relError) throw relError
      }

      toast.success('Game created successfully')
      router.push(`/dashboard`) // future: `/dashboard/games/${data.id}` when detail exists
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create game'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": 'calc(var(--spacing) * 72)',
        "--header-height": 'calc(var(--spacing) * 12)'
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 md:px-6">
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle>Add New Game</CardTitle>
                    <CardDescription>Enter the core details of the game. You can add editions, releases and media later.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={onSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="canonical_title">Canonical title</Label>
                          <Input id="canonical_title" required value={form.canonical_title || ''} onChange={(e) => handleChange('canonical_title', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sort_title">Sort title</Label>
                          <Input id="sort_title" required value={form.sort_title || ''} onChange={(e) => handleChange('sort_title', e.target.value)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select value={form.status} onValueChange={(v) => handleChange('status', v as Database['public']['Enums']['game_status'])}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="announced">Announced</SelectItem>
                              <SelectItem value="in_development">In development</SelectItem>
                              <SelectItem value="released">Released</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="delisted">Delisted</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="first_announced_date">Announcement date</Label>
                          <Input id="first_announced_date" type="date" value={form.first_announced_date || ''} onChange={(e) => handleChange('first_announced_date', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="first_release_date">First release date</Label>
                          <Input id="first_release_date" type="date" value={form.first_release_date || ''} onChange={(e) => handleChange('first_release_date', e.target.value)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Primary genre</Label>
                            <Button type="button" size="sm" variant="outline" onClick={() => openAddLookup('genre', 'Genre', 'primary_genre')}>Add</Button>
                          </div>
                          <Select value={form.primary_genre_id || undefined} onValueChange={(v) => handleChange('primary_genre_id', v)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select genre" />
                            </SelectTrigger>
                            <SelectContent>
                              {genres.map(g => (
                                <SelectItem key={g.id} value={g.id}>{g.canonical_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Engine</Label>
                            <Button type="button" size="sm" variant="outline" onClick={() => openAddLookup('engine', 'Engine', 'engine')}>Add</Button>
                          </div>
                          <Select value={form.engine_id || undefined} onValueChange={(v) => handleChange('engine_id', v)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select engine" />
                            </SelectTrigger>
                            <SelectContent>
                              {engines.map(e => (
                                <SelectItem key={e.id} value={e.id}>{e.canonical_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Monetisation model</Label>
                            <Button type="button" size="sm" variant="outline" onClick={() => openAddLookup('monetisation_model', 'Monetisation model', 'monetisation_model')}>Add</Button>
                          </div>
                          <Select value={form.monetisation_model_id || undefined} onValueChange={(v) => handleChange('monetisation_model_id', v)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select model" />
                            </SelectTrigger>
                            <SelectContent>
                              {monetisationModels.map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.canonical_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Classification: additional genres, themes, modes */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Additional genres</Label>
                            <Button type="button" size="sm" variant="outline" onClick={() => openAddLookup('genre', 'Genre', 'genre')}>Add</Button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                            {genres.map(g => (
                              <label key={g.id} className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={additionalGenreIds.includes(g.id)}
                                  onCheckedChange={(checked) => {
                                    setAdditionalGenreIds(prev => checked ? Array.from(new Set([...prev, g.id])) : prev.filter(id => id !== g.id))
                                  }}
                                />
                                <span>{g.canonical_name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Themes</Label>
                            <Button type="button" size="sm" variant="outline" onClick={() => openAddLookup('theme', 'Theme', 'theme')}>Add</Button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                            {themes.map(t => (
                              <label key={t.id} className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={themeIds.includes(t.id)}
                                  onCheckedChange={(checked) => {
                                    setThemeIds(prev => checked ? Array.from(new Set([...prev, t.id])) : prev.filter(id => id !== t.id))
                                  }}
                                />
                                <span>{t.canonical_name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Game modes</Label>
                            <Button type="button" size="sm" variant="outline" onClick={() => openAddLookup('mode', 'Game mode', 'mode')}>Add</Button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                            {modes.map(m => (
                              <label key={m.id} className="flex items-center gap-2 text-sm">
                                <Checkbox
                                  checked={modeIds.includes(m.id)}
                                  onCheckedChange={(checked) => {
                                    setModeIds(prev => checked ? Array.from(new Set([...prev, m.id])) : prev.filter(id => id !== m.id))
                                  }}
                                />
                                <span>{m.canonical_name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="synopsis_short">Short synopsis</Label>
                          <Textarea id="synopsis_short" value={form.synopsis_short || ''} onChange={(e) => handleChange('synopsis_short', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description_long">Long description</Label>
                          <Textarea id="description_long" className="min-h-32" value={form.description_long || ''} onChange={(e) => handleChange('description_long', e.target.value)} />
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="max_players_local">Max players (local)</Label>
                          <Input id="max_players_local" type="number" min={0} value={form.max_players_local ?? ''} onChange={(e) => handleChange('max_players_local', e.target.value ? Number(e.target.value) : null)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="max_players_online">Max players (online)</Label>
                          <Input id="max_players_online" type="number" min={0} value={form.max_players_online ?? ''} onChange={(e) => handleChange('max_players_online', e.target.value ? Number(e.target.value) : null)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="official_site">Official site</Label>
                          <Input id="official_site" type="url" placeholder="https://example.com" value={form.official_site || ''} onChange={(e) => handleChange('official_site', e.target.value)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <Checkbox id="coop_supported" checked={!!form.coop_supported} onCheckedChange={(v) => handleChange('coop_supported', Boolean(v))} />
                          <Label htmlFor="coop_supported">Co-op supported</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox id="is_vr_supported" checked={!!form.is_vr_supported} onCheckedChange={(v) => handleChange('is_vr_supported', Boolean(v))} />
                          <Label htmlFor="is_vr_supported">VR supported</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox id="is_vr_only" checked={!!form.is_vr_only} onCheckedChange={(v) => handleChange('is_vr_only', Boolean(v))} />
                          <Label htmlFor="is_vr_only">VR only</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox id="is_cloud_only" checked={!!form.is_cloud_only} onCheckedChange={(v) => handleChange('is_cloud_only', Boolean(v))} />
                          <Label htmlFor="is_cloud_only">Cloud-only</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox id="crossplay_supported" checked={!!form.crossplay_supported} onCheckedChange={(v) => handleChange('crossplay_supported', Boolean(v))} />
                          <Label htmlFor="crossplay_supported">Cross-play supported</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox id="crosssave_supported" checked={!!form.crosssave_supported} onCheckedChange={(v) => handleChange('crosssave_supported', Boolean(v))} />
                          <Label htmlFor="crosssave_supported">Cross-save supported</Label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="press_kit_url">Press kit URL</Label>
                          <Input id="press_kit_url" type="url" placeholder="https://example.com/press" value={form.press_kit_url || ''} onChange={(e) => handleChange('press_kit_url', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="age_ratings_summary">Age ratings summary</Label>
                          <Input id="age_ratings_summary" value={form.age_ratings_summary || ''} onChange={(e) => handleChange('age_ratings_summary', e.target.value)} />
                        </div>
                      </div>

                      {/* Quick Age Rating */}
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">Age Rating (optional)</CardTitle>
                            <CardDescription>Select a board and category to add an initial rating.</CardDescription>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Board</Label>
                              <Button type="button" size="sm" variant="outline" onClick={() => openAddLookup('age_rating_board', 'Rating board', 'rating_board')}>Add</Button>
                            </div>
                            <Select value={ratingBoardId || undefined} onValueChange={setRatingBoardId}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select board" />
                              </SelectTrigger>
                              <SelectContent>
                                {ratingBoards.map(b => (
                                  <SelectItem key={b.id} value={b.id}>{b.canonical_name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Category</Label>
                              <Button type="button" size="sm" variant="outline" onClick={() => openAddLookup('age_rating_category', 'Rating category', 'rating_category')}>Add</Button>
                            </div>
                            <Select value={ratingCategoryId || undefined} onValueChange={setRatingCategoryId}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {ratingCategories.map(c => (
                                  <SelectItem key={c.id} value={c.id}>{c.canonical_name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Region</Label>
                              <Button type="button" size="sm" variant="outline" onClick={() => openAddLookup('region', 'Region', 'region')}>Add</Button>
                            </div>
                            <Select value={ratingRegionId || undefined} onValueChange={setRatingRegionId}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select region" />
                              </SelectTrigger>
                              <SelectContent>
                                {regions.map(r => (
                                  <SelectItem key={r.id} value={r.id}>{r.canonical_name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="rating_date">Rating date</Label>
                            <Input id="rating_date" type="date" value={ratingDate || ''} onChange={(e) => setRatingDate(e.target.value)} />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="certificate_id">Certificate ID</Label>
                            <Input id="certificate_id" value={ratingCertificate} onChange={(e) => setRatingCertificate(e.target.value)} />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="interactive_elements">Interactive elements</Label>
                            <Input id="interactive_elements" value={ratingInteractive} onChange={(e) => setRatingInteractive(e.target.value)} />
                          </div>
                          <div className="space-y-2 md:col-span-3">
                            <Label htmlFor="rating_notes">Notes</Label>
                            <Textarea id="rating_notes" value={ratingNotes} onChange={(e) => setRatingNotes(e.target.value)} />
                          </div>
                        </div>
                      </div>

                      {/* Quick Edition + Release */}
                      <Separator />
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Checkbox id="create_initial_release" checked={createInitialRelease} onCheckedChange={(v) => setCreateInitialRelease(Boolean(v))} />
                          <Label htmlFor="create_initial_release">Create an initial Edition and Release (includes Platform)</Label>
                        </div>
                        {createInitialRelease && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="edition_name">Edition name</Label>
                                <Input id="edition_name" value={editionName} onChange={(e) => setEditionName(e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Release type</Label>
                                  <Button type="button" size="sm" variant="outline" onClick={() => openAddLookup('release_type', 'Release type', 'release_type')}>Add</Button>
                                </div>
                                <Select value={releaseTypeId || undefined} onValueChange={setReleaseTypeId}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {releaseTypes.map(rt => (
                                      <SelectItem key={rt.id} value={rt.id}>{rt.canonical_name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="release_date">Release date</Label>
                                <Input id="release_date" type="date" value={releaseDate || ''} onChange={(e) => setReleaseDate(e.target.value)} />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Platform</Label>
                                  <Button type="button" size="sm" variant="outline" onClick={() => openAddLookup('platform', 'Platform', 'platform')}>Add</Button>
                                </div>
                                <Select value={releasePlatformId || undefined} onValueChange={setReleasePlatformId}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select platform" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {platforms.map(p => (
                                      <SelectItem key={p.id} value={p.id}>{p.canonical_name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Region</Label>
                                  <Button type="button" size="sm" variant="outline" onClick={() => openAddLookup('region', 'Region', 'region')}>Add</Button>
                                </div>
                                <Select value={releaseRegionId || undefined} onValueChange={setReleaseRegionId}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select region" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {regions.map(r => (
                                      <SelectItem key={r.id} value={r.id}>{r.canonical_name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Distribution format</Label>
                                  <Button type="button" size="sm" variant="outline" onClick={() => openAddLookup('distribution_format', 'Distribution format', 'distribution_format')}>Add</Button>
                                </div>
                                <Select value={distributionFormatId || undefined} onValueChange={setDistributionFormatId}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select format" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {distributionFormats.map(df => (
                                      <SelectItem key={df.id} value={df.id}>{df.canonical_name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>DRM</Label>
                                  <Button type="button" size="sm" variant="outline" onClick={() => openAddLookup('drm_tech', 'DRM tech', 'drm_tech')}>Add</Button>
                                </div>
                                <Select value={drmTechId || undefined} onValueChange={setDrmTechId}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select DRM" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {drmTechs.map(d => (
                                      <SelectItem key={d.id} value={d.id}>{d.canonical_name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label>Storefront</Label>
                                  <Button type="button" size="sm" variant="outline" onClick={() => openAddLookup('storefront', 'Storefront', 'storefront')}>Add</Button>
                                </div>
                                <Select value={storefrontId || undefined} onValueChange={setStorefrontId}>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select storefront" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {storefronts.map(s => (
                                      <SelectItem key={s.id} value={s.id}>{s.canonical_name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="store_product_id">Store product ID</Label>
                                <Input id="store_product_id" value={storeProductId} onChange={(e) => setStoreProductId(e.target.value)} />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="store_url">Store URL</Label>
                              <Input id="store_url" type="url" placeholder="https://store.example.com/product" value={storeUrl} onChange={(e) => setStoreUrl(e.target.value)} />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 justify-end pt-2">
                        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Game'}</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      {/* Add Lookup Sheet */}
      <Sheet open={isAddLookupOpen} onOpenChange={setIsAddLookupOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Add {addLookupLabel}</SheetTitle>
            <SheetDescription>Create a new {addLookupLabel} lookup value.</SheetDescription>
          </SheetHeader>
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="lookup_name">Name</Label>
              <Input id="lookup_name" value={addLookupName} onChange={(e) => setAddLookupName(e.target.value)} placeholder={`e.g. ${addLookupLabel === 'Engine' ? 'Unreal Engine' : addLookupLabel}`} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lookup_description">Description (optional)</Label>
              <Textarea id="lookup_description" value={addLookupDescription} onChange={(e) => setAddLookupDescription(e.target.value)} />
            </div>
          </div>
          <SheetFooter>
            <div className="flex items-center gap-3 p-4 pt-0">
              <Button variant="outline" onClick={() => setIsAddLookupOpen(false)}>Cancel</Button>
              <Button onClick={handleAddLookup} disabled={!addLookupName.trim()}>Add</Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  )
}


