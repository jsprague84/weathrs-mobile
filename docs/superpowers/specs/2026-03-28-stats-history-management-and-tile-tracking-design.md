# Stats, History Management & Tile Tracking Design Spec

**Date:** 2026-03-28
**Status:** Approved
**Scope:** Weathrs Mobile (Expo 54 / RN 0.81) + Weathrs Backend (Rust)

---

## Overview

Three improvements to the system stats feature:
1. **History management** — delete stale location records and clean up duplicates from the location_key migration
2. **Backfill display fix** — ensure stats show the correct canonical city name per location_key group
3. **Client-side tile usage tracking** — count OWM radar tile and Google Maps tile loads on the device, report to backend, display against free-tier budget limits

---

## 1. History Management

### Backend — Delete History by Location

New endpoint:

```
DELETE /api/v1/history/{location_key}
```

- Deletes all `weather_history` rows matching the given `location_key`
- Returns `{ "success": true, "deleted": <count> }`
- Protected by existing API key middleware

### Backend — Duplicate Cleanup

New function `cleanup_duplicate_locations()` in the history repository:
1. Finds `location_key` values that have multiple distinct `city` strings
2. For each group, identifies the most common `city` name
3. Updates all rows in that group to use the most common name (normalizes the display name)
4. Returns the count of updated records

Triggered:
- **Automatically on server startup** after migrations complete
- **On demand** via new endpoint: `POST /api/v1/history/cleanup` (protected by API key)
- Returns `{ "success": true, "updated": <count> }`

### Mobile — Stats UI Changes

Each city row in the History Coverage section gets a **delete button** (trash icon, right-aligned). Tapping shows a confirmation alert:
> "Delete all history for {city}? {recordCount} records will be permanently removed."

On confirm, calls `DELETE /api/v1/history/{location_key}`, then refreshes stats.

A **"Clean Up Duplicates"** button appears at the bottom of the History Coverage section. On press, calls `POST /api/v1/history/cleanup` and displays the result (e.g., "Cleaned up 42 records").

---

## 2. Backfill Display Fix

### Problem

The stats query groups by `location_key` but selects an arbitrary `city` name from each group. After the migration, the same location_key may have rows with different city strings ("52726", "Blue Grass", etc.), and the displayed name is unpredictable.

### Backend — SQL Fix

Update the `get_stats()` query to pick the most common `city` name per `location_key`:

```sql
SELECT
  (SELECT city FROM weather_history h2
   WHERE h2.location_key = weather_history.location_key
   GROUP BY city ORDER BY COUNT(*) DESC LIMIT 1) as city,
  location_key,
  COUNT(*) as record_count,
  MIN(timestamp) as earliest_timestamp,
  MAX(timestamp) as latest_timestamp,
  COUNT(DISTINCT date(timestamp, 'unixepoch')) as distinct_days
FROM weather_history
GROUP BY location_key
ORDER BY record_count DESC
```

### Mobile — Display Enhancement

Add `location_key` as a subtitle under the city name in the stats display (e.g., small gray text "41.51,-90.77"). This makes the canonical coordinates visible and clarifies when different inputs resolved to the same location.

### Stats Response Type Update

Add `location_key` to the city stats in the `StatsResponse` type:

```typescript
cities: Array<{
  city: string;
  locationKey: string;  // new
  recordCount: number;
  earliestTimestamp: number;
  latestTimestamp: number;
  missingDays: number;
}>;
```

---

## 3. Client-Side Tile Usage Tracking

### Mobile — Tile Counter Module

New file `src/services/tileTracker.ts`:

```typescript
incrementOWM(): void      // called on radar tile viewport changes
incrementGoogleMaps(): void  // called on map region changes
getCounts(): { owmTiles: number, googleMapsTiles: number }
reset(): void             // clear after reporting
```

**OWM tile counting:** Each time the radar map loads (tab focus) or the layer/region changes, estimate ~12 tiles per viewport load and increment.

**Google Maps tile counting:** Each `onRegionChangeComplete` event on the MapView estimates ~12 tiles loaded and increment.

### Mobile — Reporting via Stats Refresh

The existing `useStats()` hook (60-second refresh) is modified:
1. Before fetching stats, POST accumulated tile counts to `POST /api/v1/stats/tiles`
2. Fetch stats as usual (response now includes tile usage)
3. Reset local counters after successful POST

### Backend — Tile Usage Storage

New migration:

```sql
CREATE TABLE IF NOT EXISTS tile_usage (
    date TEXT NOT NULL,
    owm_tiles INTEGER NOT NULL DEFAULT 0,
    google_maps_tiles INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY(date)
);
```

Counts accumulate across all devices per UTC day. The POST endpoint adds to the existing day's counts:

```
POST /api/v1/stats/tiles
Body: { "owm_tiles": 12, "google_maps_tiles": 24 }
```

Uses `INSERT OR REPLACE` with `owm_tiles = owm_tiles + ?` pattern (SQLite upsert).

### Backend — Stats Response Update

New field in `StatsResponse`:

```json
"tileUsage": {
  "owmTiles": { "usedToday": 342, "dailyLimit": 1000 },
  "googleMapsTiles": { "usedToday": 1204, "dailyLimit": 28500 }
}
```

Daily limits are config values (`owm_tile_daily_limit`, `google_maps_tile_daily_limit`) with defaults of 1,000 and 28,500 respectively. Not enforced — informational only.

### Mobile — Stats UI Display

New "Tile Usage" section in stats, displayed the same way as the existing API Budget section:
- Progress bar for OWM tiles: `342 / 1,000` with color coding
- Progress bar for Google Maps tiles: `1,204 / 28,500` with color coding
- Same green (<50%) / yellow (50-80%) / red (>80%) thresholds as API budget

---

## 4. Files Changed

### Backend (~/dev/weathrs)

| File | Change |
|---|---|
| `src/routes.rs` | Add DELETE history, POST cleanup, POST tiles routes |
| `src/history/handlers.rs` | Add delete_history and cleanup handlers |
| `src/db/history_repo.rs` | Add delete_by_location_key(), cleanup_duplicate_locations(), fix get_stats() query |
| `src/stats.rs` | Add tile_usage to StatsResponse, add tile reporting handler |
| `src/main.rs` | Run cleanup_duplicate_locations() on startup |
| `src/config.rs` | Add tile daily limit config values |
| `migrations/005_create_tile_usage.sql` | New tile_usage table |
| `src/db/mod.rs` | Register migration 005 |

### Mobile (~/dev/weathrs-mobile)

| File | Change |
|---|---|
| `src/services/tileTracker.ts` | New — tile counting module |
| `src/services/api.ts` | Add deleteHistory(), cleanupHistory(), reportTiles() methods |
| `src/types/weather.ts` | Update StatsResponse with tileUsage and locationKey |
| `src/hooks/useWeather.ts` | Modify useStats() to report tiles before fetching |
| `src/components/RadarMap.tsx` | Call tileTracker on region change |
| `app/settings.tsx` | Add delete buttons, cleanup button, tile usage display |

---

## 5. Out of Scope

- Enforcing tile limits (blocking tile loads when budget exceeded)
- Per-device tile tracking (only aggregate daily totals)
- OWM/Google dashboard API integration
- Historical tile usage charts (only shows today's count)
