# Stats, History Management & Tile Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add history record deletion, duplicate cleanup, tile usage tracking, and fix the backfill display in the stats feature.

**Architecture:** Backend-first. Phase 1 adds the tile_usage table, history management endpoints, and fixes the stats query. Phase 2 adds client-side tile counting, stats reporting, and UI updates in the mobile app.

**Tech Stack:** Rust/Axum backend (~/dev/weathrs), Expo 54/React Native 0.81 mobile (~/dev/weathrs-mobile)

**Spec:** `docs/superpowers/specs/2026-03-28-stats-history-management-and-tile-tracking-design.md`

---

## Phase 1: Backend

All tasks in this phase are in **~/dev/weathrs** on branch `feature/location-unification-and-radar`.

---

### Task 1: Create tile_usage migration and register it

**Files:**
- Create: `migrations/005_create_tile_usage.sql`
- Modify: `src/db/mod.rs`

- [ ] **Step 1: Create migration SQL**

Create `migrations/005_create_tile_usage.sql`:

```sql
CREATE TABLE IF NOT EXISTS tile_usage (
    date TEXT NOT NULL,
    owm_tiles INTEGER NOT NULL DEFAULT 0,
    google_maps_tiles INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY(date)
);
```

- [ ] **Step 2: Register migration in db/mod.rs**

In `src/db/mod.rs`, add after the migration 004 block:

```rust
sqlx::raw_sql(include_str!("../../migrations/005_create_tile_usage.sql"))
    .execute(pool)
    .await
    .map_err(|e| DbError::Migration(format!("Migration 005 failed: {}", e)))?;
```

- [ ] **Step 3: Build and verify**

Run: `cargo build`

- [ ] **Step 4: Commit**

```bash
git add migrations/005_create_tile_usage.sql src/db/mod.rs
git commit -m "feat: add tile_usage table migration"
```

---

### Task 2: Add tile config values and tile usage to stats

**Files:**
- Modify: `src/config.rs`
- Modify: `src/stats.rs`
- Modify: `src/routes.rs`

- [ ] **Step 1: Add tile limit config values**

In `src/config.rs`, add two fields to `AppConfig`:

```rust
#[serde(default = "default_owm_tile_daily_limit")]
pub owm_tile_daily_limit: u32,
#[serde(default = "default_google_maps_tile_daily_limit")]
pub google_maps_tile_daily_limit: u32,
```

Add the default functions:

```rust
fn default_owm_tile_daily_limit() -> u32 {
    1000
}

fn default_google_maps_tile_daily_limit() -> u32 {
    28500
}
```

- [ ] **Step 2: Add tile usage types and handler to stats.rs**

In `src/stats.rs`, add the new types:

```rust
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TileUsageStats {
    pub owm_tiles: TileBudget,
    pub google_maps_tiles: TileBudget,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TileBudget {
    pub used_today: i64,
    pub daily_limit: u32,
}
```

Add `tile_usage` field to `StatsResponse`:

```rust
pub tile_usage: TileUsageStats,
```

In the `get_stats` handler, query today's tile usage:

```rust
let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
let tile_row: Option<(i64, i64)> = sqlx::query_as(
    "SELECT owm_tiles, google_maps_tiles FROM tile_usage WHERE date = ?"
)
.bind(&today)
.fetch_optional(&state.db_pool)
.await
.unwrap_or(None);

let tile_usage = TileUsageStats {
    owm_tiles: TileBudget {
        used_today: tile_row.map(|r| r.0).unwrap_or(0),
        daily_limit: state.config.owm_tile_daily_limit,
    },
    google_maps_tiles: TileBudget {
        used_today: tile_row.map(|r| r.1).unwrap_or(0),
        daily_limit: state.config.google_maps_tile_daily_limit,
    },
};
```

Add a tile reporting handler:

