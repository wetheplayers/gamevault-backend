# Role-Based Access Control (RBAC) Matrix

## Overview
This document defines the complete permissions matrix for GameVault, detailing what each role can do within the system.

## User Roles

### 1. Superadmin
- **Purpose**: System administrators with complete control
- **Typical Users**: Technical leads, system owners
- **Access Level**: Unrestricted

### 2. Admin
- **Purpose**: Content administrators and managers
- **Typical Users**: Database managers, senior moderators
- **Access Level**: Full content management, limited system access

### 3. Moderator
- **Purpose**: Content moderation and quality control
- **Typical Users**: Community moderators, content reviewers
- **Access Level**: Content editing and moderation

### 4. User
- **Purpose**: Regular authenticated users
- **Typical Users**: Contributors, researchers, general users
- **Access Level**: Read-only with ability to submit changes

## Permissions Matrix

### Games Management

| Action | Superadmin | Admin | Moderator | User | Anonymous |
|--------|------------|-------|-----------|------|-----------|
| **View all games** | ✅ | ✅ | ✅ | ✅ Published only | ✅ Released only |
| **View draft/unpublished games** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Create new game** | ✅ | ✅ | ✅ Via change request | ✅ Via change request | ❌ |
| **Edit game** | ✅ | ✅ | ✅ Non-critical fields | ❌ | ❌ |
| **Delete game (soft)** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Delete game (hard)** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Restore deleted game** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Approve game changes** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Bulk operations** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Import from external API** | ✅ | ✅ | ✅ With review | ❌ | ❌ |
| **Export game data** | ✅ | ✅ | ✅ Limited | ✅ Own contributions | ❌ |

### Editions & Releases

| Action | Superadmin | Admin | Moderator | User | Anonymous |
|--------|------------|-------|-----------|------|-----------|
| **View editions** | ✅ | ✅ | ✅ | ✅ Published | ✅ Released |
| **Create edition** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Edit edition** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Delete edition** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View releases** | ✅ | ✅ | ✅ | ✅ Published | ✅ Released |
| **Create release** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Edit release** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Delete release** | ✅ | ✅ | ❌ | ❌ | ❌ |

### Media Management

| Action | Superadmin | Admin | Moderator | User | Anonymous |
|--------|------------|-------|-----------|------|-----------|
| **View media** | ✅ | ✅ | ✅ | ✅ Non-NSFW | ✅ Non-NSFW |
| **View NSFW media** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Upload media** | ✅ | ✅ | ✅ | ✅ Via moderation | ❌ |
| **Edit media metadata** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Delete media** | ✅ | ✅ | ✅ Own uploads | ❌ | ❌ |
| **Approve media** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Set media as official** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Bulk media operations** | ✅ | ✅ | ❌ | ❌ | ❌ |

### Companies & People

| Action | Superadmin | Admin | Moderator | User | Anonymous |
|--------|------------|-------|-----------|------|-----------|
| **View companies** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Create company** | ✅ | ✅ | ✅ | ✅ Via change request | ❌ |
| **Edit company** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Delete company** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Merge companies** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View people** | ✅ | ✅ | ✅ | ✅ | ✅ Limited |
| **Create person** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Edit person** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Delete person** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Manage credits** | ✅ | ✅ | ✅ | ❌ | ❌ |

### Lookups/Master Data

| Action | Superadmin | Admin | Moderator | User | Anonymous |
|--------|------------|-------|-----------|------|-----------|
| **View lookups** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Create lookup** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Edit lookup** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Delete lookup** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Deactivate lookup** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Manage aliases** | ✅ | ✅ | ✅ Suggest only | ❌ | ❌ |
| **Reorder lookups** | ✅ | ✅ | ❌ | ❌ | ❌ |

### User Management

| Action | Superadmin | Admin | Moderator | User | Anonymous |
|--------|------------|-------|-----------|------|-----------|
| **View all users** | ✅ | ✅ | ✅ Basic info | ❌ | ❌ |
| **View user details** | ✅ | ✅ | ✅ Limited | ✅ Own only | ❌ |
| **Create user** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Edit user profile** | ✅ | ✅ Non-admins | ❌ | ✅ Own only | ❌ |
| **Change user role** | ✅ | ✅ Below admin | ❌ | ❌ | ❌ |
| **Suspend user** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Delete user** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Reset password** | ✅ | ✅ | ❌ | ✅ Own only | ❌ |
| **View user activity** | ✅ | ✅ | ✅ | ✅ Own only | ❌ |
| **Export user data** | ✅ | ✅ | ❌ | ✅ Own only | ❌ |

