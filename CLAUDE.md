# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AFTR is an Expo/React Native app for discovering and organizing pre-parties and after-parties for events. The app runs on iOS, Android, and web. It uses Supabase for backend (auth, database, storage) and expo-router for file-based navigation.

## Development Commands

```bash
npm start              # Start Expo dev server
npm run ios            # Start iOS simulator
npm run android        # Start Android emulator
npm run web            # Start web development
npm run build:web      # Build for web deployment (output to dist/)
npm run serve:web      # Serve the web build locally
```

## Architecture

### Routing Structure (expo-router)

- `app/_layout.tsx` - Root layout with AuthProvider, handles auth redirects
- `app/(auth)/` - Login, register, forgot password screens
- `app/(onboarding)/` - User onboarding flow (welcome, profile, location, instagram)
- `app/(tabs)/` - Main app tabs: events list, explore map, create party, profile
- `app/event/[id].tsx` - Event detail page
- `app/party/[id].tsx` - Party detail page
- `app/admin/` - Admin panel for managing users, events, parties

### Key Directories

- `components/` - Reusable UI components. Platform-specific variants use `.web.tsx` suffix (e.g., `DateTimePicker.tsx` for native, `DateTimePicker.web.tsx` for web)
- `context/AuthContext.tsx` - Auth state management using Supabase auth
- `lib/supabase.ts` - Supabase client configuration
- `lib/storage.ts` / `lib/storage.web.ts` - Platform-specific secure storage adapters
- `types/database.ts` - TypeScript types for Supabase tables (User, Event, Party, etc.)
- `constants/Colors.ts` - Theme colors

### Data Model

Core entities in `types/database.ts`:
- **User** - Profile with location, age, gender, Instagram handle
- **Event** - Club events with venue, date, location
- **Party** - Pre/after parties linked to events, with host, capacity, age range
- **PartyAttendee** - Join table for party attendance
- **Report** - User reports for moderation

### Auth Flow

1. Session check in `AuthContext`
2. No session → redirect to `(auth)/login`
3. Session but `!onboarding_complete` → redirect to `(onboarding)/welcome`
4. Complete user → `(tabs)` main app
5. Banned users see `BannedScreen`

### Platform Handling

- Use `Platform.OS` for platform checks
- Web-specific components use `.web.tsx` suffix (auto-resolved by Metro/webpack)
- SSR considerations: check `typeof window !== 'undefined'` before using browser APIs
- Auth redirects use `aftr://` scheme on native, `window.location.origin` on web

## Environment Variables

Required in `.env` or environment:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Path Alias

Use `@/` to import from project root (configured in tsconfig.json):
```typescript
import { supabase } from '@/lib/supabase';
import { User } from '@/types/database';
```
