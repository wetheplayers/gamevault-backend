# GameVault API Documentation

## Overview
This document defines the API structure for the GameVault backoffice, built on Supabase with Row Level Security.

## Authentication

### Supabase Auth Endpoints
All authentication is handled through Supabase Auth with the following methods:

```typescript
// Authentication client setup
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
```

### Auth Methods

#### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      username: 'uniqueusername',
      display_name: 'Display Name'
    }
  }
})
```

#### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
```

#### Sign Out
```typescript
const { error } = await supabase.auth.signOut()
```

#### Get Session
```typescript
const { data: { session } } = await supabase.auth.getSession()
```

## Database API

### Games Endpoints

#### List Games
```typescript
// GET /rest/v1/games
const { data, error } = await supabase
  .from('games')
  .select(`
    *,
    primary_genre:lookups!primary_genre_id(canonical_name, slug),
    game_genres(
      genre:lookups(canonical_name, slug)
    ),
    game_themes(
      theme:lookups(canonical_name, slug)
    )
  `)
  .eq('deleted_at', null)
  .order('first_release_date', { ascending: false })
  .range(0, 19)

// Response
{
  data: [
    {
      id: "uuid",
      canonical_title: "Game Title",
      status: "released",
      primary_genre: {
        canonical_name: "Action",
        slug: "action"
      },
      game_genres: [
        {
          genre: {
            canonical_name: "Adventure",
            slug: "adventure"
          }
        }
      ],
      // ... other fields
    }
  ]
}
```

#### Get Single Game
```typescript
// GET /rest/v1/games?id=eq.{uuid}
const { data, error } = await supabase
  .from('games')
  .select(`
    *,
    editions(
      *,
      releases(
        *,
        platform:lookups!platform_id(canonical_name),
        region:lookups!region_id(canonical_name)
      )
    ),
    media(*)
  `)
  .eq('id', gameId)
  .single()
```

#### Create Game
```typescript
// POST /rest/v1/games
const { data, error } = await supabase
  .from('games')
  .insert({
    canonical_title: "New Game",
    sort_title: "new game",
    status: "announced",
    synopsis_short: "Short description",
    description_long: "Long description",
    primary_genre_id: "genre-uuid"
  })
  .select()
  .single()
```

#### Update Game
```typescript
// PATCH /rest/v1/games?id=eq.{uuid}
const { data, error } = await supabase
  .from('games')
  .update({
    canonical_title: "Updated Title",
    updated_at: new Date().toISOString()
  })
  .eq('id', gameId)
  .select()
  .single()
```

#### Soft Delete Game
```typescript
// PATCH /rest/v1/games?id=eq.{uuid}
const { data, error } = await supabase
  .from('games')
  .update({
    deleted_at: new Date().toISOString(),
    deleted_by: userId
  })
  .eq('id', gameId)
```

### Search & Filtering

#### Full-Text Search
```typescript
// Search games by title and description
const { data, error } = await supabase
  .from('games')
  .select()
  .textSearch('canonical_title', searchTerm, {
    type: 'websearch',
    config: 'english'
  })
```

#### Complex Filtering
```typescript
const { data, error } = await supabase
  .from('games')
  .select()
  .in('status', ['released', 'in_development'])
  .gte('first_release_date', '2023-01-01')
  .lte('first_release_date', '2023-12-31')
  .contains('game_genres', [genreId])
  .order('first_release_date', { ascending: false })
```

### Lookups Management

#### Get All Lookups by Type
```typescript
const { data, error } = await supabase
  .from('lookups')
  .select('*, lookup_aliases(*)')
  .eq('type', 'platform')
  .eq('is_active', true)
  .is('deleted_at', null)
  .order('sort_order')
```

#### Create Lookup
```typescript
const { data, error } = await supabase
  .from('lookups')
  .insert({
    type: 'genre',
    canonical_name: 'New Genre',
    slug: 'new-genre',
    description: 'Description',
    sort_order: 10
  })
  .select()
  .single()
```

### Media Management

#### Upload Media File
```typescript
// Upload to Supabase Storage
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('covers')
  .upload(`games/${gameId}/${fileName}`, file, {
    contentType: file.type,
    upsert: false
  })

// Create media record
const { data, error } = await supabase
  .from('media')
  .insert({
    entity_type: 'game',
    entity_id: gameId,
    media_type_id: mediaTypeId,
    title: 'Cover Image',
    asset_source: 'uploaded_file',
    storage_bucket: 'covers',
    storage_path: uploadData.path,
    mime_type: file.type,
    file_size_bytes: file.size
  })
  .select()
  .single()
```

#### Get Media URL
```typescript
const { data } = supabase.storage
  .from('covers')
  .getPublicUrl(filePath)

// URL format: https://[project].supabase.co/storage/v1/object/public/covers/[path]
```

### User Management

#### Get User Profile
```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', userId)
  .single()
```

#### Update User Role (Admin only)
```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .update({ role: 'moderator' })
  .eq('id', userId)
  .select()
  .single()
```

### Real-time Subscriptions

