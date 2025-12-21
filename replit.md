# WiseCX Growth Metrics Dashboard

## Overview

A commercial metrics dashboard for the WiseCX Growth Team. This application provides real-time analytics and visualizations for tracking sales performance, team metrics, revenue history, and regional data. Built as a full-stack TypeScript application with a React frontend and Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

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