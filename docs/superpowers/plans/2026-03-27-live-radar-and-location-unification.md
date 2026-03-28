# Live Radar & Location Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a live weather radar screen to the Weathrs mobile app and unify location handling across the entire stack so different inputs for the same physical location resolve to a single canonical record.

**Architecture:** Backend-first approach. Phase 1 adds the geocoding endpoint and migrates history storage to coordinate-based keys in the Rust backend. Phase 2 updates the mobile app's location model and reorganizes tabs. Phase 3 builds the radar screen using react-native-maps with OWM Weather Maps 1.0 tile overlays.

**Tech Stack:** Rust/Axum backend (~/dev/weathrs), Expo 54/React Native 0.81 mobile (~/dev/weathrs-mobile), react-native-maps ~1.27.x, OpenWeatherMap Weather Maps 1.0

**Spec:** `docs/superpowers/specs/2026-03-27-live-radar-and-location-unification-design.md`

---

## Phase 1: Backend — Geocoding Endpoint & History Migration

All tasks in this phase are in the **~/dev/weathrs** repository.

---

### Task 1: Add reverse geocoding to ForecastService

**Files:**
- Modify: `src/forecast/service.rs`

- [ ] **Step 1: Add reverse geocoding URL constant**

In `src/forecast/service.rs`, add after the existing constants (line 16):

```rust
const REVERSE_GEOCODING_API_URL: &str = "https://api.openweathermap.org/geo/1.0/reverse";
```

- [ ] **Step 2: Add is_coordinates() helper function**

In `src/forecast/service.rs`, add after `is_zip_code()` (after line 92):

```rust
/// Check if input looks like "lat,lon" coordinates (e.g., "41.51,-90.77")
fn is_coordinates(input: &str) -> bool {
    let parts: Vec<&str> = input.split(',').collect();
    if parts.len() != 2 {
        return false;
    }
    parts[0].trim().parse::<f64>().is_ok() && parts[1].trim().parse::<f64>().is_ok()
}
```

- [ ] **Step 3: Add reverse_geocode() method to ForecastService**

In `src/forecast/service.rs`, add after `geocode_zip()` (after line 198):

```rust
/// Reverse geocode coordinates to a location name
async fn reverse_geocode(&self, lat: f64, lon: f64) -> Result<GeoLocation> {
    self.api_budget.check_budget()?;
    self.api_budget.increment().await;

    let response = self.client
        .get(REVERSE_GEOCODING_API_URL)
        .query(&[
            ("lat", lat.to_string()),
            ("lon", lon.to_string()),
            ("limit", "1".to_string()),
            ("appid", self.api_key.clone()),
        ])
        .send()
        .await?;

    let locations: Vec<GeoLocation> = response.json().await?;
    locations.into_iter().next().ok_or_else(|| {
        anyhow::anyhow!("No results found for coordinates {},{}", lat, lon)
    })
}
```

- [ ] **Step 4: Update geocode() to handle coordinate inputs**

In `src/forecast/service.rs`, modify the `geocode()` method (around line 115-119) to add a coordinate branch before the zip/city check:

```rust
// Determine geocoding method
let geo = if is_coordinates(location) {
    let parts: Vec<&str> = location.split(',').collect();
    let lat: f64 = parts[0].trim().parse()?;
    let lon: f64 = parts[1].trim().parse()?;
    self.reverse_geocode(lat, lon).await?
} else if is_zip_code(location) {
    self.geocode_zip(location).await?
} else {
    self.geocode_city(location).await?
};
```

- [ ] **Step 5: Build and verify**

Run: `cargo build 2>&1 | head -30`
Expected: Compiles without errors.

- [ ] **Step 6: Commit**

```bash
git add src/forecast/service.rs
git commit -m "feat: add reverse geocoding and coordinate input support to ForecastService"
```

---

### Task 2: Add /api/v1/geocode endpoint

**Files:**
- Create: `src/geocode/mod.rs`
- Create: `src/geocode/handlers.rs`
- Create: `src/geocode/models.rs`
- Modify: `src/routes.rs`
- Modify: `src/main.rs`
- Modify: `src/lib.rs` (if it exists, otherwise `src/main.rs`)

- [ ] **Step 1: Create geocode models**

Create `src/geocode/models.rs`:

```rust
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Deserialize)]
pub struct GeocodeQuery {
    pub q: String,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct GeocodeResponse {
    pub name: String,
    pub lat: f64,
    pub lon: f64,
    pub country: String,
    pub state: Option<String>,
    pub location_key: String,
}

/// Round a coordinate to 2 decimal places for canonical keying
pub fn round_coord(val: f64) -> f64 {
    (val * 100.0).round() / 100.0
}

/// Generate a location_key from coordinates
pub fn make_location_key(lat: f64, lon: f64) -> String {
    format!("{:.2},{:.2}", round_coord(lat), round_coord(lon))
}
```

- [ ] **Step 2: Create geocode handler**

Create `src/geocode/handlers.rs`:

```rust
use axum::extract::{Query, State};
use axum::Json;

use crate::AppState;
use crate::geocode::models::{GeocodeQuery, GeocodeResponse, round_coord, make_location_key};

pub async fn geocode(
    State(state): State<AppState>,
    Query(query): Query<GeocodeQuery>,
) -> Result<Json<GeocodeResponse>, (axum::http::StatusCode, String)> {
    let geo = state
        .forecast_service
        .geocode(&query.q)
        .await
        .map_err(|e| {
            (axum::http::StatusCode::BAD_REQUEST, format!("Geocoding failed: {}", e))
        })?;

    let lat = round_coord(geo.lat);
    let lon = round_coord(geo.lon);

    Ok(Json(GeocodeResponse {
        name: geo.name,
        lat,
        lon,
        country: geo.country,
        state: geo.state,
        location_key: make_location_key(lat, lon),
    }))
}
```