#### Subscribe to Game Changes
```typescript
const subscription = supabase
  .channel('games-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'games'
    },
    (payload) => {
      console.log('Change received!', payload)
      // Handle insert, update, or delete
    }
  )
  .subscribe()

// Cleanup
subscription.unsubscribe()
```

#### Subscribe to Specific Game
```typescript
const subscription = supabase
  .channel(`game-${gameId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'games',
      filter: `id=eq.${gameId}`
    },
    (payload) => {
      console.log('Game updated!', payload.new)
    }
  )
  .subscribe()
```

### Batch Operations

#### Bulk Insert
```typescript
const { data, error } = await supabase
  .from('game_genres')
  .insert([
    { game_id: gameId, genre_id: genreId1 },
    { game_id: gameId, genre_id: genreId2 },
    { game_id: gameId, genre_id: genreId3 }
  ])
```

#### Bulk Update
```typescript
const { data, error } = await supabase
  .from('games')
  .update({ status: 'released' })
  .in('id', gameIds)
```

#### Bulk Delete
```typescript
const { data, error } = await supabase
  .from('game_genres')
  .delete()
  .eq('game_id', gameId)
```

## RPC Functions

### Custom Database Functions

#### Search Games with Ranking
```typescript
// Call custom function
const { data, error } = await supabase
  .rpc('search_games', {
    search_term: 'zelda',
    limit_count: 20
  })

// Database function
create or replace function public.search_games(
  search_term text,
  limit_count integer default 20
)
returns table (
  id uuid,
  canonical_title text,
  rank real
)
language sql
security invoker
set search_path = ''
as $$
  select 
    id,
    canonical_title,
    ts_rank(
      to_tsvector('english', canonical_title || ' ' || coalesce(synopsis_short, '')),
      websearch_to_tsquery('english', search_term)
    ) as rank
  from public.games
  where 
    to_tsvector('english', canonical_title || ' ' || coalesce(synopsis_short, '')) @@
    websearch_to_tsquery('english', search_term)
    and deleted_at is null
  order by rank desc
  limit limit_count;
$$;
```

#### Get User Permissions
```typescript
const { data, error } = await supabase
  .rpc('get_user_permissions')

// Returns array of permissions for current user
```

#### Refresh Statistics
```typescript
const { data, error } = await supabase
  .rpc('refresh_game_statistics')
```

## Edge Functions

### Import from External API
```typescript
// POST /functions/v1/import-igdb
const response = await fetch(
  `${supabaseUrl}/functions/v1/import-igdb`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      igdb_id: 1942,
      import_media: true
    })
  }
)

const data = await response.json()
```

### Generate Report
```typescript
// POST /functions/v1/generate-report
const response = await fetch(
  `${supabaseUrl}/functions/v1/generate-report`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      report_type: 'monthly_summary',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      format: 'pdf'
    })
  }
)

const blob = await response.blob()
// Handle PDF download
```

## Error Handling

### Standard Error Response
```typescript
interface ApiError {
  code: string
  message: string
  details?: any
  hint?: string
}

// Handle Supabase errors
if (error) {
  if (error.code === '23505') {
    // Unique constraint violation
    return {
      code: 'DUPLICATE_ENTRY',
      message: 'This item already exists',
      details: error.details
    }
  }
  
  if (error.code === 'PGRST116') {
    // RLS policy violation
    return {
      code: 'PERMISSION_DENIED',
      message: 'You do not have permission to perform this action'
    }
  }
}
```

### Common Error Codes
- `23505`: Unique constraint violation
- `23503`: Foreign key violation
- `23502`: Not null violation
- `PGRST116`: RLS policy violation
- `PGRST301`: Row not found
- `22P02`: Invalid text representation

## Rate Limiting

### API Rate Limits
- Anonymous: 100 requests per minute
- Authenticated: 1000 requests per minute
- Admin: 5000 requests per minute

### Implementation
```typescript
// Using Supabase Edge Functions
export async function rateLimiter(req: Request) {
  const clientIp = req.headers.get('x-forwarded-for')
  const key = `rate_limit:${clientIp}`
  
  // Check rate limit in Redis/Memory
  const count = await getRequestCount(key)
  
  if (count > RATE_LIMIT) {
    return new Response('Rate limit exceeded', { status: 429 })
  }
  
  await incrementRequestCount(key)
  // Continue with request
}
```

## Pagination

### Cursor-based Pagination
```typescript
// First page
const { data: firstPage, error } = await supabase
  .from('games')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(20)

// Next page using cursor
const lastItem = firstPage[firstPage.length - 1]
const { data: nextPage, error } = await supabase
  .from('games')
  .select('*')
  .order('created_at', { ascending: false })
  .lt('created_at', lastItem.created_at)
  .limit(20)
```

### Offset-based Pagination
```typescript
const page = 1
const pageSize = 20

const { data, count, error } = await supabase
  .from('games')
  .select('*', { count: 'exact' })
  .range((page - 1) * pageSize, page * pageSize - 1)