```rust
#[derive(Deserialize)]
pub struct TileReport {
    pub owm_tiles: i64,
    pub google_maps_tiles: i64,
}

pub async fn report_tiles(
    State(state): State<AppState>,
    Json(report): Json<TileReport>,
) -> Json<serde_json::Value> {
    let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
    let _ = sqlx::query(
        "INSERT INTO tile_usage (date, owm_tiles, google_maps_tiles) VALUES (?, ?, ?)
         ON CONFLICT(date) DO UPDATE SET
           owm_tiles = owm_tiles + excluded.owm_tiles,
           google_maps_tiles = google_maps_tiles + excluded.google_maps_tiles"
    )
    .bind(&today)
    .bind(report.owm_tiles)
    .bind(report.google_maps_tiles)
    .execute(&state.db_pool)
    .await;

    Json(serde_json::json!({ "success": true }))
}
```

- [ ] **Step 3: Add the tile report route**

In `src/routes.rs`, add in `api_v1_routes()`:

```rust
.route("/stats/tiles", post(stats::report_tiles))
```

Add `post` to the `use axum::routing::{get, post, ...}` import if not already there.

- [ ] **Step 4: Build and verify**

Run: `cargo build`

- [ ] **Step 5: Commit**

```bash
git add src/config.rs src/stats.rs src/routes.rs
git commit -m "feat: add tile usage tracking to stats endpoint"
```

---

### Task 3: Fix get_stats() query for canonical city name

**Files:**
- Modify: `src/db/history_repo.rs`

- [ ] **Step 1: Update the get_stats() SQL query**

In `src/db/history_repo.rs`, replace the existing query in `get_stats()` (around lines 444-451) with:

```rust
let city_rows: Vec<CityStatsRow> = sqlx::query_as(
    "SELECT
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
     ORDER BY record_count DESC",
)
.fetch_all(&self.pool)
.await?;
```

- [ ] **Step 2: Build and test**

Run: `cargo build && cargo test`

- [ ] **Step 3: Commit**

```bash
git add src/db/history_repo.rs
git commit -m "fix: use most common city name per location_key in stats query"
```

---

### Task 4: Add history delete and cleanup endpoints

**Files:**
- Modify: `src/db/history_repo.rs`
- Modify: `src/history/handlers.rs`
- Modify: `src/history/service.rs`
- Modify: `src/routes.rs`

- [ ] **Step 1: Add delete_by_location_key() to history repo**

In `src/db/history_repo.rs`, add to the `HistoryRepository` trait:

```rust
async fn delete_by_location_key(&self, location_key: &str) -> Result<u64, DbError>;
```

Add the implementation in `SqliteHistoryRepository`:

```rust
async fn delete_by_location_key(&self, location_key: &str) -> Result<u64, DbError> {
    let result = sqlx::query("DELETE FROM weather_history WHERE location_key = ?")
        .bind(location_key)
        .execute(&self.pool)
        .await?;
    Ok(result.rows_affected())
}
```

- [ ] **Step 2: Add cleanup_duplicate_locations() to history repo**

In `src/db/history_repo.rs`, add to the `HistoryRepository` trait:

```rust
async fn cleanup_duplicate_locations(&self) -> Result<u64, DbError>;
```

Add the implementation:

```rust
async fn cleanup_duplicate_locations(&self) -> Result<u64, DbError> {
    // For each location_key that has multiple city names,
    // update all rows to use the most common city name
    let result = sqlx::query(
        "UPDATE weather_history
         SET city = (
           SELECT city FROM weather_history h2
           WHERE h2.location_key = weather_history.location_key
           GROUP BY city ORDER BY COUNT(*) DESC LIMIT 1
         )
         WHERE location_key IN (
           SELECT location_key FROM weather_history
           GROUP BY location_key
           HAVING COUNT(DISTINCT city) > 1
         )"
    )
    .execute(&self.pool)
    .await?;
    Ok(result.rows_affected())
}
```

- [ ] **Step 3: Add service methods**

In `src/history/service.rs`, add public methods that delegate to the repo:

```rust
pub async fn delete_by_location_key(&self, location_key: &str) -> Result<u64> {
    Ok(self.repo.delete_by_location_key(location_key).await?)
}

pub async fn cleanup_duplicate_locations(&self) -> Result<u64> {
    Ok(self.repo.cleanup_duplicate_locations().await?)
}
```

- [ ] **Step 4: Add handlers**

