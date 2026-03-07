# Weathrs Mobile — Modernization & Quality PRD

## Context

You are improving the **weathrs-mobile** React Native/Expo app located at `~/dev/weathrs-mobile`.
The backend API source is at `~/dev/weathrs` and is live at `https://weathrs.js-node.cc`.

**IMPORTANT: Use the Context7 MCP server to look up current documentation before implementing anything.** Before writing code for any library (React Native, Expo, Zustand, TanStack React Query, FlashList, expo-router, react-native-gifted-charts, etc.), query Context7 for the latest API docs and usage patterns. Do not rely on memory alone — always verify with Context7 first.

## How to Work

1. Read this entire prompt and review the current state of the codebase and git history.
2. Pick the **next uncompleted task** from the task list below (top to bottom priority).
3. Use Context7 to look up relevant library docs before implementing.
4. Implement the task fully — code changes, type fixes, and verify with `npx tsc --noEmit`.
5. Commit the completed task with a clear commit message.
6. Move to the next task.
7. When ALL tasks are complete, output: `<promise>ALL TASKS COMPLETE</promise>`

## Rules

- **One task per iteration.** Complete it fully before moving on.
- **Do not break existing functionality.** Run `npx tsc --noEmit` after each change.
- **Use Context7 MCP** to look up docs for every library you touch. For example:
  - Before using `React.memo`: query Context7 for React 19 memo patterns
  - Before modifying Zustand stores: query Context7 for Zustand 5 patterns
  - Before changing React Query hooks: query Context7 for TanStack React Query v5 docs
  - Before using expo-router APIs: query Context7 for expo-router v6 docs
- **Follow existing code conventions** — StyleSheet.create patterns, file organization, naming.
- **Do not add new dependencies** unless explicitly listed in a task.
- **Skip a task** if it's already been completed in a prior iteration (check git log).
- **Reference the backend API** at `~/dev/weathrs` if you need to understand API response shapes or endpoints.

---

## Task List

Complete these in order. Check git log to see which are already done.

### Phase 1: Critical Fixes

#### Task 1: Fix Duplicate SchedulerJob Type
- **File:** `src/types/weather.ts`
- **Problem:** `SchedulerJob` is defined twice (lines ~121-130 and ~174-186) with conflicting field names (`include_daily` vs `includeDaily`).
- **Action:** Remove the first definition (lines 121-130). Keep the second one that includes `notify`, `timezone`, `includeDaily`, `includeHourly`.
- **Verify:** `npx tsc --noEmit` passes with no SchedulerJob-related errors. Check all files importing SchedulerJob still compile.

#### Task 2: Complete Hooks Barrel Export
- **File:** `src/hooks/index.ts`
- **Problem:** Only exports `useWeather`. Missing `useLocation` and `useNotifications`.
- **Action:** Add exports for all hooks in the directory.
- **Verify:** All existing imports still resolve.

#### Task 3: Remove `as any` Type Escape
- **File:** `app/scheduler.tsx`
- **Problem:** Icon names cast with `as any` bypassing TypeScript.
- **Action:** Use Context7 to look up `@expo/vector-icons` Ionicons type. Define a proper type for the `getTrendIcon` return value (e.g., `type IoniconName = React.ComponentProps<typeof Ionicons>['name']`) and use it instead of `as any`.
- **Verify:** `npx tsc --noEmit` passes.

### Phase 2: Performance — Memoization

#### Task 4: Memoize Chart Calculations
- **Files:** `src/components/HistoryCharts.tsx`, `src/components/WeatherCharts.tsx`
- **Action:** Wrap `getYAxisProps()` calls in `useMemo` with appropriate dependency arrays. Move any constant arrays (like `chartButtons`) to module scope.
- **Use Context7** to verify React 19 `useMemo` best practices.
- **Verify:** TypeScript compiles. Charts still render correctly.

#### Task 5: Add React.memo to List Item Components
- **Files:** `src/components/DailyForecastCard.tsx`, `src/components/HourlyForecastCard.tsx`
- **Action:** Wrap component exports with `React.memo()`. Ensure props comparison works correctly (no inline object/function props that would defeat memo).
- **Use Context7** to check React 19 memo patterns.
- **Verify:** TypeScript compiles.

#### Task 6: Memoize Event Handlers
- **Files:** `app/history.tsx` (date picker handlers), `src/components/NotificationSettings.tsx` (form handlers)
- **Action:** Wrap event handlers in `useCallback` with correct dependency arrays.
- **Verify:** TypeScript compiles.

#### Task 7: Optimize Forecast Queries
- **File:** `app/forecast.tsx`
- **Action:** Disable the inactive query based on `activeView`. When viewing daily, disable hourly query and vice versa. The data should remain cached from previous views.
- **Use Context7** to verify TanStack React Query v5 `enabled` option behavior.
- **Verify:** TypeScript compiles. Both views still load data when switched to.

### Phase 3: DRY — Extract Shared Logic

#### Task 8: Create `useCityToQuery` Hook
- **File:** Create `src/hooks/useCityToQuery.ts`
- **Action:** Extract the repeated pattern from index.tsx, charts.tsx, forecast.tsx, history.tsx:
  ```typescript
  const selectedCity = getSelectedCity();
  const cityToQuery = selectedCity?.name || defaultCity;
  ```
  into a custom hook. Update all screens to use it. Export from hooks barrel.
- **Verify:** All screens still work. TypeScript compiles.

#### Task 9: Create `useHaptics` Hook
- **File:** Create `src/hooks/useHaptics.ts`
- **Action:** Extract the repeated platform check:
  ```typescript
  if (Platform.OS !== 'web') { await Haptics.selectionAsync(); }
  ```
  into a hook that returns `{ selection, impact, notification }` methods. Replace all occurrences across the codebase.