- [ ] **Step 3: Create geocode module**

Create `src/geocode/mod.rs`:

```rust
pub mod handlers;
pub mod models;
```

- [ ] **Step 4: Register the module in main.rs**

In `src/main.rs`, add the module declaration with the other `mod` statements:

```rust
mod geocode;
```

- [ ] **Step 5: Add geocode route**

In `src/routes.rs`, add a new route function:

```rust
use crate::geocode::handlers as geocode_handlers;

fn geocode_routes() -> Router<AppState> {
    Router::new()
        .route("/geocode", get(geocode_handlers::geocode))
}
```

Then in `api_v1_routes()`, merge it with the other routes:

```rust
.merge(geocode_routes())
```

- [ ] **Step 6: Build and verify**

Run: `cargo build 2>&1 | head -30`
Expected: Compiles without errors.

- [ ] **Step 7: Test the endpoint manually**

Run the server and test:

```bash
cargo run &
sleep 2
curl -s "http://localhost:3000/api/v1/geocode?q=52726" | python3 -m json.tool
curl -s "http://localhost:3000/api/v1/geocode?q=Blue+Grass" | python3 -m json.tool
kill %1
```

Expected: Both return the same (or very similar) `location_key` value.

- [ ] **Step 8: Commit**

```bash
git add src/geocode/ src/routes.rs src/main.rs
git commit -m "feat: add /api/v1/geocode endpoint for canonical location resolution"
```

---

### Task 3: Add location_key column and migrate history data

**Files:**
- Create: `migrations/004_add_location_key.sql`
- Modify: `src/db/mod.rs`

- [ ] **Step 1: Create the migration SQL**

Create `migrations/004_add_location_key.sql`:

```sql
-- Add location_key column for coordinate-based canonical keying
ALTER TABLE weather_history ADD COLUMN location_key TEXT;

-- Backfill location_key from existing lat/lon (rounded to 2 decimal places)
UPDATE weather_history
SET location_key = CAST(ROUND(lat, 2) AS TEXT) || ',' || CAST(ROUND(lon, 2) AS TEXT);

-- Deduplicate: keep the row with the lowest id for each (location_key, timestamp, units) group
DELETE FROM weather_history
WHERE id NOT IN (
    SELECT MIN(id)
    FROM weather_history
    GROUP BY location_key, timestamp, units
);

-- Now make it NOT NULL
-- SQLite doesn't support ALTER COLUMN, so we verify all rows have a value
-- The UPDATE above ensures no NULLs remain

-- Drop old indexes
DROP INDEX IF EXISTS idx_history_city_ts;
DROP INDEX IF EXISTS idx_history_city_units;

-- Add new indexes for location_key-based queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_history_location_ts_units
    ON weather_history(location_key, timestamp, units);

CREATE INDEX IF NOT EXISTS idx_history_location_ts
    ON weather_history(location_key, timestamp);

-- Keep a city-based index for display lookups
CREATE INDEX IF NOT EXISTS idx_history_city
    ON weather_history(city);
```

- [ ] **Step 2: Register the migration in db/mod.rs**

In `src/db/mod.rs`, in the `run_migrations()` function, add after the existing migration executions:

```rust
sqlx::query(include_str!("../../migrations/004_add_location_key.sql"))
    .execute(&pool)
    .await
    .map_err(|e| DbError::Migration(format!("Migration 004 failed: {}", e)))?;
```

- [ ] **Step 3: Build and verify**

Run: `cargo build 2>&1 | head -30`
Expected: Compiles without errors.

- [ ] **Step 4: Test migration on a copy of the database**

```bash
cp data/weathrs.db data/weathrs.db.backup
cargo run &
sleep 3
curl -s "http://localhost:3000/health" | python3 -m json.tool
kill %1
```

Expected: Server starts without migration errors. Health endpoint returns ok.

- [ ] **Step 5: Verify migration results**

```bash
sqlite3 data/weathrs.db "SELECT location_key, COUNT(*) FROM weather_history GROUP BY location_key LIMIT 10;"
sqlite3 data/weathrs.db "SELECT COUNT(*) FROM weather_history WHERE location_key IS NULL;"
```

Expected: All rows have a `location_key`. NULL count is 0.

- [ ] **Step 6: Commit**

```bash
git add migrations/004_add_location_key.sql src/db/mod.rs
git commit -m "feat: add location_key column to weather_history with backfill and dedup migration"
```

---

### Task 4: Switch history queries to use location_key

**Files:**
- Modify: `src/db/history_repo.rs`
- Modify: `src/history/service.rs`
- Modify: `src/geocode/models.rs`

- [ ] **Step 1: Add location_key to HistoryRecord struct**

In `src/db/history_repo.rs`, add to the `HistoryRecord` struct (after the `city` field, around line 9):

```rust
pub location_key: String,
```

- [ ] **Step 2: Update HistoryRepository trait to use location_key**

In `src/db/history_repo.rs`, update the trait methods that query by city to query by location_key instead:

```rust
async fn get_range(
    &self,
    location_key: &str,
    start: i64,
    end: i64,
    units: &str,
) -> Result<Vec<HistoryRecord>, DbError>;

async fn get_daily_summary(
    &self,
    location_key: &str,
    start: i64,
    end: i64,
    units: &str,
) -> Result<Vec<DailySummaryRow>, DbError>;

async fn has_data(&self, location_key: &str) -> Result<bool, DbError>;

async fn get_missing_timestamps(
    &self,
    location_key: &str,
    start: i64,
    end: i64,
    interval: i64,
    units: &str,
) -> Result<Vec<i64>, DbError>;

async fn get_missing_days(
    &self,
    location_key: &str,
    start: i64,
    end: i64,
    units: &str,
) -> Result<Vec<i64>, DbError>;
```

