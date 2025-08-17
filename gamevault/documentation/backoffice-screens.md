# GameVault Backoffice Screens Documentation

## Overview
This document details all screens required for the GameVault ShadCN-based backoffice application, including layouts, components, and user flows for each role.

## Screen Architecture

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  Header (Logo | Search | Notifications | User Menu)         │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│   Sidebar     │            Main Content Area                │
│   Navigation  │                                             │
│               │                                             │
│               │                                             │
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

## 1. Authentication Screens

### 1.1 Login Screen
**Route:** `/auth/login`
**Access:** Public

**Components:**
- Email/username input
- Password input with show/hide toggle
- Remember me checkbox
- Login button
- Forgot password link
- Sign up link (if public registration enabled)
- Social login options (Google, GitHub)
- Two-factor authentication input (when enabled)

### 1.2 Sign Up Screen
**Route:** `/auth/sign-up`
**Access:** Public (if enabled) or Admin only

**Components:**
- Username input (unique check)
- Email input
- Password input with strength meter
- Confirm password input
- Display name input
- Terms acceptance checkbox
- Sign up button
- Already have account link

### 1.3 Forgot Password
**Route:** `/auth/forgot-password`
**Access:** Public

**Components:**
- Email input
- Send reset link button
- Back to login link
- Success message display

### 1.4 Reset Password
**Route:** `/auth/reset-password`
**Access:** Via email link

**Components:**
- New password input
- Confirm password input
- Password strength requirements
- Reset button
- Success redirect to login

## 2. Dashboard Screens

### 2.1 Main Dashboard
**Route:** `/dashboard`
**Access:** All authenticated users

**Components:**
- **Statistics Cards:**
  - Total games
  - Recent additions (last 7 days)
  - Pending moderation items
  - Active users (admin only)

- **Charts:**
  - Games by status (pie chart)
  - Releases timeline (line chart)
  - Popular genres (bar chart)
  - Platform distribution (donut chart)

- **Recent Activity Feed:**
  - Latest game additions
  - Recent edits
  - New user registrations (admin)
  - System notifications

- **Quick Actions:**
  - Add new game button
  - Import data button
  - Generate report button

### 2.2 Personal Dashboard
**Route:** `/dashboard/personal`
**Access:** All authenticated users

**Components:**
- User statistics (contributions, edits)
- Recent activity history
- Assigned tasks (moderators)
- Saved searches
- Favourite games
- Change request status

## 3. Games Management Screens

### 3.1 Games List
**Route:** `/games`
**Access:** All authenticated users

**Components:**
- **Search & Filters:**
  - Search bar (title, description)
  - Status filter (dropdown)
  - Genre filter (multi-select)
  - Platform filter (multi-select)
  - Release date range
  - Clear filters button

- **Data Table:**
  - Columns: Cover, Title, Status, Genres, Platforms, Release Date, Actions
  - Sortable columns
  - Pagination (10/25/50/100 per page)
  - Bulk selection checkboxes
  - Bulk actions dropdown

- **Actions:**
  - View details (eye icon)
  - Edit (pencil icon)
  - Delete (trash icon - admin only)
  - Clone (copy icon)

### 3.2 Game Details View
**Route:** `/games/{id}`
**Access:** All authenticated users

**Tabs Structure:**
- Overview
- Editions & Releases
- Media Gallery
- Companies & Credits
- Technical Specs
- Ratings & Classifications
- External Links
- Audit History

**Overview Tab Components:**
- Cover image display
- Basic information cards
- Synopsis and description
- Genres, themes, modes chips
- Monetisation model
- Player count info
- Average playtime statistics
- Edit button (authorised users)

### 3.3 Add/Edit Game
**Route:** `/games/new` or `/games/{id}/edit`
**Access:** Admin, Moderator

**Form Sections:**
1. **Basic Information:**
   - Canonical title
   - Sort title
   - Franchise/Series selector
   - Status dropdown
   - Announcement date picker
   - First release date picker

2. **Content:**
   - Short synopsis (textarea with character count)
   - Long description (rich text editor)
   - Age ratings summary