### Moderation & Quality Control

| Action | Superadmin | Admin | Moderator | User | Anonymous |
|--------|------------|-------|-----------|------|-----------|
| **View moderation queue** | ✅ | ✅ | ✅ | ✅ Own items | ❌ |
| **Assign moderation items** | ✅ | ✅ | ✅ To self | ❌ | ❌ |
| **Approve content** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Reject content** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Escalate issues** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Report content** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **View all reports** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Close reports** | ✅ | ✅ | ✅ | ❌ | ❌ |

### Change Requests

| Action | Superadmin | Admin | Moderator | User | Anonymous |
|--------|------------|-------|-----------|------|-----------|
| **Submit change request** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **View all change requests** | ✅ | ✅ | ✅ | ✅ Own only | ❌ |
| **Review change requests** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Approve changes** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Reject changes** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Edit pending changes** | ✅ | ✅ | ✅ | ✅ Own only | ❌ |
| **Cancel change request** | ✅ | ✅ | ✅ | ✅ Own only | ❌ |

### Reports & Analytics

| Action | Superadmin | Admin | Moderator | User | Anonymous |
|--------|------------|-------|-----------|------|-----------|
| **View system reports** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View content reports** | ✅ | ✅ | ✅ Limited | ❌ | ❌ |
| **View user reports** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Create custom reports** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Export reports** | ✅ | ✅ | ✅ Limited | ❌ | ❌ |
| **Schedule reports** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View audit logs** | ✅ | ✅ | ❌ | ✅ Own only | ❌ |
| **View system metrics** | ✅ | ❌ | ❌ | ❌ | ❌ |

### System Settings

| Action | Superadmin | Admin | Moderator | User | Anonymous |
|--------|------------|-------|-----------|------|-----------|
| **View system settings** | ✅ | ✅ Read-only | ❌ | ❌ | ❌ |
| **Edit system settings** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Manage integrations** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Manage API keys** | ✅ | ✅ Own only | ❌ | ❌ | ❌ |
| **Configure email templates** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Manage storage** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Database maintenance** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **View system logs** | ✅ | ❌ | ❌ | ❌ | ❌ |

### API Access

| Action | Superadmin | Admin | Moderator | User | Anonymous |
|--------|------------|-------|-----------|------|-----------|
| **Read API access** | ✅ | ✅ | ✅ | ✅ Limited | ✅ Public only |
| **Write API access** | ✅ | ✅ | ✅ Limited | ❌ | ❌ |
| **Generate API key** | ✅ | ✅ | ✅ | ✅ Personal | ❌ |
| **Revoke API keys** | ✅ | ✅ Own only | ✅ Own only | ✅ Own only | ❌ |
| **View API usage** | ✅ | ✅ Own only | ✅ Own only | ✅ Own only | ❌ |
| **Rate limit override** | ✅ | ❌ | ❌ | ❌ | ❌ |

## Special Permissions

### Superadmin Exclusive
- Hard delete any record
- Modify audit logs
- Change superadmin roles
- Access database directly
- Override all RLS policies
- System configuration
- Backup and restore operations
- User impersonation (for debugging)

### Admin Exclusive
- Soft delete games and major entities
- Bulk import operations
- Manage user roles (except superadmin)
- Configure integrations
- Access all reports
- Approve high-confidence changes automatically

### Moderator Exclusive
- Fast-track own changes (skip queue)
- Assign moderation items
- Access moderation tools
- View detailed user activity
- Suggest lookup additions

### User Capabilities
- Submit change requests for any content
- Report inappropriate content
- Manage own profile and preferences
- View own contribution history
- Export own data (GDPR compliance)
- Delete own account

## Permission Inheritance