- [ ] **Step 3: Update SqliteHistoryRepository queries**

In the `get_range()` implementation, change the SQL WHERE clause:

```sql
WHERE location_key = ? AND timestamp >= ? AND timestamp <= ? AND units = ?
```

In `get_daily_summary()`, same change:

```sql
WHERE location_key = ? AND timestamp >= ? AND timestamp <= ? AND units = ?
```

In `get_missing_days()`, same change:

```sql
WHERE location_key = ? AND timestamp >= ? AND timestamp <= ? AND units = ?
```

In `has_data()`, same change:

```sql
WHERE location_key = ?
```

In `insert_batch()`, add `location_key` to the INSERT statement and values. Update the INSERT to use the new unique constraint — change from `INSERT OR IGNORE` keyed on `(city, timestamp, units)` to work with `(location_key, timestamp, units)`.

- [ ] **Step 4: Update HistoryService to pass location_key**

In `src/history/service.rs`, update `get_history()`, `get_daily_history()`, and `get_trends()` to:
1. Geocode the city input as before
2. Compute `location_key` using `make_location_key(geo.lat, geo.lon)` from `crate::geocode::models`
3. Pass `&location_key` to the repo methods instead of `&city_name`

Import `make_location_key` at the top:

```rust
use crate::geocode::models::make_location_key;
```

Update each method. For example, in `get_history()`:

```rust
let geo = self.geocode(city).await?;
let location_key = make_location_key(geo.lat, geo.lon);
let city_name = geo.name.clone();
// ...
let records = self.repo.get_range(&location_key, start_ts, end_ts, "metric").await?;
```

The response still uses `city_name` for the display field.

- [ ] **Step 5: Update backfill_data() to use location_key**

In `src/history/service.rs`, update `backfill_data()` to compute `location_key` from the geocoded coordinates and pass it to `get_missing_days()` and `insert_batch()`.

- [ ] **Step 6: Update backfill runner**

In `src/backfill/runner.rs`, update `run_backfill()` to use `location_key` for deduplication in the city list. Import `make_location_key` and use it to build the IndexSet key instead of the raw city string.

- [ ] **Step 7: Build and verify**

Run: `cargo build 2>&1 | head -30`
Expected: Compiles without errors.

- [ ] **Step 8: Smoke test**

```bash
cargo run &
sleep 3
curl -s "http://localhost:3000/api/v1/history/52726?period=7d" | python3 -m json.tool | head -20
curl -s "http://localhost:3000/api/v1/history/Blue%20Grass?period=7d" | python3 -m json.tool | head -20
kill %1
```

Expected: Both queries return the same history data (same records, same count).

- [ ] **Step 9: Commit**

```bash
git add src/db/history_repo.rs src/history/service.rs src/backfill/runner.rs src/geocode/models.rs
git commit -m "feat: switch history storage and queries to coordinate-based location_key"
```

---

### Task 5: Update get_stats() for location_key

**Files:**
- Modify: `src/db/history_repo.rs`

- [ ] **Step 1: Update the stats query**

In `src/db/history_repo.rs`, in the `get_stats()` implementation, update the city stats query to group by `location_key` instead of `city`. Keep the `city` name in the output for display:

```sql
SELECT city, location_key, COUNT(*) as record_count,
       MIN(timestamp) as earliest_timestamp,
       MAX(timestamp) as latest_timestamp
FROM weather_history
GROUP BY location_key
ORDER BY record_count DESC
```

Update `CityHistoryStats` struct to include `location_key`:

```rust
pub struct CityHistoryStats {
    pub city: String,
    pub location_key: String,
    pub record_count: i64,
    pub earliest_timestamp: i64,
    pub latest_timestamp: i64,
    pub missing_days: i64,
}
```

- [ ] **Step 2: Build and verify**

Run: `cargo build 2>&1 | head -30`
Expected: Compiles without errors.

- [ ] **Step 3: Commit**

```bash
git add src/db/history_repo.rs
git commit -m "feat: update stats queries to group by location_key"
```

---

## Phase 2: Mobile — Location Unification & Tab Reorganization

All tasks in this phase are in the **~/dev/weathrs-mobile** repository.

---

### Task 6: Add GeocodedLocation type and geocode API method

**Files:**
- Modify: `src/types/weather.ts`
- Modify: `src/services/api.ts`

- [ ] **Step 1: Add GeocodedLocation type**

In `src/types/weather.ts`, add after the `Units` type (after line 121):

```typescript
export interface GeocodedLocation {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state: string | null;
  location_key: string;
}
```

- [ ] **Step 2: Add geocode method to API service**

In `src/services/api.ts`, add the import for the new type at the top, then add this method to the `WeathrsApi` class:

```typescript
async geocode(query: string): Promise<GeocodedLocation> {
  const params = new URLSearchParams();
  params.append('q', query);
  return this.request(`/geocode?${params.toString()}`, { timeout: TIMEOUT.FAST });
}
```

- [ ] **Step 3: Export the new type**

In `src/types/index.ts` (or wherever types are exported from), add `GeocodedLocation` to the exports.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: No new errors.

- [ ] **Step 5: Commit**

```bash
git add src/types/weather.ts src/services/api.ts
git commit -m "feat: add GeocodedLocation type and geocode API method"
```

---

### Task 7: Create location resolution service

**Files:**
- Create: `src/services/location.ts`

- [ ] **Step 1: Create the location service**

Create `src/services/location.ts`:

```typescript
import api from './api';
import type { GeocodedLocation } from '@/types';

/**
 * Round a coordinate to 2 decimal places for canonical keying.
 */
export function roundCoord(val: number): number {
  return Math.round(val * 100) / 100;
}

/**
 * Generate a location_key from coordinates.
 */
export function makeLocationKey(lat: number, lon: number): string {
  return `${roundCoord(lat).toFixed(2)},${roundCoord(lon).toFixed(2)}`;
}

/**
 * Resolve any location input (city name, ZIP code, or "lat,lon" string)
 * to a canonical GeocodedLocation with rounded coordinates.
 */
export async function resolveLocation(input: string): Promise<GeocodedLocation> {
  const result = await api.geocode(input);
  return {
    ...result,
    lat: roundCoord(result.lat),
    lon: roundCoord(result.lon),
    location_key: makeLocationKey(result.lat, result.lon),
  };
}

/**
 * Resolve GPS coordinates to a canonical GeocodedLocation.
 * Sends coordinates as "lat,lon" string to the geocode endpoint.
 */
export async function resolveCoordinates(
  lat: number,
  lon: number,
): Promise<GeocodedLocation> {
  return resolveLocation(`${lat},${lon}`);
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/location.ts
git commit -m "feat: create location resolution service with coordinate normalization"
```

---

### Task 8: Update SavedCity type and citiesStore

**Files:**
- Modify: `src/stores/citiesStore.ts`

- [ ] **Step 1: Update SavedCity interface**

In `src/stores/citiesStore.ts`, update the `SavedCity` interface (lines 9-13):

```typescript
export interface SavedCity {
  id: string;
  name: string;
  displayName?: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
  addedAt: number;
}
```

- [ ] **Step 2: Update addCity to accept full location data**

Update the `addCity` action signature and implementation:

```typescript
addCity: (location: { name: string; lat: number; lon: number; country: string; state?: string }, displayName?: string) => void;
```

Implementation:

```typescript
addCity: (location, displayName) => {
  const newCity: SavedCity = {
    id: generateId(),
    name: location.name,
    displayName: displayName?.trim() || undefined,
    lat: location.lat,
    lon: location.lon,
    country: location.country,
    state: location.state,
    addedAt: Date.now(),
  };

  set((state) => {
    // Check for duplicate by coordinates (rounded to 2 decimal places)
    const exists = state.cities.some(
      (c) => c.lat === location.lat && c.lon === location.lon
    );
    if (exists) return state;

    const updatedCities = [...state.cities, newCity];
    return {
      cities: updatedCities,
      selectedCityId: state.selectedCityId || newCity.id,
    };
  });
},
```

- [ ] **Step 3: Add a needsMigration computed property**

Add a helper to detect cities without coordinates (for migration):

```typescript
needsMigration: () => {
  return get().cities.some((c) => c.lat === undefined || c.lon === undefined);
},
```

- [ ] **Step 4: Add migrateCity action for updating legacy entries**

```typescript
migrateCity: (id: string, location: { lat: number; lon: number; country: string; state?: string; name: string }) => {
  set((state) => {
    // Check if another city already has these coordinates
    const duplicate = state.cities.find(
      (c) => c.id !== id && c.lat === location.lat && c.lon === location.lon
    );

    if (duplicate) {
      // Remove the current city and select the duplicate if needed
      const updatedCities = state.cities.filter((c) => c.id !== id);
      return {
        cities: updatedCities,
        selectedCityId: state.selectedCityId === id ? duplicate.id : state.selectedCityId,
      };
    }

    // Update the city with coordinates
    return {
      cities: state.cities.map((c) =>
        c.id === id
          ? { ...c, lat: location.lat, lon: location.lon, country: location.country, state: location.state, name: location.name }
          : c
      ),
    };
  });
},
```

- [ ] **Step 5: Update the interface and action selectors**

Add `migrateCity` and `needsMigration` to the `CitiesState` interface and the `useCitiesActions` selector.

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit`
Expected: Errors in files that call `addCity` with the old signature (these will be fixed in the next task).

- [ ] **Step 7: Commit**

```bash
git add src/stores/citiesStore.ts
git commit -m "feat: add coordinates to SavedCity with dedup and migration support"
```

---

### Task 9: Update city-adding flows to use location resolution

**Files:**
- Modify: `app/settings.tsx`
- Modify: `src/hooks/useLocation.ts`

- [ ] **Step 1: Update the add-city flow in settings.tsx**

Find the section where a new city is added (in the Saved Cities section). Replace the direct `addCity(name)` call with a geocode-first flow:

```typescript
import { resolveLocation, resolveCoordinates } from '@/services/location';

// In the add city handler:
const handleAddCity = async (input: string) => {
  try {
    const location = await resolveLocation(input.trim());
    addCity(
      { name: location.name, lat: location.lat, lon: location.lon, country: location.country, state: location.state ?? undefined },
      undefined
    );
  } catch (error) {
    Alert.alert('Error', 'Could not find that location. Try a city name or ZIP code.');
  }
};
```

- [ ] **Step 2: Update the geolocation flow in settings.tsx**

Find where `requestLocation()` + `reverseGeocode()` is used for "Use My Location". Replace with:

```typescript
const handleUseLocation = async () => {
  const coords = await requestLocation();
  if (!coords) return;

  try {
    const location = await resolveCoordinates(coords.latitude, coords.longitude);
    addCity(
      { name: location.name, lat: location.lat, lon: location.lon, country: location.country, state: location.state ?? undefined },
      undefined
    );
  } catch (error) {
    Alert.alert('Error', 'Could not resolve your location.');
  }
};
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No new errors.

- [ ] **Step 4: Commit**

```bash
git add app/settings.tsx src/hooks/useLocation.ts
git commit -m "feat: wire city-adding flows through location resolution service"
```

---

### Task 10: Add city migration on app startup