3. **Classification:**
   - Primary genre selector
   - Additional genres (multi-select)
   - Themes (multi-select)
   - Game modes (multi-select)
   - Art styles (multi-select)

4. **Technical:**
   - Engine selector
   - Co-op support toggle
   - Max players (local/online)
   - VR support options
   - Cloud gaming options
   - Cross-platform features

5. **Business:**
   - Monetisation model
   - Business model notes
   - Official website URL
   - Press kit URL

**Actions:**
- Save as draft
- Submit for review
- Publish (admin)
- Cancel

### 3.4 Editions Management
**Route:** `/games/{id}/editions`
**Access:** Admin, Moderator

**List View:**
- Edition name
- Type (Standard, Deluxe, etc.)
- SKU code
- Included content
- Actions (edit, delete, add release)

**Add/Edit Edition Form:**
- Edition name
- Release type selector
- Base game included toggle
- DLC selector (multi-select)
- Bonus content description
- Physical contents
- Digital contents
- SKU code
- Cover image upload

### 3.5 Releases Management
**Route:** `/games/{id}/editions/{editionId}/releases`
**Access:** Admin, Moderator

**Form Fields:**
- Platform selector
- Region selector
- Release date picker
- Distribution format
- Player counts (min/max, local/online)
- Languages support matrix
- Install size
- Online requirements
- DRM type
- Storefront selector
- Store URL
- Product ID

## 4. Media Management Screens

### 4.1 Media Gallery
**Route:** `/games/{id}/media`
**Access:** View: All, Edit: Admin/Moderator

**Components:**
- **Upload Area:**
  - Drag & drop zone
  - File type selector
  - Batch upload support
  - Progress indicators

- **Gallery Grid:**
  - Thumbnail previews
  - Media type badges
  - Official/User-generated indicator
  - NSFW warning overlay
  - Quick actions (view, edit, delete)

- **Filters:**
  - Media type (covers, screenshots, trailers, etc.)
  - Source (uploaded, external, embedded)
  - Language
  - Official only toggle

### 4.2 Media Editor
**Route:** `/media/{id}/edit`
**Access:** Admin, Moderator

**Form Fields:**
- Title
- Caption
- Credits
- Media type selector
- Language selector
- Official content toggle
- NSFW toggle
- Replace file option
- External URL input
- Embed code input

## 5. Companies & People Management

### 5.1 Companies List
**Route:** `/companies`
**Access:** All authenticated users

**Components:**
- Search bar
- Country filter
- Active/Defunct filter
- Data table (Name, Country, Founded, Website, Games Count)
- Add new company button

### 5.2 Company Details
**Route:** `/companies/{id}`
**Access:** All authenticated users

**Sections:**
- Company information
- Description
- Published games list
- Developed games list
- Role history
- External links

### 5.3 People Management
**Route:** `/people`
**Access:** Admin, Moderator

**Components:**
- Search bar
- Country filter
- Data table (Name, Country, DOB, Credits Count)
- Add new person button
- Bulk import option

## 6. Lookups Management

### 6.1 Lookups Dashboard
**Route:** `/lookups`
**Access:** Admin

**Categories Grid:**
- Platforms
- Genres & Subgenres
- Themes
- Game Modes
- Engines
- Regions
- Languages
- Age Rating Boards
- And all other lookup types

### 6.2 Lookup Category Management
**Route:** `/lookups/{type}`
**Access:** Admin

**Components:**
- **Tree View** (for hierarchical lookups):
  - Expand/collapse nodes
  - Drag & drop reordering
  - Parent-child relationships

- **List View** (for flat lookups):
  - Sortable table
  - Inline editing
  - Bulk operations

- **Add/Edit Form:**
  - Canonical name
  - Slug (auto-generated)
  - Description
  - Parent selector (if applicable)
  - Sort order
  - Active toggle
  - Metadata JSON editor

### 6.3 Aliases Management
**Route:** `/lookups/{type}/{id}/aliases`
**Access:** Admin

**Components:**
- Alias list table
- Add alias form
- Locale selector
- Source field
- Bulk import from CSV

## 7. User Management Screens

### 7.1 Users List
**Route:** `/users`
**Access:** Admin, Superadmin