// Response includes total count for pagination UI
const totalPages = Math.ceil(count / pageSize)
```

## Caching Strategy

### Client-side Caching with React Query
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Fetch games with caching
function useGames() {
  return useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Optimistic updates
function useUpdateGame() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('games')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['games'] })
      
      // Snapshot previous value
      const previousGames = queryClient.getQueryData(['games'])
      
      // Optimistically update
      queryClient.setQueryData(['games'], old => 
        old.map(game => game.id === id ? { ...game, ...updates } : game)
      )
      
      return { previousGames }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['games'], context.previousGames)
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['games'] })
    }
  })
}
```

## TypeScript Types

### Database Types Generation
```bash
# Generate types from database
npx supabase gen types typescript --project-id [project-id] > types/database.types.ts
```

### Example Generated Types
```typescript
export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: string
          canonical_title: string
          sort_title: string
          status: 'announced' | 'in_development' | 'released' | 'cancelled' | 'delisted'
          created_at: string
          updated_at: string
          // ... other fields
        }
        Insert: {
          id?: string
          canonical_title: string
          sort_title: string
          status?: 'announced' | 'in_development' | 'released' | 'cancelled' | 'delisted'
          // ... other fields
        }
        Update: {
          canonical_title?: string
          sort_title?: string
          status?: 'announced' | 'in_development' | 'released' | 'cancelled' | 'delisted'
          // ... other fields
        }
      }
      // ... other tables
    }
    Functions: {
      search_games: {
        Args: {
          search_term: string
          limit_count?: number
        }
        Returns: {
          id: string
          canonical_title: string
          rank: number
        }[]
      }
      // ... other functions
    }
  }
}
```

## API Client Class

### TypeScript Implementation
```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './types/database.types'

export class GameVaultAPI {
  private supabase: SupabaseClient<Database>
  
  constructor(url: string, key: string) {
    this.supabase = createClient<Database>(url, key)
  }
  
  // Games
  async getGames(options?: {
    status?: string[]
    genres?: string[]
    limit?: number
    offset?: number
  }) {
    let query = this.supabase
      .from('games')
      .select('*')
      .is('deleted_at', null)
    
    if (options?.status) {
      query = query.in('status', options.status)
    }
    
    if (options?.genres) {
      query = query.contains('game_genres', options.genres)
    }
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 20) - 1
      )
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data
  }
  
  async getGame(id: string) {
    const { data, error } = await this.supabase
      .from('games')
      .select(`
        *,
        editions(*),
        media(*),
        game_genres(genre:lookups(*))
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }
  
  async createGame(game: Database['public']['Tables']['games']['Insert']) {
    const { data, error } = await this.supabase
      .from('games')
      .insert(game)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
  
  async updateGame(
    id: string,
    updates: Database['public']['Tables']['games']['Update']
  ) {
    const { data, error } = await this.supabase
      .from('games')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
  
  async deleteGame(id: string) {
    const { error } = await this.supabase
      .from('games')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
    
    if (error) throw error
  }
  
  // Auth
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  }
  
  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    if (error) throw error
  }
  
  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser()
    return user
  }
  
  // Storage
  async uploadMedia(
    bucket: string,
    path: string,
    file: File
  ) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file)
    
    if (error) throw error
    return data
  }
  
  getMediaUrl(bucket: string, path: string) {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    
    return data.publicUrl
  }
}

// Usage
const api = new GameVaultAPI(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const games = await api.getGames({
  status: ['released'],
  limit: 20
})
```

## Testing

### Unit Tests
```typescript
import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll } from 'vitest'

describe('Games API', () => {
  let supabase
  
  beforeAll(() => {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    )
  })
  
  it('should create a game', async () => {
    const { data, error } = await supabase
      .from('games')
      .insert({
        canonical_title: 'Test Game',
        sort_title: 'test game',
        status: 'announced'
      })
      .select()
      .single()
    
    expect(error).toBeNull()
    expect(data).toHaveProperty('id')
    expect(data.canonical_title).toBe('Test Game')
  })
  
  it('should enforce RLS policies', async () => {
    // Test as anonymous user
    const anonClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    )
    
    const { data, error } = await anonClient
      .from('games')
      .insert({
        canonical_title: 'Unauthorised Game',
        sort_title: 'unauthorised game',
        status: 'announced'
      })
    
    expect(error).not.toBeNull()
    expect(error.code).toBe('42501') // Insufficient privilege
  })
})
```

## Monitoring

### API Metrics to Track
- Request count by endpoint
- Response times (p50, p95, p99)
- Error rates by type
- Database query performance
- Storage usage
- Active user sessions
- Rate limit hits

### Implementation with Supabase
```sql
-- Create metrics table
create table public.api_metrics (
  id uuid default gen_random_uuid() primary key,
  endpoint text not null,
  method varchar(10) not null,
  status_code integer not null,
  response_time_ms integer not null,
  user_id uuid references auth.users(id),
  created_at timestamptz default now() not null
);

-- Index for queries
create index idx_api_metrics_created_at on public.api_metrics(created_at desc);
create index idx_api_metrics_endpoint on public.api_metrics(endpoint);
```