In `src/history/handlers.rs`, add:

```rust
pub async fn delete_history(
    State(state): State<AppState>,
    Path(location_key): Path<String>,
) -> Result<Json<serde_json::Value>, HistoryError> {
    let deleted = state
        .history_service
        .delete_by_location_key(&location_key)
        .await
        .map_err(|e| HistoryError::Internal(e.to_string()))?;

    Ok(Json(serde_json::json!({
        "success": true,
        "deleted": deleted
    })))
}

pub async fn cleanup_history(
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, HistoryError> {
    let updated = state
        .history_service
        .cleanup_duplicate_locations()
        .await
        .map_err(|e| HistoryError::Internal(e.to_string()))?;

    Ok(Json(serde_json::json!({
        "success": true,
        "updated": updated
    })))
}
```

- [ ] **Step 5: Add routes**

In `src/routes.rs`, update `history_routes()`:

```rust
fn history_routes() -> Router<AppState> {
    Router::new()
        .route("/history/{city}", get(history_handlers::get_history))
        .route("/history/{city}/daily", get(history_handlers::get_daily_history))
        .route("/history/{city}/trends", get(history_handlers::get_trends))
        .route("/history/location/{location_key}", delete(history_handlers::delete_history))
        .route("/history/cleanup", post(history_handlers::cleanup_history))
}
```

Add `delete` to the routing import.

- [ ] **Step 6: Run startup cleanup in main.rs**

In `src/main.rs`, after the database migrations and service initialization, add:

```rust
// Run one-time duplicate location cleanup
match state.history_service.cleanup_duplicate_locations().await {
    Ok(updated) if updated > 0 => {
        tracing::info!("Cleaned up {} duplicate location records", updated);
    }
    Ok(_) => {}
    Err(e) => {
        tracing::warn!("Duplicate location cleanup failed: {}", e);
    }
}
```

- [ ] **Step 7: Build and test**

Run: `cargo build && cargo test`

- [ ] **Step 8: Run cargo fmt and clippy**

Run: `cargo fmt && cargo clippy -- -D warnings`

- [ ] **Step 9: Commit**

```bash
git add src/db/history_repo.rs src/history/handlers.rs src/history/service.rs src/routes.rs src/main.rs
git commit -m "feat: add history delete, duplicate cleanup endpoints, and startup cleanup"
```

---

## Phase 2: Mobile

All tasks in this phase are in **~/dev/weathrs-mobile** on branch `feature/location-unification-and-radar`.

---

### Task 5: Update StatsResponse type and add API methods

**Files:**
- Modify: `src/types/weather.ts`
- Modify: `src/services/api.ts`

- [ ] **Step 1: Update StatsResponse type**

In `src/types/weather.ts`, update the `StatsResponse` interface. Add `tileUsage` and update the `cities` array to include `locationKey`:

Add after the existing `StatsResponse.database` field:

```typescript
tileUsage: {
  owmTiles: { usedToday: number; dailyLimit: number };
  googleMapsTiles: { usedToday: number; dailyLimit: number };
};
```

Update the `history.cities` array items to include `locationKey`:

In the `history` object within `StatsResponse`, find the cities array type and add:

```typescript
locationKey: string;
```

(The field name is `locationKey` in camelCase because the backend uses `#[serde(rename_all = "camelCase")]`.)

- [ ] **Step 2: Add API methods**

In `src/services/api.ts`, add these methods to the `WeathrsApi` class:

```typescript
async deleteHistory(locationKey: string): Promise<{ success: boolean; deleted: number }> {
  return this.request(`/history/location/${encodeURIComponent(locationKey)}`, {
    method: 'DELETE',
    useApiKey: true,
  });
}

async cleanupHistory(): Promise<{ success: boolean; updated: number }> {
  return this.request('/history/cleanup', {
    method: 'POST',
    useApiKey: true,
  });
}

async reportTiles(owmTiles: number, googleMapsTiles: number): Promise<{ success: boolean }> {
  return this.request('/stats/tiles', {
    method: 'POST',
    body: JSON.stringify({ owm_tiles: owmTiles, google_maps_tiles: googleMapsTiles }),
  });
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Note: There may be errors in settings.tsx where it references the old StatsResponse shape — these will be fixed in Task 8.

- [ ] **Step 4: Commit**

```bash
git add src/types/weather.ts src/services/api.ts
git commit -m "feat: update StatsResponse type and add history/tile API methods"
```

---

### Task 6: Create tile tracker module

**Files:**
- Create: `src/services/tileTracker.ts`

- [ ] **Step 1: Create the module**

Create `src/services/tileTracker.ts`:

```typescript
const TILES_PER_VIEWPORT = 12;

