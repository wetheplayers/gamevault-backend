'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'

type GameInsert = Database['public']['Tables']['games']['Insert']
type LookupRow = Database['public']['Tables']['lookups']['Row']
type MediaInsert = Database['public']['Tables']['media']['Insert']
type MediaSource = Database['public']['Enums']['media_source']

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')
  const isEditMode = Boolean(editId)
  const defaultTab = (searchParams.get('tab') || 'basics') as string
  const supabase = useMemo(() => createClient(), [])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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
  const [mediaTypes, setMediaTypes] = useState<LookupRow[]>([])

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

  // Age Ratings (multiple)
  type RatingInput = {
    boardId: string
    categoryId: string
    regionId: string
    date: string
    certificate: string
    interactive: string
    notes: string
  }
  const emptyRating: RatingInput = {
    boardId: '',
    categoryId: '',
    regionId: '',
    date: '',
    certificate: '',
    interactive: '',
    notes: '',
  }
  const [ratings, setRatings] = useState<RatingInput[]>([emptyRating])

  // Quick initial Edition + Release
  const [createInitialRelease, setCreateInitialRelease] = useState<boolean>(true)
  const [editionName, setEditionName] = useState<string>('Standard Edition')
  const [releaseTypeId, setReleaseTypeId] = useState<string>('')
  const [releasePlatformId, setReleasePlatformId] = useState<string>('')
  const [releaseRegionId, setReleaseRegionId] = useState<string>('')
  const [releaseDate, setReleaseDate] = useState<string>('')
  const [distributionFormatId, setDistributionFormatId] = useState<string>('')
  const [drmTechId, setDrmTechId] = useState<string>('')
  const [storefrontId, setStorefrontId] = useState<string>('')
  const [storeProductId, setStoreProductId] = useState<string>('')
  const [storeUrl, setStoreUrl] = useState<string>('')

  // Add-lookup sheet state
  const [isAddLookupOpen, setIsAddLookupOpen] = useState<boolean>(false)
  const [addLookupType, setAddLookupType] = useState<string>('')
  const [addLookupLabel, setAddLookupLabel] = useState<string>('')
  const [addLookupName, setAddLookupName] = useState<string>('')
  const [addLookupDescription, setAddLookupDescription] = useState<string>('')
  const [afterAddTarget, setAfterAddTarget] = useState<string>('')
  const [afterAddIndex, setAfterAddIndex] = useState<number | null>(null)

  // Media items state
  type MediaFormItem = {
    mediaTypeId: string
    source: MediaSource
    file: File | null
    url: string
    embedProvider: string
    embedId: string
    title: string
    caption: string
    credit: string
    isOfficial: boolean
    isNsfw: boolean
    mimeType: string | null
    fileSizeBytes: number | null
    width: number | null
    height: number | null
  }

  const emptyMediaItem: MediaFormItem = {
    mediaTypeId: '',
    source: 'uploaded_file',
    file: null,
    url: '',
    embedProvider: '',
    embedId: '',
    title: '',
    caption: '',
    credit: '',
    isOfficial: true,
    isNsfw: false,
    mimeType: null,
    fileSizeBytes: null,
    width: null,
    height: null,
  }
  const [mediaItems, setMediaItems] = useState<MediaFormItem[]>([])
  type ExistingMediaItem = {
    id: string
    media_type_id: string
    title: string | null
    caption: string | null
    storage_bucket: string | null
    storage_path: string | null
    source_url: string | null
    embed_provider: string | null
    embed_id: string | null
    mime_type: string | null
    width: number | null
    height: number | null
    created_at: string
    public_url: string | null
  }
  const [existingMedia, setExistingMedia] = useState<ExistingMediaItem[]>([])
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const bulkFileInputRef = useRef<HTMLInputElement | null>(null)

  // Edit media state
  const [isEditMediaOpen, setIsEditMediaOpen] = useState<boolean>(false)
  const [editMedia, setEditMedia] = useState<ExistingMediaItem | null>(null)
  const [editMediaTypeId, setEditMediaTypeId] = useState<string>('')
  const [editTitle, setEditTitle] = useState<string>('')
  const [editCaption, setEditCaption] = useState<string>('')
  const [editCredit, setEditCredit] = useState<string>('')
  const [editOfficial, setEditOfficial] = useState<boolean>(true)
  const [editNsfw, setEditNsfw] = useState<boolean>(false)

  const deleteExistingMedia = async (item: ExistingMediaItem) => {
    if (!isEditMode || !editId) return
    if (deletingIds.has(item.id)) return
    setDeletingIds(prev => new Set(prev).add(item.id))
    try {
      // Remove storage object first (best-effort)
      if (item.storage_bucket && item.storage_path) {
        await supabase.storage.from(item.storage_bucket).remove([item.storage_path])
      }
      // Delete row
      const { error } = await supabase.from('media').delete().eq('id', item.id)
      if (error) throw error
      setExistingMedia(prev => prev.filter(m => m.id !== item.id))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete media'
      toast.error(message)
    } finally {
      setDeletingIds(prev => {
        const n = new Set(prev)
        n.delete(item.id)
        return n
      })
    }
  }

  const openEditMedia = (item: ExistingMediaItem) => {
    setEditMedia(item)
    setEditMediaTypeId(item.media_type_id)
    setEditTitle(item.title || '')
    setEditCaption(item.caption || '')
    setEditCredit(item.credit || '')
    // is_official / is_nsfw not loaded in ExistingMediaItem; fetch lightweight row
    ;(async () => {
      const { data } = await supabase.from('media').select('is_official, is_nsfw').eq('id', item.id).single()
      setEditOfficial(Boolean((data as any)?.is_official))
      setEditNsfw(Boolean((data as any)?.is_nsfw))
    })()
    setIsEditMediaOpen(true)
  }

  const saveEditMedia = async () => {
    if (!editMedia) return
    try {
      const { error } = await supabase
        .from('media')
        .update({
          media_type_id: editMediaTypeId || editMedia.media_type_id,
          title: editTitle || null,
          caption: editCaption || null,
          credit: editCredit || null,
          is_official: editOfficial,
          is_nsfw: editNsfw,
        })
        .eq('id', editMedia.id)
      if (error) throw error
      setExistingMedia(prev => prev.map(m => m.id === editMedia.id ? {
        ...m,
        media_type_id: editMediaTypeId || m.media_type_id,
        title: editTitle || null,
        caption: editCaption || null,
        credit: editCredit || null,
      } : m))
      setIsEditMediaOpen(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save changes'
      toast.error(message)
    }
  }

  const onBulkUploadClick = () => bulkFileInputRef.current?.click()

  const handleBulkFiles: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    // Helper to read image dimensions
    const getDims = (file: File) => new Promise<{ w: number | null; h: number | null }>((resolve) => {
      if (!file.type.startsWith('image/')) return resolve({ w: null, h: null })
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        const w = img.naturalWidth
        const h = img.naturalHeight
        URL.revokeObjectURL(url)
        resolve({ w, h })
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve({ w: null, h: null })
      }
      img.src = url
    })

    const newItems: MediaFormItem[] = []
    for (const f of files) {
      const dims = await getDims(f)
      newItems.push({
        mediaTypeId: '',
        source: 'uploaded_file',
        file: f,
        url: '',
        embedProvider: '',
        embedId: '',
        title: f.name.replace(/\.[^.]+$/, ''),
        caption: '',
        credit: '',
        isOfficial: true,
        isNsfw: false,
        mimeType: f.type || null,
        fileSizeBytes: f.size || null,
        width: dims.w,
        height: dims.h,
      })
    }
    setMediaItems(prev => [...prev, ...newItems])
    toast.success(`Added ${files.length} file(s). Select a type and Save to upload.`)
    if (bulkFileInputRef.current) bulkFileInputRef.current.value = ''
  }

  const addMediaItem = () => setMediaItems(prev => [...prev, { ...emptyMediaItem }])
  const removeMediaItem = (index: number) => setMediaItems(prev => prev.filter((_, i) => i !== index))
  const updateMediaItem = <K extends keyof MediaFormItem>(index: number, key: K, value: MediaFormItem[K]) => {
    setMediaItems(prev => prev.map((it, i) => (i === index ? { ...it, [key]: value } : it)))
  }

  const parseEmbedFromUrl = (rawUrl: string): { provider: string; id: string } | null => {
    try {
      const u = new URL(rawUrl)
      const host = u.hostname.toLowerCase()
      if (host.includes('youtube.com') || host.includes('youtu.be')) {
        // youtu.be/VIDEO or youtube.com/watch?v=VIDEO
        let vid = ''
        if (host.includes('youtu.be')) {
          vid = u.pathname.replace('/', '')
        } else {
          vid = u.searchParams.get('v') || ''
        }
        if (vid) return { provider: 'youtube', id: vid }
      }
      if (host.includes('vimeo.com')) {
        const parts = u.pathname.split('/')
        const vid = parts.filter(Boolean).pop() || ''
        if (vid) return { provider: 'vimeo', id: vid }
      }
      return null
    } catch {
      return null
    }
  }

  const onSelectFile = async (index: number, file: File | null) => {
    updateMediaItem(index, 'file', file)
    if (!file) return
    updateMediaItem(index, 'mimeType', file.type || null)
    updateMediaItem(index, 'fileSizeBytes', file.size || null)
    // If image, read dimensions
    if (file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file)
      const img = new Image()
      await new Promise<void>((resolve) => {
        img.onload = () => {
          updateMediaItem(index, 'width', img.naturalWidth)
          updateMediaItem(index, 'height', img.naturalHeight)
          URL.revokeObjectURL(objectUrl)
          resolve()
        }
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl)
          resolve()
        }
        img.src = objectUrl
      })
    } else {
      updateMediaItem(index, 'width', null)
      updateMediaItem(index, 'height', null)
    }
  }

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
      { data: mediaTypeData },
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
      supabase.from('lookups').select('*').eq('type', 'media_type').eq('is_active', true).is('deleted_at', null).order('sort_order'),
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
    setMediaTypes(mediaTypeData || [])
  }

  const openAddLookup = (type: string, label: string, target: string, index: number | null = null) => {
    setAddLookupType(type)
    setAddLookupLabel(label)
    setAddLookupName('')
    setAddLookupDescription('')
    setAfterAddTarget(target)
    setAfterAddIndex(index)
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
          if (afterAddIndex !== null) {
            setRatings(prev => prev.map((r, i) => i === afterAddIndex ? { ...r, boardId: newId } : r))
          }
          break
        case 'rating_category':
          if (afterAddIndex !== null) {
            setRatings(prev => prev.map((r, i) => i === afterAddIndex ? { ...r, categoryId: newId } : r))
          }
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
        case 'rating_region':
          if (afterAddIndex !== null) {
            setRatings(prev => prev.map((r, i) => i === afterAddIndex ? { ...r, regionId: newId } : r))
          }
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
        { data: mediaTypeData },
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
        supabase.from('lookups').select('*').eq('type', 'media_type').eq('is_active', true).is('deleted_at', null).order('sort_order'),
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
      setMediaTypes(mediaTypeData || [])
    }

    loadLookups()
  }, [supabase])

  // Load existing game data in edit mode
  useEffect(() => {
    const loadGameForEdit = async () => {
      if (!isEditMode || !editId) return
      setIsLoading(true)
      try {
        const [
          { data: game },
          { data: gGenres },
          { data: gThemes },
          { data: gModes },
          { data: gRatings },
          { data: gMedia },
        ] = await Promise.all([
          supabase
            .from('games')
            .select(
              'id, canonical_title, sort_title, status, synopsis_short, description_long, first_announced_date, first_release_date, primary_genre_id, engine_id, monetisation_model_id, official_site, press_kit_url, age_ratings_summary, business_model_notes, accessibility_summary, tech_notes, notes_internal'
            )
            .eq('id', editId)
            .single(),
          supabase.from('game_genres').select('genre_id').eq('game_id', editId),
          supabase.from('game_themes').select('theme_id').eq('game_id', editId),
          supabase.from('game_modes').select('mode_id').eq('game_id', editId),
          supabase
            .from('age_ratings')
            .select('board_id, rating_category_id, region_id, rating_date, certificate_id, interactive_elements, notes')
            .eq('game_id', editId),
          supabase
            .from('media')
            .select('id, media_type_id, title, caption, storage_bucket, storage_path, source_url, embed_provider, embed_id, mime_type, width, height, created_at')
            .eq('entity_type', 'game')
            .eq('entity_id', editId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false }),
        ])

        if (game) {
          setForm({
            canonical_title: (game as any).canonical_title || '',
            sort_title: (game as any).sort_title || '',
            status: (game as any).status || 'announced',
            synopsis_short: (game as any).synopsis_short || '',
            description_long: (game as any).description_long || '',
            first_announced_date: (game as any).first_announced_date || null,
            first_release_date: (game as any).first_release_date || null,
            primary_genre_id: (game as any).primary_genre_id || null,
            engine_id: (game as any).engine_id || null,
            monetisation_model_id: (game as any).monetisation_model_id || null,
            official_site: (game as any).official_site || '',
            press_kit_url: (game as any).press_kit_url || '',
            age_ratings_summary: (game as any).age_ratings_summary || '',
            business_model_notes: (game as any).business_model_notes || '',
            accessibility_summary: (game as any).accessibility_summary || '',
            tech_notes: (game as any).tech_notes || '',
            notes_internal: (game as any).notes_internal || '',
            coop_supported: (game as any).coop_supported || false,
            max_players_local: (game as any).max_players_local ?? null,
            max_players_online: (game as any).max_players_online ?? null,
            is_vr_supported: (game as any).is_vr_supported || false,
            is_vr_only: (game as any).is_vr_only || false,
            is_cloud_only: (game as any).is_cloud_only || false,
            crossplay_supported: (game as any).crossplay_supported || false,
            crosssave_supported: (game as any).crosssave_supported || false,
          })
        }
        setAdditionalGenreIds((gGenres || []).map((r: any) => r.genre_id))
        setThemeIds((gThemes || []).map((r: any) => r.theme_id))
        setModeIds((gModes || []).map((r: any) => r.mode_id))
        if (gRatings && gRatings.length > 0) {
          setRatings(
            gRatings.map((r: any) => ({
              boardId: r.board_id ?? '',
              categoryId: r.rating_category_id ?? '',
              regionId: r.region_id ?? '',
              date: r.rating_date ?? '',
              certificate: r.certificate_id ?? '',
              interactive: r.interactive_elements ?? '',
              notes: r.notes ?? '',
            }))
          )
        }
        // build public urls for existing media
        const withUrls: ExistingMediaItem[] = (gMedia || []).map((m: any) => {
          let publicUrl: string | null = null
          if (m.storage_bucket && m.storage_path) {
            const { data: pub } = supabase.storage.from(m.storage_bucket).getPublicUrl(m.storage_path)
            publicUrl = pub?.publicUrl || null
          } else if (m.source_url) {
            publicUrl = m.source_url
          }
          return {
            id: m.id,
            media_type_id: m.media_type_id,
            title: m.title,
            caption: m.caption,
            storage_bucket: m.storage_bucket,
            storage_path: m.storage_path,
            source_url: m.source_url,
            embed_provider: m.embed_provider,
            embed_id: m.embed_id,
            mime_type: m.mime_type,
            width: m.width,
            height: m.height,
            created_at: m.created_at,
            public_url: publicUrl,
          }
        })
        setExistingMedia(withUrls)
      } finally {
        setIsLoading(false)
      }
    }
    loadGameForEdit()
  }, [isEditMode, editId, supabase])

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
      const toNullable = (v: string | null | undefined) => (v === '' || v === undefined ? null : v)
      const payload: GameInsert = {
        canonical_title: form.canonical_title!,
        sort_title: form.sort_title!,
        status: form.status || 'announced',
        synopsis_short: form.synopsis_short || null,
        description_long: form.description_long || null,
        first_announced_date: toNullable(form.first_announced_date as string | null | undefined),
        first_release_date: toNullable(form.first_release_date as string | null | undefined),
        primary_genre_id: toNullable(form.primary_genre_id as string | null | undefined),
        engine_id: toNullable(form.engine_id as string | null | undefined),
        monetisation_model_id: toNullable(form.monetisation_model_id as string | null | undefined),
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

      let gameId: string | null = null
      if (isEditMode && editId) {
        const { error: updateError } = await supabase
          .from('games')
          .update(payload)
          .eq('id', editId)
        if (updateError) throw updateError
        gameId = editId
      } else {
        const { data: insertedGame, error: insertGameError } = await supabase
          .from('games')
          .insert(payload)
          .select('id')
          .single()
        if (insertGameError) throw insertGameError
        gameId = (insertedGame?.id as string) || null
      }

      // Insert additional genres
      if (gameId) {
        // Reset and apply m2m for genres/themes/modes in edit or add
        await supabase.from('game_genres').delete().eq('game_id', gameId)
        if (additionalGenreIds.length > 0) {
          const { error: ggError } = await supabase
            .from('game_genres')
            .insert(additionalGenreIds.map(id => ({ game_id: gameId, genre_id: id })))
          if (ggError) throw ggError
        }
      }

      // Insert themes
      if (gameId) {
        await supabase.from('game_themes').delete().eq('game_id', gameId)
        if (themeIds.length > 0) {
          const { error: gtError } = await supabase
            .from('game_themes')
            .insert(themeIds.map(id => ({ game_id: gameId, theme_id: id })))
          if (gtError) throw gtError
        }
      }

      // Insert modes
      if (gameId) {
        await supabase.from('game_modes').delete().eq('game_id', gameId)
        if (modeIds.length > 0) {
          const { error: gmError } = await supabase
            .from('game_modes')
            .insert(modeIds.map(id => ({ game_id: gameId, mode_id: id })))
          if (gmError) throw gmError
        }
      }

      // Upsert age ratings
      if (gameId) {
        // For simplicity, replace all existing with current set when editing
        await supabase.from('age_ratings').delete().eq('game_id', gameId)
        const rows = ratings
          .filter((r) => r.boardId !== '' && r.categoryId !== '')
          .map((r) => ({
            game_id: gameId,
            board_id: r.boardId,
            rating_category_id: r.categoryId,
            region_id: toNullable(r.regionId),
            rating_date: toNullable(r.date),
            certificate_id: r.certificate || null,
            interactive_elements: r.interactive || null,
            notes: r.notes || null,
          }))
        if (rows.length > 0) {
          const { error: arError } = await supabase.from('age_ratings').insert(rows)
          if (arError) throw arError
        }
      }

      // Optional: create initial edition + release
      if (!isEditMode && gameId && createInitialRelease && releasePlatformId !== '' && releaseRegionId !== '') {
        const { data: edition, error: edError } = await supabase
          .from('editions')
          .insert({
            game_id: gameId,
            edition_name: editionName || 'Standard Edition',
            release_type_id: toNullable(releaseTypeId),
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
            release_date: toNullable(releaseDate),
            distribution_format_id: toNullable(distributionFormatId),
            drm_tech_id: toNullable(drmTechId),
            storefront_id: toNullable(storefrontId),
            store_product_id: storeProductId || null,
            store_url: storeUrl || null,
          })
        if (relError) throw relError
      }

      // Media upload & insert
      if (gameId && mediaItems.length > 0) {
        const rows: MediaInsert[] = []
        for (let i = 0; i < mediaItems.length; i++) {
          const item = mediaItems[i]
          if (!item.mediaTypeId) continue
          const chosenType = mediaTypes.find(mt => mt.id === item.mediaTypeId)
          // Validate cover dimensions if applicable
          const isCover = chosenType?.slug === 'cover'
          if (isCover && item.source === 'uploaded_file') {
            if ((item.width ?? 0) < 200 || (item.height ?? 0) < 300) {
              throw new Error('Cover image must be at least 200x300 pixels')
            }
          }

          let storageBucket: string | null = null
          let storagePath: string | null = null
          let sourceUrl: string | null = null
          let embedProvider: string | null = null
          let embedId: string | null = null

          if (item.source === 'uploaded_file' && item.file) {
            const ext = item.file.name.split('.').pop() || 'bin'
            const safeTitle = (item.title || chosenType?.canonical_name || 'asset').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
            const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
            const path = `games/${gameId}/${unique}-${safeTitle}.${ext}`
            const bucketName = (chosenType?.slug === 'cover') ? 'covers' : 'media'
            const { error: upErr } = await supabase.storage.from(bucketName).upload(path, item.file, { cacheControl: '3600', upsert: false, contentType: item.file.type || undefined })
            if (upErr) {
              throw new Error(`Storage upload failed. Ensure a public bucket named "${bucketName}" exists. Details: ${upErr.message}`)
            }
            storageBucket = bucketName
            storagePath = path
            // Optional: also set a public URL for convenience
            const { data: pub } = supabase.storage.from(bucketName).getPublicUrl(path)
            sourceUrl = pub?.publicUrl || null
          } else if (item.source === 'external_url') {
            sourceUrl = item.url || null
          } else if (item.source === 'embedded') {
            // If URL provided, try to parse provider/id
            const parsed = item.url ? parseEmbedFromUrl(item.url) : null
            embedProvider = (item.embedProvider || parsed?.provider || '').toLowerCase() || null
            embedId = item.embedId || parsed?.id || null
            if (!embedProvider || !embedId) {
              throw new Error('Embedded media requires a provider and embed ID')
            }
          }

          rows.push({
            entity_type: 'game',
            entity_id: gameId,
            media_type_id: item.mediaTypeId,
            asset_source: item.source,
            title: item.title || null,
            caption: item.caption || null,
            credit: item.credit || null,
            storage_bucket: storageBucket,
            storage_path: storagePath,
            source_url: sourceUrl,
            embed_provider: embedProvider,
            embed_id: embedId,
            mime_type: item.mimeType,
            file_size_bytes: item.fileSizeBytes,
            width: item.width,
            height: item.height,
            is_official: item.isOfficial,
            is_nsfw: item.isNsfw,
          } as MediaInsert)
        }

        if (rows.length > 0) {
          const { data: inserted, error: mediaError } = await supabase.from('media').insert(rows).select('id, media_type_id, storage_bucket, storage_path, source_url')
          if (mediaError) throw mediaError
          // If a cover was added, update games.cover_asset_id to first cover
          const coverType = mediaTypes.find(mt => mt.slug === 'cover')
          const coverInserted = (inserted || []).find((r: any) => r.media_type_id === coverType?.id)
          if (coverInserted) {
            await supabase.from('games').update({ cover_asset_id: coverInserted.id }).eq('id', gameId)
          }
          // Reflect new media in UI immediately
          const appended: ExistingMediaItem[] = (inserted || []).map((m: any) => {
            const { data: pub } = (m.storage_bucket && m.storage_path)
              ? supabase.storage.from(m.storage_bucket).getPublicUrl(m.storage_path)
              : { data: { publicUrl: m.source_url } }
            return {
              id: m.id,
              media_type_id: m.media_type_id,
              title: null,
              caption: null,
              storage_bucket: m.storage_bucket || null,
              storage_path: m.storage_path || null,
              source_url: m.source_url || null,
              embed_provider: null,
              embed_id: null,
              mime_type: null,
              width: null,
              height: null,
              created_at: new Date().toISOString(),
              public_url: pub?.publicUrl || null,
            }
          })
          setExistingMedia(prev => [...appended, ...prev])
        }
      }

      toast.success(isEditMode ? 'Game updated successfully' : 'Game created successfully')
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
                      <Tabs defaultValue={defaultTab}>
                        <TabsList>
                          <TabsTrigger value="basics">Basics</TabsTrigger>
                          <TabsTrigger value="classification">Classification</TabsTrigger>
                          <TabsTrigger value="technical">Technical</TabsTrigger>
                          <TabsTrigger value="links">Links</TabsTrigger>
                          <TabsTrigger value="age_rating">Age rating</TabsTrigger>
                          <TabsTrigger value="release">Initial release</TabsTrigger>
                          <TabsTrigger value="media">Media</TabsTrigger>
                        </TabsList>

                        <TabsContent value="basics" className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="canonical_title">Game title</Label>
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
                              <Select value={form.primary_genre_id ?? ''} onValueChange={(v) => handleChange('primary_genre_id', v === '' ? null : v)}>
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
                              <Select value={form.engine_id ?? ''} onValueChange={(v) => handleChange('engine_id', v === '' ? null : v)}>
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
                              <Select value={form.monetisation_model_id ?? ''} onValueChange={(v) => handleChange('monetisation_model_id', v === '' ? null : v)}>
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
                        </TabsContent>

                        <TabsContent value="classification" className="space-y-6">
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
                        </TabsContent>

                        <TabsContent value="technical" className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="max_players_local">Max players (local)</Label>
                              <Input id="max_players_local" type="number" min={0} value={form.max_players_local ?? ''} onChange={(e) => handleChange('max_players_local', e.target.value ? Number(e.target.value) : null)} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="max_players_online">Max players (online)</Label>
                              <Input id="max_players_online" type="number" min={0} value={form.max_players_online ?? ''} onChange={(e) => handleChange('max_players_online', e.target.value ? Number(e.target.value) : null)} />
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
                        </TabsContent>

                        <TabsContent value="links" className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="official_site">Official site</Label>
                              <Input id="official_site" type="url" placeholder="https://example.com" value={form.official_site || ''} onChange={(e) => handleChange('official_site', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="press_kit_url">Press kit URL</Label>
                              <Input id="press_kit_url" type="url" placeholder="https://example.com/press" value={form.press_kit_url || ''} onChange={(e) => handleChange('press_kit_url', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="age_ratings_summary">Age ratings summary</Label>
                              <Input id="age_ratings_summary" value={form.age_ratings_summary || ''} onChange={(e) => handleChange('age_ratings_summary', e.target.value)} />
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="age_rating" className="space-y-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base">Age Ratings</CardTitle>
                                <CardDescription>Add ratings from multiple boards (e.g., PEGI, ESRB).</CardDescription>
                              </div>
                              <Button type="button" onClick={() => setRatings((prev) => [...prev, emptyRating])}>Add rating</Button>
                            </div>
                            {ratings.map((r, index) => (
                              <div key={index} className="space-y-3 rounded-md border p-3">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label>Board</Label>
                                      <Button type="button" size="sm" variant="outline" onClick={() => openAddLookup('age_rating_board', 'Rating board', 'rating_board', index)}>Add</Button>
                                    </div>
                                    <Select value={r.boardId} onValueChange={(v) => setRatings(prev => prev.map((it, i) => i === index ? { ...it, boardId: v } : it))}>
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
                                      <Button type="button" size="sm" variant="outline" onClick={() => openAddLookup('age_rating_category', 'Rating category', 'rating_category', index)}>Add</Button>
                                    </div>
                                    <Select value={r.categoryId} onValueChange={(v) => setRatings(prev => prev.map((it, i) => i === index ? { ...it, categoryId: v } : it))}>
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
                                      <Button type="button" size="sm" variant="outline" onClick={() => openAddLookup('region', 'Region', 'rating_region', index)}>Add</Button>
                                    </div>
                                    <Select value={r.regionId} onValueChange={(v) => setRatings(prev => prev.map((it, i) => i === index ? { ...it, regionId: v } : it))}>
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select region" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {regions.map(rr => (
                                          <SelectItem key={rr.id} value={rr.id}>{rr.canonical_name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`rating_date_${index}`}>Rating date</Label>
                                    <Input id={`rating_date_${index}`} type="date" value={r.date} onChange={(e) => setRatings(prev => prev.map((it, i) => i === index ? { ...it, date: e.target.value } : it))} />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`certificate_${index}`}>Certificate ID</Label>
                                    <Input id={`certificate_${index}`} value={r.certificate} onChange={(e) => setRatings(prev => prev.map((it, i) => i === index ? { ...it, certificate: e.target.value } : it))} />
                                  </div>
                                  <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor={`interactive_${index}`}>Interactive elements</Label>
                                    <Input id={`interactive_${index}`} value={r.interactive} onChange={(e) => setRatings(prev => prev.map((it, i) => i === index ? { ...it, interactive: e.target.value } : it))} />
                                  </div>
                                  <div className="space-y-2 md:col-span-3">
                                    <Label htmlFor={`notes_${index}`}>Notes</Label>
                                    <Textarea id={`notes_${index}`} value={r.notes} onChange={(e) => setRatings(prev => prev.map((it, i) => i === index ? { ...it, notes: e.target.value } : it))} />
                                  </div>
                                </div>
                                <div className="flex justify-end">
                                  <Button type="button" variant="outline" onClick={() => setRatings(prev => prev.filter((_, i) => i !== index))} disabled={ratings.length <= 1}>Remove</Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="release" className="space-y-6">
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
                                    <Select value={releaseTypeId} onValueChange={setReleaseTypeId}>
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
                                    <Input id="release_date" type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label>Platform</Label>
                                      <Button type="button" size="sm" variant="outline" onClick={() => openAddLookup('platform', 'Platform', 'platform')}>Add</Button>
                                    </div>
                                    <Select value={releasePlatformId} onValueChange={setReleasePlatformId}>
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
                                    <Select value={releaseRegionId} onValueChange={setReleaseRegionId}>
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
                                    <Select value={distributionFormatId} onValueChange={setDistributionFormatId}>
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
                                    <Select value={drmTechId} onValueChange={setDrmTechId}>
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
                                    <Select value={storefrontId} onValueChange={setStorefrontId}>
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
                        </TabsContent>

                        <TabsContent value="media" className="space-y-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base">Media</CardTitle>
                                <CardDescription>Add covers, screenshots, trailers, logos, and artwork for this game.</CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button type="button" variant="outline" onClick={onBulkUploadClick}>Bulk upload</Button>
                                <input ref={bulkFileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleBulkFiles} />
                                <Button type="button" onClick={addMediaItem}>Add media</Button>
                              </div>
                            </div>

                            {mediaItems.length === 0 && existingMedia.length === 0 && (
                              <div className="text-sm text-muted-foreground">No media added yet.</div>
                            )}

                            {existingMedia.length > 0 && (
                              <div className="space-y-6">
                                {(() => {
                                  const typeById = new Map(mediaTypes.map(mt => [mt.id, mt]))
                                  const bySlug: Record<string, ExistingMediaItem[]> = {}
                                  for (const m of existingMedia) {
                                    const slug = typeById.get(m.media_type_id)?.slug || 'other'
                                    if (!bySlug[slug]) bySlug[slug] = []
                                    bySlug[slug].push(m)
                                  }

                                  const sections: { slug: string; title: string }[] = [
                                    { slug: 'cover', title: 'Cover' },
                                    { slug: 'screenshot', title: 'Screenshots' },
                                    { slug: 'trailer', title: 'Trailers' },
                                    { slug: 'logo', title: 'Logos' },
                                    { slug: 'artwork', title: 'Artwork' },
                                  ]

                                  return (
                                    <>
                                      {sections.map(sec => (
                                        bySlug[sec.slug]?.length ? (
                                          <div key={sec.slug} className="space-y-3">
                                            <div className="text-sm font-medium">{sec.title}</div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                              {bySlug[sec.slug].map((m) => {
                                                const isImage = !!m.public_url && (m.mime_type?.startsWith('image/') ?? true)
                                                const aspect = sec.slug === 'cover' ? '2 / 3' : sec.slug === 'screenshot' ? '19 / 9' : undefined
                                                return (
                                                  <div key={m.id} className="rounded-md border p-3 space-y-2">
                                                    {isImage && m.public_url ? (
                                                      <div style={{ aspectRatio: aspect }} className={`w-full overflow-hidden rounded ${aspect ? '' : 'h-40'}`}>
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={m.public_url} alt={m.title || ''} className="h-full w-full object-cover" />
                                                      </div>
                                                    ) : m.public_url ? (
                                                      <a href={m.public_url} target="_blank" rel="noreferrer" className="text-primary text-sm underline">Open</a>
                                                    ) : m.embed_provider && m.embed_id ? (
                                                      <div className="text-xs text-muted-foreground">Embedded: {m.embed_provider} ({m.embed_id})</div>
                                                    ) : (
                                                      <div className="text-xs text-muted-foreground">No preview</div>
                                                    )}
                                                    <div className="flex items-center justify-between gap-2">
                                                      <div className="min-w-0">
                                                        <div className="text-sm font-medium truncate">{m.title || '(untitled)'}</div>
                                                        {m.caption && <div className="text-xs text-muted-foreground truncate">{m.caption}</div>}
                                                      </div>
                                                      <div className="flex items-center gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => openEditMedia(m)}>Edit</Button>
                                                        <Button variant="outline" size="sm" onClick={() => deleteExistingMedia(m)} disabled={deletingIds.has(m.id)}>Delete</Button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          </div>
                                        ) : null
                                      ))}
                                    </>
                                  )
                                })()}
                              </div>
                            )}

                            {mediaItems.map((m, index) => (
                              <div key={index} className="space-y-3 rounded-md border p-3">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={m.mediaTypeId} onValueChange={(v) => updateMediaItem(index, 'mediaTypeId', v)}>
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select media type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {mediaTypes.map(mt => (
                                          <SelectItem key={mt.id} value={mt.id}>{mt.canonical_name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Source</Label>
                                    <Select value={m.source} onValueChange={(v) => updateMediaItem(index, 'source', v as MediaSource)}>
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select source" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="uploaded_file">Upload file</SelectItem>
                                        <SelectItem value="external_url">Link URL</SelectItem>
                                        <SelectItem value="embedded">Embed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  {m.source === 'uploaded_file' && (
                                    <div className="space-y-2 md:col-span-2">
                                      <Label>File</Label>
                                      <Input type="file" accept="image/*,video/*" onChange={(e) => onSelectFile(index, e.target.files?.[0] || null)} />
                                      {(() => {
                                        const chosenType = mediaTypes.find(mt => mt.id === m.mediaTypeId)
                                        const isCover = chosenType?.slug === 'cover'
                                        if (isCover && m.width !== null && m.height !== null && (m.width < 200 || m.height < 300)) {
                                          return <div className="text-xs text-destructive">Cover must be at least 200x300px. Selected: {m.width}x{m.height}</div>
                                        }
                                        return null
                                      })()}
                                    </div>
                                  )}
                                  {m.source === 'external_url' && (
                                    <div className="space-y-2 md:col-span-2">
                                      <Label>URL</Label>
                                      <Input type="url" placeholder="https://example.com/image-or-video" value={m.url} onChange={(e) => updateMediaItem(index, 'url', e.target.value)} />
                                    </div>
                                  )}
                                  {m.source === 'embedded' && (
                                    <div className="space-y-2 md:col-span-2">
                                      <Label>Embed URL (YouTube/Vimeo)</Label>
                                      <Input type="url" placeholder="https://youtu.be/VIDEO" value={m.url} onChange={(e) => updateMediaItem(index, 'url', e.target.value)} />
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-2">
                                          <Label>Provider</Label>
                                          <Input placeholder="youtube | vimeo" value={m.embedProvider} onChange={(e) => updateMediaItem(index, 'embedProvider', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Embed ID</Label>
                                          <Input placeholder="video id" value={m.embedId} onChange={(e) => updateMediaItem(index, 'embedId', e.target.value)} />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <Label>Title</Label>
                                    <Input value={m.title} onChange={(e) => updateMediaItem(index, 'title', e.target.value)} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Caption</Label>
                                    <Input value={m.caption} onChange={(e) => updateMediaItem(index, 'caption', e.target.value)} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Credit</Label>
                                    <Input value={m.credit} onChange={(e) => updateMediaItem(index, 'credit', e.target.value)} />
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-4">
                                  <label className="flex items-center gap-2 text-sm">
                                    <Checkbox checked={m.isOfficial} onCheckedChange={(v) => updateMediaItem(index, 'isOfficial', Boolean(v))} />
                                    <span>Official</span>
                                  </label>
                                  <label className="flex items-center gap-2 text-sm">
                                    <Checkbox checked={m.isNsfw} onCheckedChange={(v) => updateMediaItem(index, 'isNsfw', Boolean(v))} />
                                    <span>NSFW</span>
                                  </label>
                                </div>
                                <div className="flex justify-end">
                                  <Button type="button" variant="outline" onClick={() => removeMediaItem(index)}>Remove</Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          {/* Edit Media Dialog */}
                          {isEditMediaOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                              <div className="w-full max-w-lg rounded-md bg-background p-4 shadow-lg">
                                <div className="mb-3 flex items-center justify-between">
                                  <div className="text-base font-semibold">Edit media</div>
                                  <Button variant="ghost" size="sm" onClick={() => setIsEditMediaOpen(false)}>Close</Button>
                                </div>
                                <div className="space-y-3">
                                  <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={editMediaTypeId} onValueChange={setEditMediaTypeId}>
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select media type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {mediaTypes.map((mt) => (
                                          <SelectItem key={mt.id} value={mt.id}>{mt.canonical_name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                      <Label>Title</Label>
                                      <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Credit</Label>
                                      <Input value={editCredit} onChange={(e) => setEditCredit(e.target.value)} />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Caption</Label>
                                    <Textarea value={editCaption} onChange={(e) => setEditCaption(e.target.value)} />
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-sm">
                                      <Checkbox checked={editOfficial} onCheckedChange={(v) => setEditOfficial(Boolean(v))} />
                                      <span>Official</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                      <Checkbox checked={editNsfw} onCheckedChange={(v) => setEditNsfw(Boolean(v))} />
                                      <span>NSFW</span>
                                    </label>
                                  </div>
                                  <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="outline" onClick={() => setIsEditMediaOpen(false)}>Cancel</Button>
                                    <Button onClick={saveEditMedia}>Save</Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>

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