**Components:**
- Search bar (username, email, display name)
- Role filter
- Status filter (active, inactive, banned)
- Registration date range
- Data table with columns:
  - Avatar
  - Username
  - Display Name
  - Email
  - Role
  - Status
  - Last Active
  - Actions

### 7.2 User Profile
**Route:** `/users/{id}`
**Access:** Admin, Superadmin, Own profile

**Tabs:**
- **Profile:**
  - Avatar upload
  - Username (unique)
  - Display name
  - Email
  - Bio
  - Preferences

- **Activity:**
  - Contribution history
  - Edit history
  - Login history
  - API usage

- **Permissions:**
  - Role assignment
  - Custom permissions
  - Access restrictions

- **Actions:**
  - Send message
  - Reset password
  - Suspend account
  - Delete account (superadmin)

## 8. Moderation Screens

### 8.1 Moderation Queue
**Route:** `/moderation`
**Access:** Moderator, Admin

**Components:**
- **Filters:**
  - Status (pending, reviewing, resolved)
  - Type (content, user, spam)
  - Assigned to me toggle
  - Date range

- **Queue List:**
  - Report reason
  - Reported item preview
  - Reporter info
  - Assigned moderator
  - Status badge
  - Priority indicator

### 8.2 Moderation Review
**Route:** `/moderation/{id}`
**Access:** Moderator, Admin

**Components:**
- Reported content display
- Report details
- Reporter information
- Previous reports on same item
- Action buttons:
  - Approve
  - Reject
  - Request changes
  - Escalate
  - Ban user
- Notes textarea
- Email reporter option

### 8.3 Change Requests
**Route:** `/changes`
**Access:** All authenticated users

**Views:**
- **My Requests:** User's own submissions
- **Review Queue:** For moderators/admins
- **All Requests:** Admin view

**Components:**
- Request list with filters
- Diff viewer for proposed changes
- Approval workflow
- Comments thread
- Confidence score display

## 9. Reports & Analytics

### 9.1 Reports Dashboard
**Route:** `/reports`
**Access:** Admin, Superadmin

**Report Types:**
- Database statistics
- User activity reports
- Content growth metrics
- Moderation statistics
- API usage reports
- Error logs

### 9.2 Custom Report Builder
**Route:** `/reports/builder`
**Access:** Admin, Superadmin

**Components:**
- Entity selector
- Field selector
- Filter builder
- Aggregation options
- Chart type selector
- Export options (CSV, JSON, PDF)
- Save report template
- Schedule reports

### 9.3 Audit Log Viewer
**Route:** `/audit`
**Access:** Admin, Superadmin

**Components:**
- Date range picker
- User filter
- Action type filter
- Table name filter
- Search in changes
- Detailed change viewer
- Rollback option (superadmin)

## 10. Settings Screens

### 10.1 System Settings
**Route:** `/settings/system`
**Access:** Superadmin

**Sections:**
- **General:**
  - Site name
  - Site URL
  - Contact email
  - Timezone
  - Date format

- **Features:**
  - Public registration toggle
  - API access toggle
  - Moderation queue toggle
  - Auto-approval settings

- **Limits:**
  - Upload size limits
  - Rate limiting
  - Session timeout
  - Password requirements

### 10.2 Integration Settings
**Route:** `/settings/integrations`
**Access:** Admin

**Components:**
- API keys management
- Webhook configuration
- External service connections:
  - Steam API
  - IGDB
  - Metacritic
  - OpenCritic
- OAuth providers
- Storage settings

### 10.3 Email Templates
**Route:** `/settings/emails`
**Access:** Admin

**Templates:**
- Welcome email
- Password reset
- Account verification
- Moderation notifications
- Change request updates

**Editor Features:**
- Variable insertion
- Preview mode
- Test send
- HTML/Text versions

## 11. Import/Export Screens

### 11.1 Data Import
**Route:** `/import`
**Access:** Admin

**Steps:**
1. **Source Selection:**
   - File upload (CSV, JSON)
   - API endpoint
   - Database connection

2. **Mapping:**
   - Field mapping interface
   - Data preview
   - Transformation rules

3. **Validation:**
   - Error summary
   - Fix suggestions
   - Skip invalid toggle

