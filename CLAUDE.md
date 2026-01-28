# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AFTR is a platform for discovering and organizing pre-parties and after-parties for events. The project is structured as a **Turborepo monorepo** with:

- **Mobile app** (`apps/mobile/`) - Expo/React Native for iOS and Android
- **Web app** (`apps/web/`) - Next.js with Tailwind CSS and shadcn/ui
- **Admin app** (`apps/admin/`) - Vite + React admin panel
- **Shared packages** (`packages/`) - Common code between apps

## Project Structure

```
aftr/
├── apps/
│   ├── mobile/              # Expo app (iOS/Android)
│   │   ├── app/             # expo-router screens
│   │   ├── components/      # Mobile-specific components
│   │   └── package.json
│   ├── web/                 # Next.js app
│   │   ├── app/             # Next.js App Router
│   │   ├── components/      # Web components (shadcn/ui)
│   │   └── package.json
│   └── admin/               # Vite admin panel
├── packages/
│   ├── shared/              # Shared types, utils, constants
│   │   ├── types/           # database.ts types
│   │   ├── utils/           # Utility functions
│   │   └── constants/       # Colors, config
│   └── supabase/            # Supabase client & queries
│       ├── client.ts        # Browser client
│       ├── server.ts        # Server client (Next.js)
│       └── queries/         # Reusable query functions
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

## Development Commands

```bash
# Root commands (Turborepo)
pnpm install               # Install all dependencies
pnpm dev                   # Start all apps in dev mode
pnpm build                 # Build all apps
pnpm dev:mobile            # Start mobile app only
pnpm dev:web               # Start web app only
pnpm dev:admin             # Start admin app only

# Mobile app commands (from apps/mobile/)
pnpm start                 # Start Expo dev server
pnpm ios                   # Start iOS simulator
pnpm android               # Start Android emulator

# Web app commands (from apps/web/)
pnpm dev                   # Start Next.js dev server
pnpm build                 # Build for production
```

## Architecture

### Mobile App (apps/mobile/)

Uses expo-router for file-based navigation:
- `app/_layout.tsx` - Root layout with AuthProvider
- `app/(auth)/` - Login, register, forgot password
- `app/(onboarding)/` - User onboarding flow
- `app/(tabs)/` - Main app tabs
- `app/event/[id].tsx` - Event detail
- `app/party/[id].tsx` - Party detail

### Web App (apps/web/)

Uses Next.js App Router with SSR:
- `app/layout.tsx` - Root layout with providers
- `app/(auth)/` - Auth pages
- `app/(main)/` - Main pages (events, explore, create, profile)
- `app/(onboarding)/` - Onboarding flow
- `app/event/[id]/` - Event detail (SSR)
- `app/party/[id]/` - Party detail (SSR)
- `middleware.ts` - Auth protection

### Shared Packages

```typescript
// Import from shared packages
import { User, Event, Party } from '@aftr/shared/types';
import { formatDate, formatTime } from '@aftr/shared/utils';
import { colors } from '@aftr/shared/constants';
import { createClient } from '@aftr/supabase/client';
```

### Data Model

Core entities in `packages/shared/types/database.ts`:
- **User** - Profile with age, gender, Instagram handle
- **Event** - Club events with venue, date, location
- **Party** - Pre/after parties linked to events
- **PartyAttendee** - Join table for party attendance
- **Report** - User reports for moderation

### Auth Flow

1. Session check on page load
2. No session → redirect to `/login`
3. Session but `!onboarding_complete` → redirect to `/onboarding/welcome`
4. Complete user → main app
5. Banned users → `/banned`

## Environment Variables

### Mobile (apps/mobile/.env)
```
EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### Web (apps/web/.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## Tech Stack

| App | Framework | Styling | Auth/DB |
|-----|-----------|---------|---------|
| Mobile | Expo + React Native | NativeWind | Supabase |
| Web | Next.js 15 | Tailwind + shadcn/ui | Supabase SSR |
| Admin | Vite + React | Tailwind | Supabase |
