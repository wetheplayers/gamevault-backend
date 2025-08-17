# GameVault Documentation

## Overview
Welcome to the GameVault documentation. This comprehensive guide covers all aspects of the GameVault video game database management system, built with Supabase and ShadCN.

## Documentation Structure

### 📚 Core Documentation

#### 1. [Video Game Database Brief](./videogamedatabase.md)
The original LLM integration brief that defines the data model, normalisation rules, and JSON schemas for the video game database. This document serves as the foundation for understanding the domain model.

#### 2. [Database Schema](./database-schema.md)
Complete PostgreSQL database schema documentation including:
- Table structures with UUID primary keys
- Audit fields and soft delete implementation
- Indexes for performance
- Storage bucket configuration
- Database functions and triggers
- Initial data seeds

#### 3. [RLS Policies](./rls-policies.md)
Comprehensive Row Level Security documentation covering:
- Policy implementation for all tables
- Role-based access patterns
- Performance optimisation strategies
- Storage policies
- Helper functions for RLS

#### 4. [RBAC Matrix](./rbac-matrix.md)
Detailed role-based access control matrix showing:
- Four user roles (Superadmin, Admin, Moderator, User)
- Permissions for every action in the system
- Field-level permissions
- API rate limits by role
- Storage quotas
- Workflow permissions

#### 5. [Migration Strategy](./migration-strategy.md)
Step-by-step database migration plan including:
- 8-phase implementation timeline
- Migration files with dependencies
- Rollback strategies
- Testing procedures
- CI/CD integration
- Monitoring and maintenance

#### 6. [Backoffice Screens](./backoffice-screens.md)
Complete specification of all ShadCN backoffice screens:
- 60+ screen definitions
- Component requirements
- Navigation structure
- Mobile responsive considerations
- Accessibility requirements
- Keyboard shortcuts

#### 7. [API Documentation](./api-documentation.md)
Full API reference including:
- Supabase client setup
- CRUD operations for all entities
- Real-time subscriptions
- RPC functions
- Edge functions
- TypeScript types
- Error handling
- Rate limiting

## Quick Start Guide

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase CLI
- PostgreSQL knowledge
- TypeScript/React experience

### Initial Setup

1. **Clone the repository**
```bash
git clone [repository-url]
cd gamevault
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Supabase**
```bash
npx supabase init
npx supabase start
```

4. **Configure environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

5. **Run migrations**
```bash
npx supabase db push
```

6. **Start the development server**
```bash
npm run dev
```

## Project Architecture

```
GameVault/
├── documentation/         # All documentation
│   ├── database-schema.md
│   ├── rls-policies.md
│   ├── rbac-matrix.md
│   ├── migration-strategy.md
│   ├── backoffice-screens.md
│   ├── api-documentation.md
│   └── videogamedatabase.md
├── supabase/             # Database files
│   ├── migrations/       # SQL migration files
│   ├── functions/        # Edge functions
│   └── seed.sql         # Initial data
├── app/                  # Next.js app directory
│   ├── (auth)/          # Authentication routes
│   ├── (dashboard)/     # Protected routes
│   └── api/             # API routes
├── components/          # React components
│   ├── ui/             # ShadCN components
│   └── features/       # Feature components
├── lib/                # Utilities
│   ├── supabase/      # Supabase clients
│   └── utils/         # Helper functions
└── types/             # TypeScript definitions
```

## Development Workflow

### For Developers

1. **Creating a new feature**
   - Review relevant documentation sections
   - Create feature branch
   - Implement with TypeScript
   - Add tests
   - Submit PR with documentation updates

2. **Database changes**
   - Create migration file following naming convention
   - Update database-schema.md
   - Add/update RLS policies if needed
   - Test with different user roles

3. **Adding new screens**
   - Refer to backoffice-screens.md for patterns
   - Use ShadCN components
   - Implement responsive design
   - Add accessibility features
   - Update navigation

### For Database Administrators

1. **Schema modifications**
   - Follow migration-strategy.md phases
   - Always include rollback scripts
   - Test RLS policies thoroughly
   - Monitor performance impact

2. **Performance tuning**
   - Review slow query logs
   - Add indexes as needed
   - Consider materialised views
   - Implement caching strategies

### For Content Moderators

1. **Content management**
   - Use moderation queue effectively
   - Follow approval workflows
   - Document rejection reasons
   - Escalate when necessary

2. **Quality control**
   - Verify data accuracy
   - Check for duplicates
   - Maintain consistency
   - Update lookups as needed

## Key Features

### 🔐 Security
- Row Level Security on all tables
- Role-based access control
- Audit logging
- Soft deletes with recovery

### 🚀 Performance
- Optimised indexes
- Materialised views
- Full-text search
- Efficient pagination

### 🌍 Internationalisation
- Multi-language support
- Localised game titles
- Regional release tracking
- Multiple date formats

### 📊 Analytics
- Comprehensive reporting
- User activity tracking
- Content metrics
- System monitoring

### 🔄 Integration
- External API imports (Steam, IGDB, etc.)
- Webhook support
- Real-time updates
- Export capabilities

## Database Design Principles

1. **UUID Primary Keys**: All tables use UUIDs for distributed systems compatibility
2. **Audit Trail**: Every table includes created/updated timestamps and user tracking
3. **Soft Deletes**: Data is marked as deleted but retained for recovery
4. **Normalisation**: Proper normalisation with lookup tables for controlled vocabularies
5. **Performance**: Strategic indexing and materialised views for complex queries
6. **Security**: RLS policies enforce access control at the database level

## Best Practices

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits
- Comprehensive testing

### Database Standards
- Lowercase SQL keywords
- Snake_case naming
- Meaningful table/column names
- Always enable RLS
- Document complex queries

### UI/UX Standards
- Consistent component usage
- Responsive design
- Accessibility compliance
- Loading states
- Error handling

## Common Tasks

### Adding a New Lookup Type
1. Add to lookups table with appropriate type
2. Create aliases if needed
3. Update relevant documentation
4. Add to backoffice lookup management

### Implementing a New Report
1. Design query/view
2. Add to reports dashboard
3. Implement export functionality
4. Add scheduling if needed

### Creating a Game Entry
1. Add game record
2. Create edition(s)
3. Add release(s) per platform/region
4. Upload media
5. Link companies/people
6. Add external IDs

## Troubleshooting

### Common Issues

**RLS Policy Violations**
- Check user role
- Verify policy conditions
- Review policy ordering
- Test with different roles

**Performance Issues**
- Check missing indexes
- Review query plans
- Consider materialised views
- Implement pagination

**Migration Failures**
- Check dependencies
- Verify syntax
- Test in development first
- Have rollback ready

## Support & Resources

### Internal Resources
- Development team Slack channel
- Weekly sync meetings
- Code review process
- Testing environments

### External Resources
- [Supabase Documentation](https://supabase.com/docs)
- [ShadCN Documentation](https://ui.shadcn.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Update relevant documentation
5. Add tests
6. Submit a pull request

## Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added media management
- **v1.2.0** - Implemented change request workflow
- **v1.3.0** - Enhanced RLS policies
- **v1.4.0** - Added external API integration

## License

This project is proprietary. All rights reserved.

## Contact

For questions or support, please contact the development team.

---

Last Updated: January 2024