- **Use Context7** to look up `expo-haptics` API.
- **Verify:** TypeScript compiles. Haptics still work on native.

#### Task 10: Standardize Store Selector Patterns
- **File:** `src/stores/settingsStore.ts`
- **Action:** Add atomic selector hooks to match the pattern in `citiesStore.ts` and `notificationsStore.ts`. Export named hooks like `useDefaultCity()`, `useUnits()`, `useApiUrl()`, `useSettingsActions()`.
- **Use Context7** for Zustand 5 selector patterns.
- **Verify:** TypeScript compiles. Update consumers to use new selectors where straightforward.

### Phase 4: Robustness

#### Task 11: Add Error Boundaries
- **File:** Create `src/components/ui/ErrorBoundary.tsx`
- **Action:** Create a reusable React error boundary component with:
  - Fallback UI showing error message and retry button
  - `onReset` callback support
  - Theme-aware styling matching existing UI components
- **Use Context7** for React 19 error boundary patterns.
- **Then:** Wrap chart components in error boundaries in `app/charts.tsx`, `app/history.tsx`. Export from ui barrel.
- **Verify:** TypeScript compiles.

#### Task 12: Add Input Validation
- **File:** `app/settings.tsx`
- **Action:**
  - Add URL format validation for custom API URL (basic regex or `URL` constructor check)
  - Add length limit for city name input (max 100 chars)
  - Show inline error messages for invalid input
- **Verify:** TypeScript compiles.

#### Task 13: Virtualize History Daily Breakdown
- **File:** `app/history.tsx`
- **Action:** Replace the ScrollView rendering of daily breakdown items with FlashList for virtualized rendering.
- **Use Context7** to look up `@shopify/flash-list` API.
- **Verify:** TypeScript compiles.

### Phase 5: Accessibility

#### Task 14: Add Accessibility Labels to Interactive Elements
- **Files:** All component files with Pressable/TouchableOpacity elements
- **Action:** Add `accessibilityLabel` and `accessibilityRole` to:
  - All icon-only buttons (add, edit, delete, expand/collapse)
  - Tab/segment buttons (forecast view toggle, chart type tabs)
  - City selector pressables
  - CitySelector modal list items
  - Switch components in NotificationSettings
- Focus on `app/scheduler.tsx`, `src/components/CitySelector.tsx`, `src/components/WeatherCharts.tsx`, `src/components/NotificationSettings.tsx`, `app/forecast.tsx`.
- **Verify:** TypeScript compiles.

#### Task 15: Add Chart Accessibility
- **Files:** `src/components/WeatherCharts.tsx`, `src/components/HistoryCharts.tsx`
- **Action:** Add `accessibilityLabel` to chart container Views with text summaries of the data (e.g., "Temperature chart showing range from X to Y degrees over 24 hours").
- **Verify:** TypeScript compiles.

### Phase 6: Modern React Patterns

#### Task 16: Add `useTransition` for Tab/View Switches
- **Files:** `app/forecast.tsx` (daily/hourly toggle), `src/components/WeatherCharts.tsx` (chart type tabs), `app/history.tsx` (period/chart type selection)
- **Action:** Wrap view-switching state updates in `useTransition` so the UI remains responsive during re-renders. Show the `isPending` state as a subtle opacity change or loading indicator.
- **Use Context7** for React 19 `useTransition` docs.
- **Verify:** TypeScript compiles. View switches feel smooth.

#### Task 17: Add Skeleton Loading States
- **File:** Create `src/components/ui/Skeleton.tsx`
- **Action:** Create a simple animated skeleton/placeholder component using `Animated` API (no new deps). Build variants:
  - `Skeleton.Line` — horizontal bar placeholder
  - `Skeleton.Circle` — circular placeholder
  - `Skeleton.Card` — card-shaped placeholder matching WeatherCard dimensions
- Add to ui barrel export. Replace `<Loading />` usage on main index.tsx screen with skeleton layout.
- **Verify:** TypeScript compiles.

### Phase 7: Code Quality Infrastructure

#### Task 18: Add ESLint Configuration
- **File:** Create `eslint.config.js` (flat config format)
- **Action:** Use Context7 to look up current ESLint flat config and `eslint-config-expo` setup. Create a minimal config that:
  - Extends expo defaults
  - Enables TypeScript rules
  - Enables React Hooks rules (exhaustive-deps)
  - Enables accessibility rules (`eslint-plugin-react-native-a11y`) if available without adding deps, otherwise skip a11y plugin
- **Do NOT fix all existing lint errors** — just set up the config. Note: only add devDependencies that are strictly needed.
- **Verify:** `npx expo lint` runs without config errors (lint warnings/errors in source are OK to leave).

#### Task 19: Add API Request Timeout
- **File:** `src/services/api.ts`
- **Action:** Add `AbortController` with a configurable timeout (default 15 seconds) to the private `request` method. Handle timeout errors with a clear message.
- **Verify:** TypeScript compiles.

### Phase 8: Final Polish

#### Task 20: Theme Toggle Support
- **File:** `src/theme/ThemeContext.tsx`, `src/stores/settingsStore.ts`, `app/settings.tsx`
- **Action:**
  - Add `themeMode: 'system' | 'light' | 'dark'` to settingsStore (persisted)
  - Update ThemeProvider to respect manual override when not 'system'
  - Add theme picker to settings screen (3 options: System, Light, Dark)
- **Use Context7** for `react-native` `useColorScheme` and Zustand patterns.
- **Verify:** TypeScript compiles. Theme switching works.

---

## Completion Criteria

All 20 tasks committed. `npx tsc --noEmit` passes with no errors. Output:

<promise>ALL TASKS COMPLETE</promise>