4. **Import:**
   - Progress bar
   - Success/error count
   - Download report

### 11.2 Data Export
**Route:** `/export`
**Access:** Admin

**Components:**
- Entity selector
- Field selector
- Filter criteria
- Format selector (CSV, JSON, SQL)
- Include related data options
- Schedule export
- Download link

## 12. Mobile Responsive Considerations

### Responsive Breakpoints
- **Desktop:** 1280px+
- **Tablet:** 768px - 1279px
- **Mobile:** < 768px

### Mobile Adaptations
- Collapsible sidebar → Bottom navigation
- Data tables → Card view
- Multi-column forms → Single column
- Hover actions → Swipe gestures
- Modal dialogs → Full screen pages

## Component Library Requirements

### ShadCN Components Needed
- Accordion
- Alert & Alert Dialog
- Avatar
- Badge
- Button (variants: primary, secondary, danger, ghost)
- Calendar
- Card
- Checkbox
- Command (command palette)
- Context Menu
- Data Table
- Date Picker
- Dialog
- Dropdown Menu
- Form (with react-hook-form)
- Input (text, number, email, password, textarea)
- Label
- Navigation Menu
- Popover
- Progress
- Radio Group
- ScrollArea
- Select (single and multi)
- Separator
- Sheet (slide-over panel)
- Skeleton (loading states)
- Slider
- Switch
- Tabs
- Toast
- Toggle
- Tooltip

### Custom Components Needed
- Rich Text Editor
- Image Upload with Preview
- Diff Viewer
- JSON Editor
- Chart Components
- Timeline Component
- Tree View
- Kanban Board
- Search with Autocomplete
- Tag Input
- Colour Picker
- File Manager
- Audit Trail Viewer

## Navigation Structure

### Primary Navigation (Sidebar)
```
- Dashboard
  - Overview
  - Personal
- Games
  - Browse Games
  - Add New Game
  - Import Games
- Media
  - Gallery
  - Upload Media
- Companies & People
  - Companies
  - People
  - Credits
- Lookups (Admin)
  - Platforms
  - Genres
  - [Other lookup types]
- Moderation (Moderator+)
  - Queue
  - Change Requests
  - Reports
- Users (Admin+)
  - All Users
  - Roles & Permissions
- Reports (Admin+)
  - Analytics
  - Audit Log
- Settings (Admin+)
  - System
  - Integrations
  - Email Templates
```

### User Menu (Header)
```
- My Profile
- My Activity
- My Contributions
- Preferences
- Help & Documentation
- Sign Out
```

## Keyboard Shortcuts

### Global Shortcuts
- `Ctrl/Cmd + K`: Open command palette
- `Ctrl/Cmd + /`: Open search
- `Ctrl/Cmd + B`: Toggle sidebar
- `Escape`: Close modal/dialog

### List View Shortcuts
- `J/K`: Navigate up/down
- `Enter`: Open selected item
- `E`: Edit selected item
- `D`: Delete selected item
- `Shift + Click`: Multi-select range

### Form Shortcuts
- `Ctrl/Cmd + S`: Save
- `Ctrl/Cmd + Enter`: Save and close
- `Escape`: Cancel
- `Tab/Shift+Tab`: Navigate fields

## Performance Considerations

### Optimisations Required
- Virtual scrolling for large lists
- Lazy loading for images
- Code splitting by route
- Debounced search inputs
- Optimistic UI updates
- Background sync for large operations
- Progressive Web App features
- Offline mode for read operations
- Request caching
- Pagination vs infinite scroll

## Accessibility Requirements

### WCAG 2.1 AA Compliance
- Proper heading hierarchy
- ARIA labels and descriptions
- Keyboard navigation support
- Focus management
- Screen reader announcements
- Colour contrast ratios (4.5:1 minimum)
- Error message associations
- Loading state announcements
- Skip navigation links
- Reduced motion options

## Security Considerations

### Frontend Security
- Content Security Policy headers
- XSS prevention
- Input sanitisation
- Secure cookie handling
- HTTPS enforcement
- API key protection
- Rate limiting implementation
- Session management
- Two-factor authentication UI
- Permission-based UI rendering
