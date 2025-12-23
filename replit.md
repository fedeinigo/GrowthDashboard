# WiseCX Growth Metrics Dashboard

## Overview

A commercial metrics dashboard for the WiseCX Growth Team. This application provides real-time analytics and visualizations for tracking sales performance, team metrics, revenue history, and regional data. Built as a full-stack TypeScript application with a React frontend and Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.
UI preferences: Prioritize aesthetics, usability, and spacing. Elements should not be too close together. Dynamic and creative visual design.

## Recent Changes (December 2025)

### UI Enhancements (Latest)
- **Header Redesign**: All pages now feature gradient headers with consistent visual style
- **Improved KPI Grid**: Dashboard KPIs now use 3-column layout on large screens for better symmetry
- **Section Titles**: Added icon-prefixed section titles for Charts and Rankings
- **Dark Mode Polish**: Fixed badge and text colors for proper contrast in dark mode
- **Cache Refresh Fix**: Made cache refresh asynchronous with faster polling (3s during refresh)
- **Consistent Spacing**: Improved gap sizes across all grids and sections

### New Features Implemented
- **Dark/Light Theme Toggle**: Elegant theme switcher with smooth animations using next-themes
- **Responsive Design**: Auto-collapsing sidebar on mobile/tablet (<1024px), optimized grids for all screen sizes
- **Clickable Rankings**: Click on team/person/source rankings to filter the entire dashboard
- **KPI Card Enhancements**:
  - Status colors (green/yellow/red) based on performance thresholds
  - Period comparison display (+X% vs previous period)
  - Tooltips explaining each metric
  - Clickable cards to open deals modal
- **Conversion Funnel Widget**: Visual funnel showing Meeting → Propuesta → Cierre stages
- **Loss Reasons Widget**: Bar chart showing most common reasons for lost deals
- **Empty States**: Friendly messages when no data matches current filters
- **Cache Status Indicator**: Visible last-sync time with manual refresh capability
- **Export Features**: Dropdown with CSV download and PDF (print dialog) options
- **Deals Modal**: Click on KPI cards to see individual deals table with search/pagination
- **Drag-and-Drop Widgets**: Reorder dashboard sections by dragging, persists to localStorage

### New API Endpoints
- `GET /api/dashboard/conversion-funnel` - Funnel stage data
- `GET /api/dashboard/loss-reasons` - Lost deal reasons
- `GET /api/dashboard/deals` - Individual deals for modal

### New Components
- `client/src/components/theme-toggle.tsx` - Theme switcher
- `client/src/components/conversion-funnel.tsx` - Visual funnel
- `client/src/components/loss-reasons.tsx` - Loss reasons chart
- `client/src/components/empty-state.tsx` - No-data states
- `client/src/components/cache-status.tsx` - Cache indicator
- `client/src/components/deals-modal.tsx` - Deals detail modal
- `client/src/components/draggable-widget.tsx` - Drag-and-drop wrapper
- `client/src/hooks/use-widget-order.ts` - Widget order persistence
- `client/src/lib/export-utils.ts` - Export utilities

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Charts**: Recharts for data visualization
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a component-based architecture with:
- Page components in `client/src/pages/`
- Reusable UI components in `client/src/components/ui/`
- Custom hooks in `client/src/hooks/`
- API functions in `client/src/lib/api.ts`

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **API Design**: RESTful endpoints under `/api/` prefix
- **Schema Validation**: Zod with drizzle-zod integration

The backend follows a layered architecture:
- Routes defined in `server/routes.ts`
- Data access through `server/storage.ts`
- Database connection in `server/db.ts`
- Shared schema in `shared/schema.ts`

### Data Models
The database schema includes:
- **Teams**: Sales teams (Leones, Tigres, Lobos, Wizards, Jaguares)
- **People**: Team members with team associations
- **Sources**: Lead sources for tracking acquisition channels
- **Products**: Product catalog
- **Regions**: Geographic regions for regional analytics
- **Leads**: Sales leads with associated metadata
- **Activities**: Meetings and interactions
- **Sales**: Closed deals with revenue data

### API Structure
Dashboard endpoints provide filtered metrics:
- `GET /api/dashboard/metrics` - KPI summary data
- `GET /api/dashboard/revenue-history` - Historical revenue data
- `GET /api/dashboard/meetings-history` - Meeting activity over time
- `GET /api/dashboard/closure-rate-history` - Conversion rate trends
- `GET /api/dashboard/product-stats` - Product performance
- `GET /api/dashboard/rankings/*` - Team/person/source rankings
- `GET /api/dashboard/regional-data` - Geographic breakdown
- `GET /api/teams`, `/api/people`, `/api/sources` - Filter options

All endpoints support filtering by team, person, source, region, and date range.

## External Dependencies

### Database
- **PostgreSQL**: Primary database (connection via `DATABASE_URL` environment variable)
- **Drizzle ORM**: Type-safe database queries and schema management
- **connect-pg-simple**: PostgreSQL session store for Express

### Frontend Libraries
- **Radix UI**: Accessible component primitives
- **Recharts**: Charting library for data visualization
- **date-fns**: Date manipulation with Spanish locale support
- **react-day-picker**: Date range selection component

### Development Tools
- **Vite**: Development server and build tool
- **esbuild**: Production bundling for server code
- **drizzle-kit**: Database migrations (`npm run db:push`)

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer**: Development tooling
- **@replit/vite-plugin-dev-banner**: Development environment indicator