**Files:**
- Create: `src/hooks/useCityMigration.ts`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Create the migration hook**

Create `src/hooks/useCityMigration.ts`:

```typescript
import { useEffect, useRef } from 'react';
import { useCitiesStore } from '@/stores/citiesStore';
import { resolveLocation } from '@/services/location';

/**
 * One-time migration hook: resolves saved cities that lack coordinates.
 * Runs on first launch after the update that adds coordinate fields.
 */
export function useCityMigration() {
  const hasRun = useRef(false);
  const cities = useCitiesStore((s) => s.cities);
  const migrateCity = useCitiesStore((s) => s.migrateCity);

  useEffect(() => {
    if (hasRun.current) return;

    const citiesToMigrate = cities.filter(
      (c) => (c as any).lat === undefined || (c as any).lon === undefined
    );

    if (citiesToMigrate.length === 0) return;

    hasRun.current = true;

    (async () => {
      for (const city of citiesToMigrate) {
        try {
          const resolved = await resolveLocation(city.name);
          migrateCity(city.id, {
            name: resolved.name,
            lat: resolved.lat,
            lon: resolved.lon,
            country: resolved.country,
            state: resolved.state ?? undefined,
          });
        } catch (error) {
          console.warn(`Failed to migrate city "${city.name}":`, error);
        }
      }
    })();
  }, [cities, migrateCity]);
}
```

- [ ] **Step 2: Wire the migration hook into the app layout**

In `app/_layout.tsx`, inside the `TabsNavigator` component, add after the existing hooks:

```typescript
import { useCityMigration } from '@/hooks/useCityMigration';

// Inside TabsNavigator:
useCityMigration();
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No new errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useCityMigration.ts app/_layout.tsx
git commit -m "feat: add one-time migration to resolve coordinates for existing saved cities"
```

---

### Task 11: Update useCityToQuery to include coordinates

**Files:**
- Modify: `src/hooks/useCityToQuery.ts`

- [ ] **Step 1: Update the hook to return coordinates**

```typescript
import { useSettingsStore } from '@/stores/settingsStore';
import { useCitiesStore } from '@/stores/citiesStore';

interface CityQueryResult {
  cityToQuery: string;
  cityDisplayName: string;
  lat: number | null;
  lon: number | null;
}

export function useCityToQuery(): string;
export function useCityToQuery(options: { withDisplay: true }): CityQueryResult;
export function useCityToQuery(options?: { withDisplay: true }): string | CityQueryResult {
  const { defaultCity } = useSettingsStore();
  const selectedCity = useCitiesStore((s) => s.getSelectedCity());
  const cityToQuery = selectedCity?.name || defaultCity;

  if (options?.withDisplay) {
    return {
      cityToQuery,
      cityDisplayName: selectedCity?.displayName || cityToQuery,
      lat: selectedCity?.lat ?? null,
      lon: selectedCity?.lon ?? null,
    };
  }

  return cityToQuery;
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No new errors (the return type is a superset of the old one).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useCityToQuery.ts
git commit -m "feat: add lat/lon to useCityToQuery return value"
```

---

### Task 12: Extract SchedulerModal from scheduler.tsx

**Files:**
- Create: `src/components/SchedulerModal.tsx`
- Modify: `app/scheduler.tsx` (will be deleted after settings integration)

- [ ] **Step 1: Create SchedulerModal component**

Create `src/components/SchedulerModal.tsx` — extract the full scheduler UI from `app/scheduler.tsx`. Wrap it in a `Modal` component:

```typescript
import { Modal, View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

interface SchedulerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SchedulerModal({ visible, onClose }: SchedulerModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Move the entire scheduler screen content here */}
        {/* Include the status card, job list, form modal, manual trigger */}
        {/* Add a close/back button in the header */}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

Copy the full content from `app/scheduler.tsx` into this component — all state, queries, mutations, the `JobFormModal`, `JobCard`, and list rendering. The only difference is:
- It's wrapped in a `<Modal>` instead of being a standalone screen
- The header gets a "Done" or close button that calls `onClose`
- Remove the screen-level `SafeAreaView` wrapper (the Modal handles it)

- [ ] **Step 2: Verify the component compiles**

Run: `npx tsc --noEmit`
Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/SchedulerModal.tsx
git commit -m "feat: extract scheduler UI into SchedulerModal component"
```

---

### Task 13: Integrate scheduler into settings and merge charts into forecast

**Files:**
- Modify: `app/settings.tsx`
- Modify: `app/forecast.tsx`
- Delete: `app/charts.tsx`
- Delete: `app/scheduler.tsx`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Add scheduler modal to settings**

In `app/settings.tsx`, add a "Notifications" section after the existing sections. Add state for modal visibility:

```typescript
import { SchedulerModal } from '@/components/SchedulerModal';

// In the component:
const [schedulerVisible, setSchedulerVisible] = useState(false);

// In the JSX, add a section:
<View style={[styles.section, { backgroundColor: colors.card }]}>
  <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
  <Pressable
    style={[styles.settingRow, { borderBottomColor: colors.border }]}
    onPress={() => setSchedulerVisible(true)}
    accessibilityRole="button"
    accessibilityLabel="Manage scheduled forecasts"
  >
    <View style={styles.settingLabel}>
      <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
      <Text style={[styles.settingText, { color: colors.text }]}>Scheduled Forecasts</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
  </Pressable>
</View>

<SchedulerModal
  visible={schedulerVisible}
  onClose={() => setSchedulerVisible(false)}
/>
```

- [ ] **Step 2: Add Charts segment to forecast**

In `app/forecast.tsx`, add a third segment to the existing segmented control. Update the `activeView` state type:

