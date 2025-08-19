"use client"

import * as React from "react"
import Link from "next/link"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  VisibilityState,
  useReactTable,
} from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IconLayoutColumns, IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@tabler/icons-react"
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export type GameRow = {
  id: string
  canonical_title: string
  status: string
  first_release_date: string | null
}

const columns: ColumnDef<GameRow>[] = [
  {
    accessorKey: "canonical_title",
    header: "Title",
    cell: ({ row }) => {
      const g = row.original
      return (
        <Link href={`/dashboard/games/new?id=${g.id}`} className="text-primary hover:underline">
          {g.canonical_title}
        </Link>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="capitalize">
        {row.original.status.replaceAll("_", " ")}
      </Badge>
    ),
  },
  {
    accessorKey: "first_release_date",
    header: "First release",
    cell: ({ row }) => row.original.first_release_date ?? "-",
  },
]

export function GamesDataTable({ games }: { games: GameRow[] }) {
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 10 })
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [isParsing, setIsParsing] = React.useState(false)
  const [uploadInfo, setUploadInfo] = React.useState<string>("")

  const table = useReactTable({
    data: games,
    columns,
    state: { sorting, columnVisibility, columnFilters, pagination, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
  })

  const templateHeaders = [
    'canonical_title',
    'sort_title',
    'status',
    'synopsis_short',
    'description_long',
    'first_announced_date',
    'first_release_date',
    'primary_genre_slug',
    'additional_genre_slugs',
    'engine_slug',
    'monetisation_model_slug',
    'coop_supported',
    'max_players_local',
    'max_players_online',
    'is_vr_supported',
    'is_vr_only',
    'is_cloud_only',
    'crossplay_supported',
    'crosssave_supported',
    'official_site',
    'press_kit_url',
    'age_ratings_summary',
    'business_model_notes',
    'accessibility_summary',
    'tech_notes',
    'notes_internal',
  ] as const

  const toCsv = (headers: readonly string[]): string => headers.join(',') + '\n'

  const downloadTemplate = () => {
    const csv = toCsv(templateHeaders)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'games_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Minimal CSV parser with quoted-field support
  const parseCsv = (text: string): Record<string, string>[] => {
    const lines: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      const next = text[i + 1]
      if (ch === '"') {
        if (inQuotes && next === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === '\n' && !inQuotes) {
        lines.push(current)
        current = ''
      } else {
        current += ch
      }
    }
    if (current.length > 0) lines.push(current)

    const splitLine = (line: string): string[] => {
      const fields: string[] = []
      let buf = ''
      let quoted = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        const next = line[i + 1]
        if (ch === '"') {
          if (quoted && next === '"') {
            buf += '"'
            i++
          } else {
            quoted = !quoted
          }
        } else if (ch === ',' && !quoted) {
          fields.push(buf)
          buf = ''
        } else {
          buf += ch
        }
      }
      fields.push(buf)
      return fields
    }

    if (lines.length === 0) return []
    const headerFields = splitLine(lines[0]).map(h => h.trim())
    const records: Record<string, string>[] = []
    for (let li = 1; li < lines.length; li++) {
      if (!lines[li].trim()) continue
      const values = splitLine(lines[li])
      const record: Record<string, string> = {}
      for (let ci = 0; ci < headerFields.length; ci++) {
        record[headerFields[ci]] = (values[ci] ?? '').trim()
      }
      records.push(record)
    }
    return records
  }

  const onUploadTemplate = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setIsParsing(true)
      const text = await file.text()
      const rows = parseCsv(text)
      if (rows.length === 0) {
        toast.error('No rows found in CSV')
        return
      }
      // basic validation against template
      const missingHeaders = templateHeaders.filter(h => !(h in rows[0]))
      if (missingHeaders.length > 0) {
        toast.error(`Missing columns: ${missingHeaders.join(', ')}`)
        return
      }
      // Collect slugs for lookup resolution
      const allPrimaryGenreSlugs = new Set<string>()
      const allAdditionalGenreSlugs = new Set<string>()
      const allEngineSlugs = new Set<string>()
      const allMonetisationSlugs = new Set<string>()
      for (const r of rows) {
        if (r.primary_genre_slug) allPrimaryGenreSlugs.add(r.primary_genre_slug.toLowerCase())
        if (r.additional_genre_slugs) r.additional_genre_slugs.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).forEach(s => allAdditionalGenreSlugs.add(s))
        if (r.engine_slug) allEngineSlugs.add(r.engine_slug.toLowerCase())
        if (r.monetisation_model_slug) allMonetisationSlugs.add(r.monetisation_model_slug.toLowerCase())
      }
      const supabase = createClient()
      const [genresRes, enginesRes, monetRes] = await Promise.all([
        supabase.from('lookups').select('id, slug').in('type', ['genre']).in('slug', Array.from(new Set([...allPrimaryGenreSlugs, ...allAdditionalGenreSlugs]))),
        supabase.from('lookups').select('id, slug').eq('type', 'engine').in('slug', Array.from(allEngineSlugs)),
        supabase.from('lookups').select('id, slug').eq('type', 'monetisation_model').in('slug', Array.from(allMonetisationSlugs)),
      ])
      const genreMap = new Map<string, string>((genresRes.data || []).map((g) => [String(g.slug).toLowerCase(), String(g.id)]))
      const engineMap = new Map<string, string>((enginesRes.data || []).map((g) => [String(g.slug).toLowerCase(), String(g.id)]))
      const monetMap = new Map<string, string>((monetRes.data || []).map((g) => [String(g.slug).toLowerCase(), String(g.id)]))

      let unresolved = 0
      const payloads = rows.map((r) => {
        const primaryGenreId = r.primary_genre_slug ? genreMap.get(r.primary_genre_slug.toLowerCase()) ?? null : null
        const additionalGenreIds = r.additional_genre_slugs
          ? r.additional_genre_slugs.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).map(s => genreMap.get(s)).filter(Boolean) as string[]
          : []
        const engineId = r.engine_slug ? engineMap.get(r.engine_slug.toLowerCase()) ?? null : null
        const monetId = r.monetisation_model_slug ? monetMap.get(r.monetisation_model_slug.toLowerCase()) ?? null : null
        if (r.primary_genre_slug && !primaryGenreId) unresolved++
        if (r.engine_slug && !engineId) unresolved++
        if (r.monetisation_model_slug && !monetId) unresolved++
        return {
          game: {
            canonical_title: r.canonical_title,
            sort_title: r.sort_title || r.canonical_title,
            status: (r.status || 'announced') as any,
            synopsis_short: r.synopsis_short || null,
            description_long: r.description_long || null,
            first_announced_date: r.first_announced_date || null,
            first_release_date: r.first_release_date || null,
            primary_genre_id: primaryGenreId,
            engine_id: engineId,
            monetisation_model_id: monetId,
            coop_supported: String(r.coop_supported).toLowerCase() === 'true',
            max_players_local: r.max_players_local ? Number(r.max_players_local) : null,
            max_players_online: r.max_players_online ? Number(r.max_players_online) : null,
            is_vr_supported: String(r.is_vr_supported).toLowerCase() === 'true',
            is_vr_only: String(r.is_vr_only).toLowerCase() === 'true',
            is_cloud_only: String(r.is_cloud_only).toLowerCase() === 'true',
            crossplay_supported: String(r.crossplay_supported).toLowerCase() === 'true',
            crosssave_supported: String(r.crosssave_supported).toLowerCase() === 'true',
            official_site: r.official_site || null,
            press_kit_url: r.press_kit_url || null,
            age_ratings_summary: r.age_ratings_summary || null,
            business_model_notes: r.business_model_notes || null,
            accessibility_summary: r.accessibility_summary || null,
            tech_notes: r.tech_notes || null,
            notes_internal: r.notes_internal || null,
          },
          additionalGenreIds,
        }
      })

      setUploadInfo(`Parsed ${rows.length} row(s). ${unresolved > 0 ? `${unresolved} unresolved lookup(s).` : 'All lookups resolved.'}`)
      console.log('CSV payloads (preview only, not inserted):', payloads)
      toast.success('Template parsed successfully')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to parse template'
      toast.error(message)
    } finally {
      setIsParsing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-4 sm:flex-row sm:items-center sm:gap-0">
        <CardTitle>Games</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate} disabled={isParsing}>
            Download template
          </Button>
          <input ref={fileInputRef} type="file" accept="text/csv,.csv" className="hidden" onChange={handleFileChange} />
          <Button variant="outline" size="sm" onClick={onUploadTemplate} disabled={isParsing}>
            Upload template
          </Button>
          <Select
            value={((table.getColumn("status")?.getFilterValue() as string | undefined) ?? "all")}
            onValueChange={(v) => table.getColumn("status")?.setFilterValue(v === "all" ? undefined : v)}
          >
            <SelectTrigger className="h-8 w-[160px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="announced">Announced</SelectItem>
              <SelectItem value="in_development">In development</SelectItem>
              <SelectItem value="released">Released</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="delisted">Delisted</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Filter titles..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-8 w-[220px]"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {table
                .getAllColumns()
                .filter((c) => c.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id.replaceAll("_", " ")}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {uploadInfo && (
          <div className="mb-3 text-sm text-muted-foreground">{uploadInfo}</div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} result(s)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="hidden h-8 w-8 p-0 sm:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden h-8 w-8 p-0 sm:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


