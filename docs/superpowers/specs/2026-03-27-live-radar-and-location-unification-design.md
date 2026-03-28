# Live Radar & Location Unification Design Spec

**Date:** 2026-03-27
**Status:** Approved
**Scope:** Weathrs Mobile (Expo 54 / RN 0.81) + Weathrs Backend (Rust)

---

## Overview

Add a live weather radar screen to the Weathrs mobile app using OpenWeatherMap Weather Maps 1.0 tile overlays on `react-native-maps`. Simultaneously, unify location handling across the entire application — both mobile and backend — so that different inputs for the same physical location (ZIP code, city name, township name, GPS coordinates) resolve to a single canonical record.

These two features are coupled: the radar map requires coordinates to center the view, and coordinate-based location resolution solves an existing data duplication problem in weather history storage.

---

## 1. Location Unification

### Problem

A user can save "52726", "Blue Grass", "Blue Grass Township", or geolocate — all referring to the same physical location. Currently:
- `SavedCity` stores only a `name` string with no coordinates
- The backend keys history records by city name string (`UNIQUE(city, timestamp, units)`)
- Different query strings create separate history rows for the same place
- Geocoding cache normalizes to lowercase but doesn't resolve across aliases

### Solution: Coordinate-Canonical Keying

Every location input resolves to a canonical `(lat, lon)` pair rounded to 2 decimal places (~1.1km grid). This rounded coordinate pair becomes the canonical key for all storage and lookups.

### Mobile: SavedCity Type

```typescript
interface SavedCity {
  id: string;
  name: string;         // canonical name from OWM geocoding (e.g., "Blue Grass")
  displayName?: string; // user's custom label
  lat: number;          // canonical latitude (rounded to 2 decimal places)
  lon: number;          // canonical longitude (rounded to 2 decimal places)
  country: string;      // country code (e.g., "US")
  state?: string;       // state/region (e.g., "Iowa")
  addedAt: number;
}
```

### Mobile: Location Resolution Flow

A new `resolveLocation(input: string)` function:
1. Sends raw input (ZIP, city name, `lat,lon`) to backend `/api/v1/geocode`
2. Backend returns `{ name, lat, lon, country, state }`
3. Mobile rounds coordinates to 2 decimal places
4. Checks if a saved city already exists at those coordinates
5. If duplicate, selects the existing city instead of creating a new one

Geolocation (GPS) follows the same path — coordinates are sent to the backend for reverse geocoding, then normalized identically.

### Mobile: Migration of Existing Cities

On first launch after update, if any `SavedCity` lacks coordinates:
- Iterate saved cities, resolve each through the geocode endpoint
- Merge any duplicates found (same rounded coordinates)
- One-time migration in the cities store initialization

### Backend: New Geocoding Endpoint

```
GET /api/v1/geocode?q={input}
```

Accepts city name, ZIP code, or `lat,lon` string. Returns:

```json
{
  "name": "Blue Grass",
  "lat": 41.51,
  "lon": -90.77,
  "country": "US",
  "state": "Iowa",
  "location_key": "41.51,-90.77"
}
```

Reuses existing `ForecastService::geocode()` and `is_zip_code()` logic. Adds a reverse geocoding code path using OWM's reverse geocoding API for raw coordinate inputs.

### Backend: History Migration

**New column:** `location_key TEXT` on `weather_history`, derived from `round(lat, 2) || ',' || round(lon, 2)`.

**Migration steps:**
1. Add `location_key` column (nullable initially)
2. Backfill: `UPDATE weather_history SET location_key = round(lat, 2) || ',' || round(lon, 2)`
3. Deduplicate: for rows with the same `(location_key, timestamp, units)`, keep one, delete the rest
4. Make `location_key` NOT NULL
5. Drop old unique index on `(city, timestamp, units)`
6. Add new unique index on `(location_key, timestamp, units)`
7. Add index on `(location_key, timestamp)` for range queries

The `city` column remains for display purposes. All history/trends query logic switches from `WHERE city = ?` to `WHERE location_key = ?`.

### Backend: Existing Endpoints

All endpoints (`/weather`, `/forecast`, `/history`, `/air-quality`) continue accepting city strings as input. Internally, after geocoding, they use `location_key` for storage and lookup. No breaking API changes.

---

## 2. Tab Reorganization

### Current Tabs (6)

Home, Forecast, Charts, History, Notify, Settings

### New Tabs (5)

| Position | Tab | Icon (Ionicons) | Content |
|---|---|---|---|
| 1 | Home | `partly-sunny` | Current weather, air quality, alerts |
| 2 | Forecast | `calendar` | Daily/Hourly/Charts (segmented control) |
| 3 | Radar | `map-outline` | Live radar map (new) |
| 4 | History | `time-outline` | Historical trends |
| 5 | Settings | `settings-outline` | Settings + notification scheduler |

### Forecast Tab Merge

The existing `forecast.tsx` segmented control (Daily/Hourly) gains a third segment: **Charts**. The `WeatherCharts` component moves from `charts.tsx` into the forecast screen. `charts.tsx` is deleted.

### Settings Tab Merge

The notification scheduler UI moves into the settings screen as a "Notifications" section. Tapping it opens the full scheduler UI as a modal (using React Native `Modal`). `scheduler.tsx` is deleted from the tab layout; its component logic is extracted into `src/components/SchedulerModal.tsx`.

---

## 3. Radar Screen

### Layout