let owmTiles = 0;
let googleMapsTiles = 0;

export const tileTracker = {
  incrementOWM() {
    owmTiles += TILES_PER_VIEWPORT;
  },

  incrementGoogleMaps() {
    googleMapsTiles += TILES_PER_VIEWPORT;
  },

  getCounts() {
    return { owmTiles, googleMapsTiles };
  },

  reset() {
    owmTiles = 0;
    googleMapsTiles = 0;
  },

  hasCounts() {
    return owmTiles > 0 || googleMapsTiles > 0;
  },
};
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/services/tileTracker.ts
git commit -m "feat: create tile tracker module for client-side usage counting"
```

---

### Task 7: Wire tile tracking into RadarMap and useStats

**Files:**
- Modify: `src/components/RadarMap.tsx`
- Modify: `src/hooks/useWeather.ts`

- [ ] **Step 1: Add tile tracking to RadarMap**

In `src/components/RadarMap.tsx`, import the tracker and add an `onRegionChangeComplete` callback:

```typescript
import { tileTracker } from '@/services/tileTracker';
```

Add a callback to the MapView:

```typescript
const handleRegionChange = useCallback(() => {
  tileTracker.incrementOWM();
  tileTracker.incrementGoogleMaps();
}, []);
```

Add the prop to MapView:

```typescript
onRegionChangeComplete={handleRegionChange}
```

Also call `tileTracker.incrementOWM()` and `tileTracker.incrementGoogleMaps()` once on initial mount via the existing useEffect or a new one:

```typescript
useEffect(() => {
  tileTracker.incrementOWM();
  tileTracker.incrementGoogleMaps();
}, []);
```

- [ ] **Step 2: Modify useStats to report tiles**

In `src/hooks/useWeather.ts`, update the `useStats()` hook to report tile counts before fetching:

```typescript
import { tileTracker } from '@/services/tileTracker';

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      // Report accumulated tile counts before fetching stats
      if (tileTracker.hasCounts()) {
        const counts = tileTracker.getCounts();
        try {
          await api.reportTiles(counts.owmTiles, counts.googleMapsTiles);
          tileTracker.reset();
        } catch {
          // Don't fail stats fetch if tile reporting fails
        }
      }
      return api.getStats();
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/RadarMap.tsx src/hooks/useWeather.ts
git commit -m "feat: wire tile tracking into radar map and stats refresh"
```

---

### Task 8: Update settings stats UI

**Files:**
- Modify: `app/settings.tsx`

- [ ] **Step 1: Add delete buttons to history city rows**

In the History Coverage section of `app/settings.tsx`, find where city stats are rendered. Add a trash icon button to each row:

```typescript
import { Alert } from 'react-native';

