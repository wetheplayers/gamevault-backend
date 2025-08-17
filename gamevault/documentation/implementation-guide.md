# GameVault Implementation Guide

## Overview
This guide provides a practical roadmap for implementing the GameVault backoffice system using the documentation provided.

## Documentation Created

### 1. Database Documentation
- **[database-schema.md](./database-schema.md)**: Complete PostgreSQL schema with Supabase best practices
- **[rls-policies.md](./rls-policies.md)**: Row Level Security implementation
- **[migration-strategy.md](./migration-strategy.md)**: Phased migration approach
- **Initial Migration**: `/supabase/migrations/20240101000001_initial_setup.sql`

### 2. Access Control Documentation
- **[rbac-matrix.md](./rbac-matrix.md)**: Complete permissions matrix for all roles
- Four user roles: Superadmin, Admin, Moderator, User
- Granular permissions for every system action

### 3. Application Documentation
- **[backoffice-screens.md](./backoffice-screens.md)**: 60+ screen specifications
- **[api-documentation.md](./api-documentation.md)**: Complete API reference
- ShadCN component requirements
- Mobile responsive designs

### 4. Domain Documentation
- **[videogamedatabase.md](./videogamedatabase.md)**: Original data model specification
- Entity relationships
- Normalisation rules
- JSON schemas

## Key Improvements Made

### Database Design Enhancements
1. **UUID Primary Keys**: Replaced integer IDs with UUIDs for distributed systems
2. **Audit System**: Complete audit trail with user tracking
3. **Soft Deletes**: Implemented across all tables with recovery capability
4. **Unified Lookups**: Consolidated 20+ lookup tables into single polymorphic structure
5. **Performance Indexes**: Strategic indexing including full-text search
6. **Generated Columns**: Automatic CDN URLs for media

### Security Enhancements
1. **Row Level Security**: Comprehensive RLS policies on all tables
2. **Role-Based Access**: Four-tier permission system
3. **Field-Level Security**: Granular access control
4. **Audit Logging**: Complete change tracking
5. **Storage Policies**: Secure file upload/access

### Supabase Best Practices Applied
1. **Security Invoker Functions**: Following Supabase security guidelines
2. **Search Path Configuration**: Set to empty for security
3. **Storage Buckets**: Properly configured with policies
4. **Edge Functions**: Integration points defined
5. **Real-time Subscriptions**: WebSocket patterns documented

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
```bash
# Run initial migration
npx supabase migration up 20240101000001_initial_setup.sql

# Verify setup
npx supabase db test
```

**Deliverables:**
- User authentication working
- Basic role system active
- Audit logging functional

### Phase 2: Core Data Model (Week 2)
```bash
# Create games tables
npx supabase migration new create_games_tables
# Create lookups system
npx supabase migration new create_lookups_system
```

**Deliverables:**
- Games CRUD operations
- Lookup management
- Basic API endpoints

### Phase 3: UI Implementation (Week 3-4)
```bash
# Install ShadCN components
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog form input select table

# Create page structure
npm run generate:pages
```

**Deliverables:**
- Authentication screens
- Dashboard
- Games management screens
- Media upload

### Phase 4: Advanced Features (Week 5)
```bash
# Implement Edge Functions
npx supabase functions new import-external-api
npx supabase functions new generate-report
```

**Deliverables:**
- External API integration
- Report generation
- Change request workflow
- Real-time updates

### Phase 5: Testing & Deployment (Week 6)
```bash
# Run tests
npm run test
npm run test:e2e

# Deploy to production
npx supabase link --project-ref [project-id]
npx supabase db push --linked
```

## Code Structure