```typescript
type ForecastView = 'daily' | 'hourly' | 'charts';
const [activeView, setActiveView] = useState<ForecastView>('daily');
```

Add a third button in the segmented control for "Charts". Import and render `WeatherCharts` when `activeView === 'charts'`:

```typescript
import { WeatherCharts } from '@/components/WeatherCharts';

// In the view switching logic, add:
// When charts is active, fetch the full forecast for chart data
const { data: fullForecast } = useForecast(cityToQuery);

// In the render:
{activeView === 'charts' && fullForecast && (
  <WeatherCharts
    hourlyData={fullForecast.hourly}
    dailyData={fullForecast.daily}
    units={units}
  />
)}
```

- [ ] **Step 3: Delete charts.tsx and scheduler.tsx**

```bash
rm app/charts.tsx app/scheduler.tsx
```

- [ ] **Step 4: Update _layout.tsx tab configuration**

In `app/_layout.tsx`, remove the Charts and Scheduler tab screens. The tabs should now be:

```typescript
<Tabs.Screen name="index" options={{ title: 'Weather', tabBarLabel: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="partly-sunny" size={size} color={color} /> }} />
<Tabs.Screen name="forecast" options={{ title: 'Forecast', tabBarLabel: 'Forecast', tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} /> }} />
<Tabs.Screen name="radar" options={{ title: 'Radar', tabBarLabel: 'Radar', tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} /> }} />
<Tabs.Screen name="history" options={{ title: 'History', tabBarLabel: 'History', tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} /> }} />
<Tabs.Screen name="settings" options={{ title: 'Settings', tabBarLabel: 'Settings', tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} /> }} />
```

Note: `app/radar.tsx` doesn't exist yet — create a placeholder to prevent build errors:

```typescript
import { View, Text } from 'react-native';
import { useTheme } from '@/theme';

export default function RadarScreen() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Radar — Coming Soon</Text>
    </View>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add app/_layout.tsx app/forecast.tsx app/settings.tsx app/radar.tsx src/components/SchedulerModal.tsx
git rm app/charts.tsx app/scheduler.tsx
git commit -m "feat: reorganize tabs — merge charts into forecast, scheduler into settings, add radar placeholder"
```

---

## Phase 3: Mobile — Radar Screen

---

### Task 14: Install react-native-maps and configure app.json

**Files:**
- Modify: `package.json`
- Modify: `app.json`

- [ ] **Step 1: Install react-native-maps**

```bash
npx expo install react-native-maps
```

- [ ] **Step 2: Add Google Maps API key to app.json**

In `app.json`, add the Google Maps config inside `expo.android`:

```json
"config": {
  "googleMaps": {
    "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
  }
}
```

Also add the `react-native-maps` plugin to the plugins array if required by the latest version.

- [ ] **Step 3: Add OWM API key env var**

Create or update `.env` (and `.env.example`) with:

```
EXPO_PUBLIC_OWM_API_KEY=your_openweathermap_api_key
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add package.json app.json .env.example
git commit -m "feat: install react-native-maps and configure Google Maps API key"
```

---

### Task 15: Create RadarLegend component

**Files:**
- Create: `src/components/RadarLegend.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/RadarLegend.tsx`:

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

export type RadarLayer = 'precipitation_new' | 'clouds_new' | 'temp_new' | 'wind_new';

interface LegendConfig {
  label: string;
  colors: string[];
  startLabel: string;
  endLabel: string;
}

const LEGEND_CONFIG: Record<RadarLayer, LegendConfig> = {
  precipitation_new: {
    label: 'Precipitation',
    colors: ['#00c853', '#76ff03', '#ffeb3b', '#ff9800', '#f44336', '#9c27b0'],
    startLabel: 'Light',
    endLabel: 'Heavy',
  },
  clouds_new: {
    label: 'Cloud Cover',
    colors: ['#e0e0e0', '#bdbdbd', '#9e9e9e', '#757575', '#616161', '#424242'],
    startLabel: 'Thin',
    endLabel: 'Dense',
  },
  temp_new: {
    label: 'Temperature',
    colors: ['#2196f3', '#4caf50', '#ffeb3b', '#ff9800', '#f44336', '#9c27b0'],
    startLabel: 'Cold',
    endLabel: 'Hot',
  },
  wind_new: {
    label: 'Wind Speed',
    colors: ['#4caf50', '#8bc34a', '#ffeb3b', '#ff9800', '#f44336'],
    startLabel: 'Calm',
    endLabel: 'Strong',
  },
};

interface RadarLegendProps {
  layer: RadarLayer;
}

export function RadarLegend({ layer }: RadarLegendProps) {
  const { colors } = useTheme();
  const config = LEGEND_CONFIG[layer];

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{config.label}</Text>
      <View style={styles.row}>
        <Text style={[styles.rangeLabel, { color: colors.textMuted }]}>{config.startLabel}</Text>
        {config.colors.map((color, i) => (
          <View key={i} style={[styles.swatch, { backgroundColor: color }]} />
        ))}
        <Text style={[styles.rangeLabel, { color: colors.textMuted }]}>{config.endLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  label: {
    fontSize: 9,
    marginBottom: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  rangeLabel: {
    fontSize: 8,
    marginHorizontal: 4,
  },
  swatch: {
    width: 14,
    height: 6,
    borderRadius: 1,
  },
});
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/RadarLegend.tsx
git commit -m "feat: create RadarLegend component with per-layer color scales"
```

---

### Task 16: Create RadarLayerPicker component

**Files:**
- Create: `src/components/RadarLayerPicker.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/RadarLayerPicker.tsx`:

```typescript
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useTheme } from '@/theme';
import type { RadarLayer } from './RadarLegend';

interface LayerOption {
  id: RadarLayer;
  label: string;
}