```
Superadmin
    ├── All Admin permissions
    ├── All Moderator permissions
    ├── All User permissions
    └── Superadmin-exclusive permissions

Admin
    ├── All Moderator permissions
    ├── All User permissions
    └── Admin-exclusive permissions

Moderator
    ├── All User permissions
    └── Moderator-exclusive permissions

User
    ├── All Anonymous permissions
    └── User-exclusive permissions

Anonymous
    └── Public read-only access
```

## Field-Level Permissions

### Games Table Fields

| Field | Superadmin | Admin | Moderator | User |
|-------|------------|-------|-----------|------|
| **id** | Read | Read | Read | Read |
| **canonical_title** | Read/Write | Read/Write | Read/Write | Read |
| **status** | Read/Write | Read/Write | Read | Read |
| **synopsis_short** | Read/Write | Read/Write | Read/Write | Read |
| **description_long** | Read/Write | Read/Write | Read/Write | Read |
| **first_release_date** | Read/Write | Read/Write | Read/Write | Read |
| **notes_internal** | Read/Write | Read/Write | Read | ❌ |
| **deleted_at** | Read/Write | Read/Write | Read | ❌ |
| **created_by** | Read | Read | Read | Read |
| **updated_by** | Read | Read | Read | Read |

## API Rate Limits by Role

| Role | Requests/Minute | Requests/Hour | Requests/Day |
|------|-----------------|---------------|--------------|
| **Superadmin** | Unlimited | Unlimited | Unlimited |
| **Admin** | 1000 | 30,000 | 500,000 |
| **Moderator** | 500 | 15,000 | 250,000 |
| **User** | 100 | 3,000 | 50,000 |
| **Anonymous** | 20 | 500 | 5,000 |

## Storage Quotas by Role

| Role | Max File Size | Total Storage | Concurrent Uploads |
|------|---------------|---------------|-------------------|
| **Superadmin** | Unlimited | Unlimited | Unlimited |
| **Admin** | 1 GB | 100 GB | 10 |
| **Moderator** | 500 MB | 50 GB | 5 |
| **User** | 100 MB | 5 GB | 2 |
| **Anonymous** | N/A | N/A | 0 |

## Workflow Permissions

### Content Creation Workflow

1. **User/Moderator** submits content → **Pending**
2. **Moderator** reviews → **Approved/Rejected/Needs Changes**
3. **Admin** final approval (if needed) → **Published**
4. **Superadmin** can override at any stage

### User Promotion Workflow

1. **User** → **Moderator**: Requires Admin approval
2. **Moderator** → **Admin**: Requires Superadmin approval
3. **Admin** → **Superadmin**: Requires existing Superadmin
4. Demotions follow same approval requirements

### Deletion Workflow

1. **Soft Delete**: Admin/Superadmin marks as deleted
2. **Grace Period**: 30 days for recovery
3. **Hard Delete**: Superadmin only, after grace period
4. **Audit Trail**: Permanent record of deletion

## Security Considerations

### Session Management
- Superadmin: 2FA required, 2-hour sessions
- Admin: 2FA recommended, 8-hour sessions
- Moderator: 12-hour sessions
- User: 30-day sessions with refresh
- Anonymous: No session

### IP Restrictions
- Superadmin: Whitelist IP option
- Admin: Geographic restrictions option
- Moderator: Suspicious IP warnings
- User: Standard protections
- Anonymous: Rate limiting by IP

### Audit Requirements
- All write operations logged
- Role changes require reason
- Bulk operations require confirmation
- Sensitive data access logged
- Retention: 2 years minimum

## Implementation Notes

### RLS Policy Patterns
```sql
-- Example: Moderator can update non-deleted games
create policy "games_moderator_update" on public.games
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() 
      and role = 'moderator'
    ) 
    and deleted_at is null
  );
```

### Permission Check Function
```sql
create or replace function public.check_permission(
  p_resource text,
  p_action text,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
security invoker
stable
as $$
  select exists (
    select 1 
    from public.permissions p
    join public.user_profiles u on u.role = p.role
    where u.id = p_user_id
    and p.resource = p_resource
    and p.action = p_action
  );
$$;
```

## Testing Matrix

Each role should be tested for:
1. Correct access to allowed resources
2. Proper denial of restricted resources
3. Appropriate data filtering
4. Rate limit enforcement
5. Storage quota enforcement
6. Workflow participation
7. API access levels
8. Audit trail generation