### Recommended Project Structure
```
gamevault/
├── app/                      # Next.js 14 App Router
│   ├── (auth)/              # Public auth routes
│   │   ├── login/
│   │   ├── signup/
│   │   └── forgot-password/
│   ├── (dashboard)/         # Protected routes
│   │   ├── games/
│   │   ├── media/
│   │   ├── users/
│   │   └── settings/
│   └── api/                 # API routes (if needed)
├── components/
│   ├── ui/                  # ShadCN components
│   ├── features/            # Feature-specific components
│   │   ├── games/
│   │   ├── media/
│   │   └── users/
│   └── layouts/            # Layout components
├── lib/
│   ├── supabase/           # Supabase clients
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── api/                # API client class
│   ├── hooks/              # Custom React hooks
│   └── utils/              # Utility functions
├── supabase/
│   ├── migrations/         # SQL migrations
│   ├── functions/          # Edge functions
│   └── seed.sql           # Seed data
└── types/
    ├── database.types.ts   # Generated from Supabase
    └── app.types.ts       # Application types
```

## Key Implementation Files

### 1. Supabase Client Setup
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

### 2. API Client Class
```typescript
// lib/api/gamevault.ts
export class GameVaultAPI {
  // See api-documentation.md for full implementation
}
```

### 3. Auth Hook
```typescript
// lib/hooks/useAuth.ts
export function useAuth() {
  // Authentication logic
}
```

### 4. RLS Helper
```typescript
// lib/utils/permissions.ts
export async function checkPermission(
  resource: string,
  action: string
): Promise<boolean> {
  // Permission checking logic
}
```

## Development Workflow

### 1. Database Changes
```bash
# Create migration
npx supabase migration new [description]

# Test locally
npx supabase db reset
npx supabase db push

# Deploy to staging
npx supabase db push --linked
```

### 2. Adding New Features
1. Update database schema if needed
2. Create/update RLS policies
3. Build UI components
4. Implement API calls
5. Add tests
6. Update documentation

### 3. Testing Strategy
- Unit tests for utilities and hooks
- Integration tests for API endpoints
- E2E tests for critical user flows
- RLS policy tests with different roles
- Performance tests for complex queries

## Common Implementation Patterns

### 1. Protected Routes
```typescript
// middleware.ts
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(req, res)
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  return res
}
```

### 2. Data Fetching
```typescript
// Using React Query
export function useGames() {
  return useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*')
      if (error) throw error
      return data
    }
  })
}
```

### 3. Form Handling
```typescript
// Using React Hook Form + Zod
const schema = z.object({
  canonical_title: z.string().min(1),
  status: z.enum(['announced', 'in_development', 'released'])
})

export function GameForm() {
  const form = useForm({
    resolver: zodResolver(schema)
  })
  // Form implementation
}
```

## Deployment Checklist

### Pre-deployment
- [ ] All migrations tested locally
- [ ] RLS policies verified for all roles
- [ ] API endpoints documented
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Mobile responsive tested
- [ ] Accessibility checked

### Production Setup
- [ ] Environment variables configured
- [ ] Supabase project created
- [ ] Database migrations applied
- [ ] Storage buckets configured
- [ ] Edge functions deployed
- [ ] Custom domain setup
- [ ] SSL certificates active
- [ ] Monitoring configured

### Post-deployment
- [ ] Smoke tests passed
- [ ] Admin user created
- [ ] Backup strategy verified
- [ ] Performance baseline established
- [ ] Documentation updated
- [ ] Team training completed

## Support Resources

### Internal Documentation
- Database Schema: `documentation/database-schema.md`
- API Reference: `documentation/api-documentation.md`
- Screen Specs: `documentation/backoffice-screens.md`
- RBAC Matrix: `documentation/rbac-matrix.md`

### External Resources
- [Supabase Docs](https://supabase.com/docs)
- [ShadCN UI](https://ui.shadcn.com)
- [Next.js Docs](https://nextjs.org/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## Next Steps

1. **Review all documentation** to understand the system architecture
2. **Set up development environment** with Supabase local
3. **Run initial migration** to create foundation tables
4. **Build authentication flow** using Supabase Auth
5. **Implement first CRUD screens** for games management
6. **Add media upload** functionality
7. **Test with different user roles** to verify RLS
8. **Deploy to staging** for team review

## Questions & Support

For any questions about the implementation:
1. Check the relevant documentation file
2. Review the API documentation
3. Test locally with Supabase CLI
4. Consult the team lead

---

This implementation guide should be updated as the project evolves.
