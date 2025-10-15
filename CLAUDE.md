# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Detramites is a Next.js 15 platform that acts as an intermediary for querying Mexican government APIs (INFONAVIT, SAT, IMSS). The platform supports a multi-tier user system with role-based access control and credit/subscription-based usage models.

## Tech Stack

- **Framework**: Next.js 15.2.4 with App Router and React Server Components
- **Language**: TypeScript 5 with strict mode
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **UI Components**: shadcn/ui (New York style) with Radix UI primitives
- **Package Manager**: pnpm
- **Font**: Geist Sans & Geist Mono
- **Animation**: Motion library and tailwindcss-animate
- **Form Handling**: react-hook-form with Zod validation

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server (default port 3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

## Architecture

### User Roles & Access Control

The platform implements a hierarchical role-based system defined in `lib/types.ts`:

1. **superadmin_master**: Full platform access (users, credits, queries, monitoring, reports, settings)
2. **superadmin_secondary**: Similar to master but with restricted permissions
3. **distributor**: Manages own users, queries, and profile
4. **final_user**: Can perform queries, view history, manage API keys

Role-based routing is handled by:
- `contexts/auth-context.tsx`: Authentication state and role-based redirects
- `components/protected-route.tsx`: Route protection wrapper
- `components/sidebar.tsx`: Dynamic navigation based on user role

### App Structure

The `/app` directory follows Next.js 15 App Router conventions with role-based route segments:

```
/app
  /superadmin     - Full admin panel (8 sections)
  /distributor    - Distributor management (4 sections)
  /user           - End user interface (5 sections)
  /login          - Authentication page
  page.tsx        - Root redirect handler
```

Each role has dedicated dashboard, query management, and profile sections. The superadmin role additionally manages credits, monitoring, and reports.

### Authentication Flow

1. User submits credentials at `/login`
2. `AuthContext.login()` validates against mock data in `lib/mock-data.ts`
3. On success, user object stored in localStorage
4. User redirected to role-specific dashboard
5. Protected routes check authentication via `useAuth()` hook

**Note**: Currently using mock authentication. For production, replace `contexts/auth-context.tsx` login logic with actual API calls.

### Component Organization

- `components/ui/`: shadcn/ui primitives (accordion, alert-dialog, avatar, badge, button, card, etc.)
- `components/`: Custom application components
  - `sidebar.tsx`: Collapsible role-based navigation
  - `protected-route.tsx`: Authentication wrapper
  - `dashboard-layout.tsx`: Common layout wrapper
  - `stat-card.tsx`: Dashboard statistics display
  - `shimmer-button.tsx`: Animated button component

### State Management

- **Authentication**: React Context (`contexts/auth-context.tsx`)
- **Theme**: next-themes provider (`components/theme-provider.tsx`)
- **Form State**: react-hook-form with Zod schemas
- **Toast Notifications**: Custom hook (`hooks/use-toast.ts`)

### Path Aliases

Configured in `tsconfig.json`:
- `@/*` maps to project root
- Use `@/components`, `@/lib`, `@/hooks`, `@/contexts` for imports

### Styling Approach

- Tailwind utility-first with CSS variables for theme colors
- Global styles in `app/globals.css`
- Component variants managed with class-variance-authority
- Color scheme: Black background with orange accent (`orange-500/600`)
- Design pattern: Glassmorphism with `backdrop-blur` and transparency

## Key Type Definitions

Located in `lib/types.ts`:

- `User`: User entity with role, credits/subscription, and metadata
- `Ticket`: Credit purchase requests with payment tracking
- `Query`: API query logs with status and performance metrics
- `Device`: User device/session tracking
- `ApiKey`: API key management for programmatic access

## Mock Data

`lib/mock-data.ts` contains sample data for development:

**Test Credentials**:
- Superadmin: `admin_master` / `admin123`
- Distributor: `distribuidor_juan` / `dist123`
- End User: `usuario_carlos` / `user123`

## Configuration Notes

- `next.config.mjs`: ESLint and TypeScript errors ignored during builds, images unoptimized
- `components.json`: shadcn/ui configured with New York style, RSC enabled, Lucide icons
- TypeScript: Strict mode, ES6 target, path aliases enabled
