# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Next.js 16 + Turbopack)
npm run build        # Production build
npm run lint         # ESLint (next/core-web-vitals + typescript)
npx prisma migrate dev   # Run DB migrations
npx prisma generate      # Regenerate Prisma client
```

## Environment Variables

```
DATABASE_URL=file:./dev.db
ANTHROPIC_API_KEY=<claude-api-key>
XAI_API_KEY=<grok-api-key>
```

## Architecture

### Data Hierarchy
Project → Build → FeedbackFile / FeedbackResponse / BuildAnalysis
Project → Category (analysis tags), Task (action items)
Task → TaskHistory (status per build)

### Analysis Pipeline (`src/lib/analysis/`)
Multi-stage LLM orchestration with SSE streaming:

1. **Classify** (Grok 4.1) — batch-processes responses in groups of 50, up to 3 concurrent batches. Uses "slim" output format (no text field) to save tokens.
2. **User Advocate** (Grok 4.1) — extracts pain points, frustrations, churn risk
3. **Design Advocate** (Claude Sonnet) — compares feedback against project direction doc
4. **Synthesizer** (Claude Sonnet) — reconciles conflicting signals, generates priority ranking

Analysis levels: `quick` (stages 1+4), `standard` (1+2+4), `deep` (1+2+3+4, stages 2&3 parallel).

Each stage completion saves results to DB immediately via `onStageChange` callback — if a later stage fails, earlier results persist.

### Cost Optimization
Grok 4.1 ($0.2/$0.5 per M tokens) handles classification and user advocacy. Claude Sonnet ($3/$15) handles design analysis and synthesis requiring deeper reasoning. APICallLog tracks per-call costs.

### File Upload Pipeline
1. Upload → `parseXlsx()` with `flattenCellValue()` for ExcelJS objects → auto-detect column types
2. User reviews/overrides column types in ColumnMapper UI
3. Confirm → extracts text from `open_text` columns, creates FeedbackResponse records
4. Rows with no text content in open_text columns are skipped

### SSE Streaming (`/api/analyze/qualitative/stream`)
Analysis runs server-side in background. Client receives progress events via `text/event-stream`. DB saves happen server-side regardless of client connection state.

### Prisma
SQLite with BetterSqlite3 adapter. Generated client at `src/generated/prisma/`. Cascade deletes on all FKs.

## Mandatory Patterns

### ExcelJS Cell Values
ExcelJS returns objects for rich text (`{richText: [{text: '...'}]}`), hyperlinks, dates. Always use `flattenCellValue()` from `src/lib/parsers/xlsx-parser.ts`. Never use `String(cellValue)` directly — produces `[object Object]`.

### React Keys
Never use objects or column values as React keys. Always use index-based keys: `key={idx}`.

### DB-Backed State
Pages lose React state on navigation. Any data saved to DB must be fetched on mount, not stored in `useState` alone. Example: response list should come from `/api/builds/${id}`, not `savedCount` state.

### Transaction Safety
Multi-step DB operations (deleteMany → createMany) must use `prisma.$transaction([...])` to prevent data loss on partial failure.

### JSON.parse Safety
Always wrap `JSON.parse` in try-catch, especially for LLM-generated JSON stored in DB (`qualitativeJson`, `categories`, `resultJson`). Partial analysis results may contain truncated JSON.

### useEffect Dependencies
Never include state variables that trigger re-renders in fetch-effect dependencies unless the fetch should re-run. Example: `selectedBuildId` should NOT be in the builds-list fetch effect.

### Error Handling
Never silently swallow errors with `.catch(() => {})`. At minimum use `console.error`.

## Theme
Custom warm palette: `bg: #F5F0E8`, `card: #FFFDF7`, accents (orange, blue, green, gold). Fonts: Playfair Display (display), DM Sans (body). Dark mode via CSS class.
