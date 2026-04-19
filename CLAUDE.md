# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Breakout 71 — a roguelite breakout game. The web build (parcel) is the primary artifact: an Android APK (Kotlin `MainActivity` that wraps a `WebView`) and a PWA both load the same `src/index.html`. Live site: https://breakout.lecaro.me/.

## Common commands

The `Makefile` is the canonical entry point and stays in sync with `make help`.

| Task | Command |
| --- | --- |
| Install deps | `make install` (runs `npm install`) |
| Dev server (game frontend + level-editor backend on :4400) | `make start` |
| Run all tests once | `make test` (= `npx jest`) |
| Run a single test file | `npx jest src/path/to/file.test.ts` |
| Watch tests | `npm test` (runs `jest --watch`) |
| Format | `make prettier` |
| Lint custom checks (TODO/log scan, French translation sanity) | `make check` (= `node checks.js`) |
| Production build (web + APK assets) | `make build` (`bash build.sh [VERSION]`) |
| Release APK | `make apk` (needs `keystore.properties`; copy from `keystore.properties.example`) |
| Debug APK | `make apk-debug` |
| Play Store AAB | `make bundle` |
| Install debug build on device | `make android-install` |
| Clean | `make clean` |
| Production deploy (rsync + butler + git tag + push) | `make deploy` (`deploy.sh`) |
| Staging deploy | `make deploy-staging` (`staging_deploy.sh`) |

`build.sh` requires Node v21 (via `nvm`). Versions are derived from `unix-timestamp / 60` and written into `app/build.gradle.kts`, `src/data/version.json`, and `src/PWA/sw-b71.js` via `sed`.

## Architecture

### Game runtime (`src/`)
- **Single shared mutable `GameState`** (`types.d.ts`) constructed by `newGameState.ts`. Functions in `gameStateMutators.ts` mutate it in place — do not treat state as immutable. The main per-frame entry is `gameStateTick(gameState, frames)`.
- **`game.ts`** wires up the DOM (canvas, menu button, modals), input, fullscreen/PWA logic, and the requestAnimationFrame loop. It owns `mainGameState` and exports `play()` / `pause()` / `restart()`.
- **`render.ts`** draws to multiple canvases (`gameCanvas`, `backgroundCanvas`, `haloCanvas`) using cached `CanvasPattern`s. Rendering reads state set by mutators; performance-sensitive work runs through `fps.ts` (`startWork`, `frameStarted`).
- **Reusable arrays** (`particles`, `texts`, `lights`, `coins`, `respawns`) follow the `ReusableArray<T>` pattern (`indexMin`, `total`, `list`) with `forEachLiveOne` — items are reused, not GC'd. Don't `.push` directly.
- **Perks/upgrades** are defined in `src/upgrades.ts` as a `rawUpgrades` const array; the union of their `id`s becomes the `PerkId` type. Each perk *must* have a matching brick-art icon level named `icon:<perkId>` in `src/data/levels.json` (enforced by `src/upgrades.test.ts`). Categories (`beginner`, `combo`, `combo_boost`, `simple`, `pierce`, `advanced`) drive sort order and the picker UI.
- **Level data** lives in `src/data/levels.json` as `RawLevel` (a string of palette keys). `loadGameData.ts` decodes bricks via `palette.json`, generates SVG via `getLevelBackground.ts`, and exposes `allLevels` (gameplay) and `allLevelsAndIcons` (includes `icon:*` levels used as perk art).
- **Unlock logic** (`get_level_unlock_condition.ts`) is partly hardcoded (`src/data/unlockConditions.json`) and partly derived from a hash of the level index/name; tests in `src/data/unlockConditions.test.ts` enforce that every gameplay level resolves to a condition with valid perk IDs.

### Persistence
- All save data is in `localStorage`. `src/settings.ts` caches reads on boot and flushes writes every 500 ms via `setSettingValue` / `commitSettingsChangesToLocalStorage`.
- `src/migrations.ts` runs idempotent localStorage migrations on every load (each guarded by a marker key). If any ran, it sets `window.location.hash = "#reloadAfterMigration"` and reloads. Add new migrations by appending another `migrate(...)` call.

### i18n
- Translations live in `src/i18n/*.json` and are managed externally by **Weblate** — they are excluded from prettier (`.prettierignore`). Don't reformat them.
- `checks.js` scrubs accidental HTML/links and known mistranslations of "puck"/"palet" before commit.
- Add new strings to `src/i18n/en.json` and reference them via `t("key", { vars })`. The `i18n.test.ts` suite enforces matching `{{var}}` placeholders across languages.

### Android wrapper (`app/`)
- Single-activity Kotlin app (`MainActivity.kt`) that loads `file:///android_asset/index.html?isInWebView=true` in a `WebView` and bridges file downloads (save data, recordings) via `MediaStore` / `FileProvider`.
- `build.sh` copies the parcel-built `index.html` into `app/src/main/assets/` — the APK ships only that one file plus icons.
- `app/build.gradle.kts` reads `keystore.properties` if present; without it, only `assembleDebug` works.

### Level editor
A separate parcel entrypoint (`src/editor.html` + `src/level_editor/levels_editor.tsx`, React) that POSTs/GETs `src/data/levels.json` against the local node server in `editserver.js` (port 4400). Both are spawned in parallel by `npm run start` (`npm-run-all` via `start.sh`).

### Service worker
`src/PWA/sw-b71.js` only activates for `/index.html?isPWA=true`. Its `VERSION` constant is rewritten by `build.sh` so cache buckets match the build.

## Conventions

- TypeScript with `strict: true`, `rootDir: "src"`, target ES2017.
- Tests are colocated as `*.test.ts(x)` and run under `ts-jest` with `jsdom`.
- `checks.js` (run by `build.sh`/`deploy.sh`) blocks commits containing `TODO`, `FIXME`, or `console.log` anywhere under `src/`. Keep diagnostics behind `console.debug`/`console.warn`.
- Keep `src/data/levels.json` as compact JSON — the editor backend rewrites it whole on save.