Full-screen map layout with:
- **Slim header:** City name (left) + "My Location" button (right)
- **Map:** Edge-to-edge, fills all available space
- **Floating legend:** Semi-transparent overlay in bottom-left corner of map, adapts per active layer
- **Layer pills:** Below the map — Precip, Clouds, Temp, Wind (one active at a time)
- **Playback bar:** Bottom-docked — play/pause button, scrubber with draggable handle, timestamp labels (2h ago / current position / Now)
- **Tab bar:** Standard 5-tab bar with Android nav bar buffer

### Map Component

- `react-native-maps` `<MapView>` as base (Google Maps on Android, Apple Maps on iOS)
- Dark map style matching the app's theme system
- Initial region: selected city's `(lat, lon)` at zoom level ~7
- User can pan/zoom freely
- "My Location" button re-centers to GPS position via `expo-location`

### Tile Overlays

OWM Weather Maps 1.0 (free tier):

```
https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid={OWM_KEY}
```

| Layer ID | Label | Legend Scale |
|---|---|---|
| `precipitation_new` | Precip | Light (green) → Heavy (purple) |
| `clouds_new` | Clouds | Thin (light) → Dense (dark) |
| `temp_new` | Temp | Cold (blue) → Hot (red) |
| `wind_new` | Wind | Calm (green) → Strong (red) |

One layer active at a time. Switching layers swaps the `urlTemplate` prop on `<UrlTile>`.

### OWM API Key

Stored client-side via `EXPO_PUBLIC_OWM_API_KEY` environment variable. Consistent with the existing `EXPO_PUBLIC_WEATHRS_API_KEY` pattern.

### Map Centering

- **Default:** Centers on selected city's coordinates (from `SavedCity.lat/lon`)
- **"My Location" button:** Snaps to GPS position via `expo-location`, then reverse geocodes for display name
- Consistent with how other tabs use the city selector

### Tile Caching

- `tileCachePath` set to app's cache directory
- `tileCacheMaxAge` of 300 seconds (5 minutes), matching OWM's update frequency

### Animation / Playback

**Weather Maps 1.0 limitation:** The free tier provides current snapshots only — no historical frames. True radar animation requires Weather Maps 2.0 (Developer plan, ~$40/mo).

**Current design:** Static current view with a timestamp showing last-updated time. The playback UI components are built with the animation interface (accepting an array of frame timestamps) but display a single frame.

**Upgrade path:** When upgrading to a paid OWM tier, the only change is fetching the frame list from the 2.0 API and passing timestamps to the existing playback component. No UI redesign needed.

### Data Refresh

- React Query polling with `refetchInterval: 300_000` (5 minutes)
- Refresh button in header for manual refresh

---

## 4. New Files

| File | Purpose |
|---|---|
| `app/radar.tsx` | Radar tab screen |
| `src/components/RadarMap.tsx` | MapView + UrlTile + layer switching logic |
| `src/components/RadarPlayback.tsx` | Playback bar with scrubber |
| `src/components/RadarLegend.tsx` | Floating legend overlay, adapts per layer |
| `src/components/RadarLayerPicker.tsx` | Layer pill selector |
| `src/services/location.ts` | Location resolution — geocode any input to canonical form |
| `src/hooks/useRadar.ts` | React Query hook for radar tile metadata + refresh |
| `src/hooks/useResolveLocation.ts` | Hook wrapping location resolution for city saving flow |

## 5. Modified Files

| File | Change |
|---|---|
| `app/_layout.tsx` | Remove Charts + Scheduler tabs, add Radar tab, reorder to 5 tabs |
| `app/forecast.tsx` | Add "Charts" as third segment alongside Daily/Hourly |
| `app/settings.tsx` | Add "Notifications" section linking to scheduler UI |
| `app/charts.tsx` | Delete (merged into forecast) |
| `app/scheduler.tsx` | Delete from tabs (becomes modal/nested screen from settings) |
| `src/stores/citiesStore.ts` | Add `lat`, `lon`, `country`, `state` to `SavedCity`; duplicate detection by coordinates |
| `src/hooks/useCityToQuery.ts` | Return `lat`/`lon` alongside city name for map centering |
| `src/services/api.ts` | Add `geocode()` method; update history methods to accept `location_key` |
| `src/types/weather.ts` | Add `GeocodedLocation` type |
| `app.json` | Add Google Maps API key config for Android |
| `package.json` | Add `react-native-maps` dependency |

## 6. New Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react-native-maps` | ~1.27.x | MapView, UrlTile for radar overlays |

Requires EAS Build (not Expo Go). Google Maps API key required for Android in `app.json`.

## 7. Backend Changes (~/dev/weathrs)

| Change | Files Affected |
|---|---|
| New `/api/v1/geocode` endpoint | Routes, handlers, forecast service |
| Add reverse geocoding (coordinates → name) | Forecast service |
| Add `location_key` column to `weather_history` | New migration file |
| Migration: backfill + deduplicate existing rows | New migration file |
| Switch history queries to `WHERE location_key = ?` | History service, history repo |
| Update backfill runner to use `location_key` | Backfill runner |

No breaking API changes. All existing endpoints continue accepting city strings.

---

## 8. Out of Scope

- Weather Maps 2.0 / radar animation (future upgrade)
- Severe weather polygon overlays on map
- Location search within the radar map view
- Offline radar tile pre-fetching beyond the built-in cache
- Backend changes beyond geocoding endpoint and history migration