// In the city stats map, add to each row:
<Pressable
  onPress={() => {
    Alert.alert(
      'Delete History',
      `Delete all history for ${cityStat.city}? ${cityStat.recordCount} records will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteHistory(cityStat.locationKey);
              queryClient.invalidateQueries({ queryKey: ['stats'] });
            } catch (e) {
              Alert.alert('Error', 'Failed to delete history');
            }
          },
        },
      ]
    );
  }}
  accessibilityRole="button"
  accessibilityLabel={`Delete history for ${cityStat.city}`}
>
  <Ionicons name="trash-outline" size={18} color={colors.error} />
</Pressable>
```

- [ ] **Step 2: Add location_key subtitle to each city row**

Under the city name text, add:

```typescript
<Text style={{ fontSize: 10, color: colors.textMuted }}>{cityStat.locationKey}</Text>
```

- [ ] **Step 3: Add cleanup button**

After the city stats list, add a "Clean Up Duplicates" button:

```typescript
<Pressable
  onPress={async () => {
    try {
      const result = await api.cleanupHistory();
      Alert.alert('Cleanup Complete', `Updated ${result.updated} records`);
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    } catch (e) {
      Alert.alert('Error', 'Cleanup failed');
    }
  }}
  style={[styles.cleanupButton, { backgroundColor: colors.card, borderColor: colors.border }]}
  accessibilityRole="button"
  accessibilityLabel="Clean up duplicate location records"
>
  <Ionicons name="sparkles-outline" size={16} color={colors.primary} />
  <Text style={{ color: colors.primary, fontSize: 13, marginLeft: 6 }}>Clean Up Duplicates</Text>
</Pressable>
```

Add the style:

```typescript
cleanupButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 10,
  marginTop: 8,
  borderRadius: 8,
  borderWidth: 1,
},
```

- [ ] **Step 4: Add tile usage section**

After the API Budget section, add a "Tile Usage" section using the same progress bar pattern:

```typescript
{stats.tileUsage && (
  <>
    <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Tile Usage</Text>

    {/* OWM Tiles */}
    <View style={styles.budgetRow}>
      <Text style={[styles.budgetLabel, { color: colors.text }]}>OWM Tiles</Text>
      <Text style={[styles.budgetValue, { color: colors.textSecondary }]}>
        {stats.tileUsage.owmTiles.usedToday} / {stats.tileUsage.owmTiles.dailyLimit}
      </Text>
    </View>
    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${Math.min((stats.tileUsage.owmTiles.usedToday / stats.tileUsage.owmTiles.dailyLimit) * 100, 100)}%`,
            backgroundColor:
              stats.tileUsage.owmTiles.usedToday / stats.tileUsage.owmTiles.dailyLimit < 0.5
                ? colors.success
                : stats.tileUsage.owmTiles.usedToday / stats.tileUsage.owmTiles.dailyLimit < 0.8
                  ? colors.warning
                  : colors.error,
          },
        ]}
      />
    </View>

    {/* Google Maps Tiles */}
    <View style={styles.budgetRow}>
      <Text style={[styles.budgetLabel, { color: colors.text }]}>Google Maps</Text>
      <Text style={[styles.budgetValue, { color: colors.textSecondary }]}>
        {stats.tileUsage.googleMapsTiles.usedToday} / {stats.tileUsage.googleMapsTiles.dailyLimit}
      </Text>
    </View>
    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${Math.min((stats.tileUsage.googleMapsTiles.usedToday / stats.tileUsage.googleMapsTiles.dailyLimit) * 100, 100)}%`,
            backgroundColor:
              stats.tileUsage.googleMapsTiles.usedToday / stats.tileUsage.googleMapsTiles.dailyLimit < 0.5
                ? colors.success
                : stats.tileUsage.googleMapsTiles.usedToday / stats.tileUsage.googleMapsTiles.dailyLimit < 0.8
                  ? colors.warning
                  : colors.error,
          },
        ]}
      />
    </View>
  </>
)}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add app/settings.tsx
git commit -m "feat: add history management, tile usage display, and cleanup to stats UI"
```

---

### Task 9: Final verification

- [ ] **Step 1: Run full type check**

```bash
cd ~/dev/weathrs-mobile && npx tsc --noEmit
```

- [ ] **Step 2: Verify backend**

```bash
cd ~/dev/weathrs && cargo build && cargo fmt -- --check && cargo clippy -- -D warnings
```

- [ ] **Step 3: Commit any fixes**

```bash
git add -A && git commit -m "chore: final cleanup for stats and tile tracking"
```

---

## Summary

| Phase | Tasks | Repo | Deliverables |
|-------|-------|------|-------------|
| 1: Backend | 1-4 | ~/dev/weathrs | tile_usage table, tile reporting endpoint, stats query fix, delete/cleanup endpoints, startup cleanup |
| 2: Mobile | 5-9 | ~/dev/weathrs-mobile | StatsResponse update, tileTracker module, RadarMap tracking, stats UI with delete/cleanup/tile display |
