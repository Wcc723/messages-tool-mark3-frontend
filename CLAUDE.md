# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 + TypeScript frontend application for a Discord automated scheduling message tool (Discord 自動化排程訊息工具). It's part of the Hexschool toolman project (Mark 3). The application allows users to manage Discord bot messages with scheduled delivery.

## Tech Stack

- **Framework**: Vue 3 with Composition API
- **Language**: TypeScript
- **Build Tool**: Vite 7
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **Styling**: Tailwind CSS 4
- **Linting**: ESLint with oxlint for performance-critical correctness checks
- **Formatting**: Prettier

## Required Environment

- Node.js: ^20.19.0 || >=22.12.0
- Package Manager: pnpm 9.9.0 (specified in package.json)

## Common Commands

**Note: This project uses pnpm as the package manager.**

```bash
# Installation
pnpm install

# Development
pnpm run dev              # Start dev server with hot-reload

# Building
pnpm run build           # Type-check + build for production
pnpm run build-only      # Build without type-checking
pnpm run type-check      # Run TypeScript compiler check
pnpm run preview         # Preview production build locally

# Code Quality
pnpm run lint            # Run all linters (oxlint + eslint) with auto-fix
pnpm run lint:oxlint     # Run oxlint with auto-fix (correctness checks)
pnpm run lint:eslint     # Run ESLint with auto-fix
pnpm run format          # Format code with Prettier
```

## Architecture

### Path Alias
- `@/` is aliased to `./src/` (configured in vite.config.ts:14-16)

### Directory Structure
- `src/main.ts` - Application entry point, sets up Pinia and Router
- `src/App.vue` - Root component
- `src/router/` - Vue Router configuration (currently empty routes array)
- `src/stores/` - Pinia stores using Composition API pattern

### State Management
Stores use Pinia with the Composition API pattern (setup function style). Example in `src/stores/counter.ts`:
- Define reactive state with `ref()`
- Define computed properties with `computed()`
- Define actions as regular functions
- Return all exposed properties and methods

### Linting Strategy
The project uses a two-tier linting approach:
1. **oxlint** runs first for fast correctness checks (ignores style issues)
2. **ESLint** runs second with Vue and TypeScript rules
3. Both run sequentially via `npm run lint`

### Code Style
- No semicolons
- Single quotes
- 100 character line width
- Vue SFC files use `<script setup lang="ts">` syntax

### Styling with Tailwind CSS 4
- Tailwind CSS 4 is integrated via `@tailwindcss/vite` plugin
- Global styles imported in `src/main.ts` from `src/assets/main.css`
- Uses the new `@import 'tailwindcss'` syntax (Tailwind 4 approach)
- No separate configuration file needed - Tailwind 4 works out of the box
- Use utility classes directly in Vue component templates

## API Integration

The frontend integrates with a RESTful API documented in `openapi.json`. Key API features:

### Authentication
- **JWT-based**: Uses Bearer token authentication
- **OAuth Support**: Google OAuth integration available
- **Token Refresh**: `/api/auth/refresh` endpoint for token renewal
- **User Management**: Profile updates, password changes

### Discord Integration
- **Bot Validation**: Verify Discord bot connection status
- **Guild Management**: List Discord servers the bot has joined
- **Channel Access**: Retrieve channels from specific guilds
- **Message Sending**: Send test and scheduled messages to Discord channels

### Schedule Management
- **Schedule Types**:
  - `once` - Single execution at specified date/time
  - `weekly` - Recurring weekly on specific day
  - `monthly` - Recurring monthly on specific date
- **Schedule Status**: `draft`, `active`, `paused`, `completed`
- **Timezone Support**: Multiple timezones (default: Asia/Taipei)
- **Execution Logs**: Track message delivery history with pagination

### API Response Format
All API responses follow this structure:
```typescript
{
  success: boolean
  message?: string
  data?: T // Response payload
}
```

### Key Data Models
- **User**: id, email, name, role (admin/user), avatar
- **Schedule**: title, content, scheduleType, scheduledTime, channelId, timezone, status
- **DiscordGuild**: id, name, icon, permissions, memberCount
- **DiscordChannel**: id, name, type, permissions
- **ExecutionLog**: status (success/failed/pending), executedAt, message, error

### Pagination
List endpoints support pagination with query parameters:
- `page` (default: 1)
- `limit` (default: 10 for schedules, 20 for logs)
- Additional filters: `status`, `search`
- 在 @CLAUDE.md 加入說明，本專案會使用 pnpm