const LAYERS: LayerOption[] = [
  { id: 'precipitation_new', label: 'Precip' },
  { id: 'clouds_new', label: 'Clouds' },
  { id: 'temp_new', label: 'Temp' },
  { id: 'wind_new', label: 'Wind' },
];

interface RadarLayerPickerProps {
  activeLayer: RadarLayer;
  onLayerChange: (layer: RadarLayer) => void;
}

export function RadarLayerPicker({ activeLayer, onLayerChange }: RadarLayerPickerProps) {
  const { colors } = useTheme();

  const handlePress = (layer: RadarLayer) => {
    if (layer === activeLayer) return;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onLayerChange(layer);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {LAYERS.map((layer) => {
        const isActive = layer.id === activeLayer;
        return (
          <Pressable
            key={layer.id}
            onPress={() => handlePress(layer.id)}
            style={[
              styles.pill,
              isActive
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.card },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${layer.label} layer`}
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[
                styles.pillText,
                { color: isActive ? '#ffffff' : colors.primary },
              ]}
            >
              {layer.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  pill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/RadarLayerPicker.tsx
git commit -m "feat: create RadarLayerPicker pill selector component"
```

---

### Task 17: Create RadarPlayback component

**Files:**
- Create: `src/components/RadarPlayback.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/RadarPlayback.tsx`:

```typescript
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

interface RadarPlaybackProps {
  /** Unix timestamp of the currently displayed frame */
  currentTimestamp: number;
  /** Whether animation is playing (for future use) */
  isPlaying: boolean;
  /** Toggle play/pause (for future use) */
  onTogglePlay: () => void;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000;
  const diffMinutes = Math.round((now - timestamp) / 60);

  if (diffMinutes <= 0) return 'Now';
  if (diffMinutes === 1) return '1 min ago';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const hours = Math.floor(diffMinutes / 60);
  return `${hours}h ${diffMinutes % 60}m ago`;
}

export function RadarPlayback({
  currentTimestamp,
  isPlaying,
  onTogglePlay,
}: RadarPlaybackProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onTogglePlay}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause radar animation' : 'Play radar animation'}
        style={styles.playButton}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={20}
          color={colors.text}
        />
      </Pressable>

      <View style={styles.timeline}>
        {/* Progress bar */}
        <View style={[styles.track, { backgroundColor: colors.card }]}>
          {/* For single-frame (free tier), show full bar */}
          <View
            style={[
              styles.progress,
              { width: '100%', backgroundColor: colors.primary },
            ]}
          />
          {/* Scrubber handle */}
          <View style={[styles.handle, { left: '100%' }]} />
        </View>

        {/* Timestamp labels */}
        <View style={styles.labels}>
          <Text style={[styles.labelText, { color: colors.textMuted }]}>
            {formatTimeAgo(currentTimestamp)}
          </Text>
          <Text style={[styles.labelText, { color: colors.text, fontWeight: '500' }]}>
            Live
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  playButton: {
    padding: 4,
  },
  timeline: {
    flex: 1,
  },
  track: {
    height: 4,
    borderRadius: 2,
    position: 'relative',
  },
  progress: {
    height: '100%',
    borderRadius: 2,
  },
  handle: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    transform: [{ translateX: -6 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  labelText: {
    fontSize: 9,
  },
});
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/RadarPlayback.tsx
git commit -m "feat: create RadarPlayback component with timeline bar"
```

---

### Task 18: Create RadarMap component

**Files:**
- Create: `src/components/RadarMap.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/RadarMap.tsx`:

```typescript
import { useRef, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import MapView, { UrlTile, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '@/theme';
import { RadarLegend, type RadarLayer } from './RadarLegend';

const OWM_API_KEY = process.env.EXPO_PUBLIC_OWM_API_KEY ?? '';

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#0e1626' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
];

interface RadarMapProps {
  lat: number;
  lon: number;
  activeLayer: RadarLayer;
}

export function RadarMap({ lat, lon, activeLayer }: RadarMapProps) {
  const { isDark } = useTheme();
  const mapRef = useRef<MapView>(null);

  const tileUrl = `https://tile.openweathermap.org/map/${activeLayer}/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`;

  const animateToRegion = useCallback(
    (latitude: number, longitude: number) => {
      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 3,
          longitudeDelta: 3,
        },
        500,
      );
    },
    [],
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={isDark ? DARK_MAP_STYLE : undefined}
        initialRegion={{
          latitude: lat,
          longitude: lon,
          latitudeDelta: 3,
          longitudeDelta: 3,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        <UrlTile
          urlTemplate={tileUrl}
          maximumZ={12}
          tileSize={256}
          tileCachePath={`${activeLayer}_cache`}
          tileCacheMaxAge={300}
          opacity={0.7}
          zIndex={1}
        />
      </MapView>

      <RadarLegend layer={activeLayer} />
    </View>
  );
}

// Expose animateToRegion via ref for "My Location" button
RadarMap.displayName = 'RadarMap';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors (or only errors related to react-native-maps types if not yet installed — these resolve after `npx expo install`).

- [ ] **Step 3: Commit**

```bash
git add src/components/RadarMap.tsx
git commit -m "feat: create RadarMap component with OWM tile overlay and dark map style"
```

---

### Task 19: Build the radar screen

**Files:**
- Modify: `app/radar.tsx` (replace placeholder from Task 13)

- [ ] **Step 1: Implement the full radar screen**

Replace the placeholder `app/radar.tsx` with the full implementation:

```typescript
import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { useCityToQuery } from '@/hooks/useCityToQuery';
import { useLocation } from '@/hooks/useLocation';
import { resolveCoordinates } from '@/services/location';
import { RadarMap } from '@/components/RadarMap';
import { RadarLayerPicker, type RadarLayer } from '@/components/RadarLayerPicker';
import { RadarPlayback } from '@/components/RadarPlayback';

export default function RadarScreen() {
  const { colors } = useTheme();
  const { cityDisplayName, lat, lon } = useCityToQuery({ withDisplay: true });
  const { requestLocation } = useLocation();

  const [activeLayer, setActiveLayer] = useState<RadarLayer>('precipitation_new');
  const [isPlaying, setIsPlaying] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lon: number } | null>(null);

  // Use map center override or fall back to selected city
  const displayLat = mapCenter?.lat ?? lat ?? 39.83;
  const displayLon = mapCenter?.lon ?? lon ?? -98.58;

  const handleMyLocation = useCallback(async () => {
    const coords = await requestLocation();
    if (coords) {
      try {
        const location = await resolveCoordinates(coords.latitude, coords.longitude);
        setMapCenter({ lat: location.lat, lon: location.lon });
      } catch {
        // Fall back to raw GPS coordinates
        setMapCenter({ lat: coords.latitude, lon: coords.longitude });
      }
    }
  }, [requestLocation]);

  const currentTimestamp = Math.floor(Date.now() / 1000);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cityName, { color: colors.text }]}>
          {cityDisplayName || 'Select a city'}
        </Text>
        <Pressable
          onPress={handleMyLocation}
          style={[styles.locationButton, { backgroundColor: colors.card }]}
          accessibilityRole="button"
          accessibilityLabel="Center map on my location"
        >
          <Ionicons name="locate" size={14} color={colors.primary} />
          <Text style={[styles.locationText, { color: colors.primary }]}>My Location</Text>
        </Pressable>
      </View>

      {/* Map */}
      <RadarMap
        lat={displayLat}
        lon={displayLon}
        activeLayer={activeLayer}
      />

      {/* Layer picker */}
      <RadarLayerPicker
        activeLayer={activeLayer}
        onLayerChange={setActiveLayer}
      />

      {/* Playback bar */}
      <View style={{ backgroundColor: colors.background }}>
        <RadarPlayback
          currentTimestamp={currentTimestamp}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((p) => !p)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cityName: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  locationText: {
    fontSize: 11,
  },
});
```

- [ ] **Step 2: Fix the RadarLayerPicker import**

The `RadarLayer` type is defined in `RadarLegend.tsx` but also needed by `RadarLayerPicker`. Update `RadarLayerPicker.tsx` to re-export the type:

In `src/components/RadarLayerPicker.tsx`, add at the bottom:

```typescript
export type { RadarLayer } from './RadarLegend';
```

This allows `app/radar.tsx` to import `RadarLayer` from either component.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add app/radar.tsx src/components/RadarLayerPicker.tsx
git commit -m "feat: implement full radar screen with map, layers, playback, and my-location"
```

---

### Task 20: Add useRadar hook for tile refresh

**Files:**
- Create: `src/hooks/useRadar.ts`

- [ ] **Step 1: Create the hook**

Create `src/hooks/useRadar.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';

interface RadarMetadata {
  /** Unix timestamp of the latest available tile */
  timestamp: number;
  /** ISO string for display */
  updatedAt: string;
}

/**
 * Hook that tracks radar tile freshness.
 * Polls every 5 minutes to trigger tile re-fetches.
 * For Weather Maps 1.0 (free tier), tiles are always "current" —
 * this hook provides the polling trigger and timestamp.
 */
export function useRadar() {
  const { data } = useQuery<RadarMetadata>({
    queryKey: ['radar', 'metadata'],
    queryFn: () => ({
      timestamp: Math.floor(Date.now() / 1000),
      updatedAt: new Date().toISOString(),
    }),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    staleTime: 4 * 60 * 1000, // 4 minutes
  });

  return {
    timestamp: data?.timestamp ?? Math.floor(Date.now() / 1000),
    updatedAt: data?.updatedAt ?? new Date().toISOString(),
  };
}
```

- [ ] **Step 2: Wire into radar screen**

In `app/radar.tsx`, import and use the hook to feed the timestamp to `RadarPlayback`:

```typescript
import { useRadar } from '@/hooks/useRadar';

// In the component:
const { timestamp } = useRadar();

// Replace the hardcoded currentTimestamp with:
// <RadarPlayback currentTimestamp={timestamp} ... />
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useRadar.ts app/radar.tsx
git commit -m "feat: add useRadar hook for 5-minute tile refresh polling"
```

---

### Task 21: Final verification and cleanup

**Files:**
- Various

- [ ] **Step 1: Run full type check**

```bash
cd ~/dev/weathrs-mobile && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 2: Verify backend compiles**

```bash
cd ~/dev/weathrs && cargo build
```

Expected: Compiles without errors.

- [ ] **Step 3: Verify hook barrel exports**

In `src/hooks/index.ts`, ensure all new hooks are exported:

```typescript
export { useCityMigration } from './useCityMigration';
export { useRadar } from './useRadar';
```

- [ ] **Step 4: Add .superpowers to .gitignore if not present**

```bash
echo '.superpowers/' >> .gitignore
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final cleanup — hook exports, gitignore update"
```

---

## Summary

| Phase | Tasks | Repo | Key Deliverables |
|-------|-------|------|-----------------|
| 1: Backend | 1-5 | ~/dev/weathrs | Geocode endpoint, reverse geocoding, location_key migration, history query updates |
| 2: Mobile Location | 6-13 | ~/dev/weathrs-mobile | GeocodedLocation type, location service, SavedCity with coords, city migration, tab reorg |
| 3: Mobile Radar | 14-21 | ~/dev/weathrs-mobile | react-native-maps setup, RadarMap, RadarLegend, RadarLayerPicker, RadarPlayback, radar screen |
