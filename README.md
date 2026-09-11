# Weathrs Mobile

A React Native / Expo companion app for the [weathrs](https://weathrs.js-node.cc) weather API. Current conditions, hourly and 7-day forecasts, charts, historical trends, a live radar map, air quality, alerts, and push notifications.

## Features

- Current conditions, feels-like, UV, sunrise/sunset, and air quality
- Hourly (48h) and daily (7-day) forecasts with charts
- Weather history and trends with a custom date range picker
- Live OpenWeatherMap radar tiles with layer selection
- Saved cities with geocoding, use-my-location, and coordinate migration
- Push notifications and scheduled forecast jobs
- Light, Dusk, and Dark themes with a system-following mode
- Offline support via a persisted React Query cache and stale-data banners

## Tech stack

| Area | Choice |
| --- | --- |
| Runtime | Expo SDK 54, React Native 0.81, React 19 |
| Navigation | expo-router v6 (typed routes) |
| Data | TanStack Query v5 with AsyncStorage persistence |
| State | Zustand v5 |
| Charts | react-native-gifted-charts |
| Maps | react-native-maps with OpenWeatherMap tiles |
| Language | TypeScript (strict) |
| Tests | Jest, jest-expo, Testing Library |

## Getting started

### Prerequisites

- Node.js 20+ and npm
- Android Studio or Xcode for native builds; Expo Go for JS-only work

### Install

```bash
npm install
```

### Environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_OWM_API_KEY` | OpenWeatherMap key for radar tiles |
| `EXPO_PUBLIC_WEATHRS_API_KEY` | Optional API key for device/scheduler endpoints |

`EXPO_PUBLIC_*` values are embedded in the client bundle, so use restricted or demo keys only.

Android push notifications require a `google-services.json` in the project root, generated from your Firebase project.

## Running

```bash
npm start          # start the Expo dev server
npm run android    # run on Android
npm run ios        # run on iOS
npm run web        # run in the browser
```

The app defaults to the public backend at `https://weathrs.js-node.cc`. Point it elsewhere under Settings -> API Configuration.

## Quality checks

```bash
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # jest
```

## Building

EAS build profiles live in `eas.json` (`development`, `preview`, `production`, `release-apk`):

```bash
npx eas build --profile preview --platform android
```

GitHub Actions workflows:

- `.github/workflows/ci.yml` - typecheck, lint, and tests on push/PR to `master`
- `.github/workflows/build-android.yml` - manual unsigned debug/release APK
- `.github/workflows/build-android-signed.yml` - signed release APK and GitHub release on `v*` tags

Client-side API keys are injected from repository secrets during builds.

## Project structure

```
app/                 Expo Router screens (index, forecast, history, radar, settings)
src/components/      UI and feature components
src/hooks/           Data and platform hooks (weather, location, notifications, radar)
src/services/        API client, geocoding/location, tile tracking
src/stores/          Zustand stores (settings, cities, notifications)
src/theme/           Colors, typography, spacing, ThemeProvider
src/types/           API domain types
src/utils/           Formatting helpers
```

## Notes

- Weather data is fetched through the weathrs backend under `/api/v1/*`.
- Radar tiles come from OpenWeatherMap Weather Maps 1.0; free-tier tiles are single-frame.
- API responses are cached with TanStack Query and persisted to AsyncStorage (24h max age).
- Tests live beside their modules as `*.test.ts`.
