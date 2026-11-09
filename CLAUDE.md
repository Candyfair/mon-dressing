# CLAUDE.md — Frog-à-porter

## 1. Project overview
Mobile app (iOS + Android, Expo) that proposes today's outfit from the weather, the day's program and the garments actually available (not dirty, drying or waiting to be ironed). Personal daily tool for Candice, portfolio piece (mobile dev + UX/UI), published on both stores. Product values: speed, assistant-not-diary, sobriety. Full context: `SPEC.md` §1.

## 2. Tech stack
- Expo (latest stable SDK at init), development build via EAS — no Expo Go (native cutout module)
- TypeScript `strict`
- Expo Router + custom floating tab bar
- Reanimated 4 + Gesture Handler
- expo-image
- expo-sqlite + Drizzle ORM → `DATA_MODEL.md`
- TanStack Query (weather only), Zustand (shared transient UI state only)
- Open-Meteo (no key), fallback MET Norway
- Home-made Expo native module: Vision (iOS) / ML Kit Subject Segmentation (Android)
- expo-localization + i18next
- Jest (jest-expo), ESLint, Prettier; Maestro in Tier 2
Rationale for every choice: `SPEC.md` §11.

## 3. Key architectural decisions — do not deviate without checking SPEC.md
1. **Local-first, no backend, no account, no data collection** (§11.1). The only allowed server piece is the Replicate proxy, and only if the cutout fallback is triggered (§10.4).
2. **Suggestion engine, lifecycle state machine and weather evaluation are pure modules**: `now`, forecast, inventory and settings are injected; they never read the clock or the DB (§7, §12).
3. **No LLM anywhere in the decision path** (§7).
4. **SQLite is the single source of truth**; no global store duplicating DB data (§11.2).
5. **UUIDs everywhere, relative photo paths, `wardrobe` entity from day 1** (§11.3).
6. **`garments.location` / `locationSince` / `toIron` / `wearCount` are written only by `src/domain/lifecycle/`**, always with a `garmentEvents` row in the same transaction (`DATA_MODEL.md` §4).
7. **Gesture grammar**: swipe = choose/browse only (every carousel loops), tap = see large (Laundry: tap selects), long press = act (radial menu). Swiping a row never changes other rows (§9.1, §7).
8. **The user's choice wins over the engine**; validated outfits are frozen for the day (§7).
9. **Cutout runs asynchronously**; cards work with and without cutout (§10).
10. **All user-facing strings externalised** (i18next) from the first screen.

## 4. Working agreement

### 4.1 Review levels
**Level 1 — diff + exact commit message shown and approved individually, every time**
- `src/db/schema.ts`, migrations, anything in `DATA_MODEL.md`
- Native module (Swift/Kotlin), config plugins
- `app.json` / `app.config.ts`, `eas.json`, permissions, bundle ID / package name
- Semantics of the suggestion engine or the lifecycle state machine (anything changing what is proposed or how a garment changes state)
- Adding a dependency or a major version bump

**Level 2 — batched review at a checkpoint (end of feature / session)**
- Screens and components implementing an already-locked SPEC section
- Tests
- **Visual choices and user-facing copy**: apply tokens and copy from `design/` (journey specs, `tokens.json`, mockups); never decide a colour, spacing or wording alone — collect deviations for review
- At each level-2 checkpoint, **list the non-trivial TypeScript choices of the session with a one-line explanation each** (Candice is learning TS)

**Level 3 — resolved autonomously, documented in the commit message**
- Internal naming, file organisation, behaviour-preserving refactors
- Fixing types, tests, lint

### 4.2 Plan Mode
- **Required:** new architectural ground or anything not fully specified — native module, engine, state machine, new dependency, carousel mechanics, migrations with data transformation.
- **Skippable:** implementing a screen or behaviour already fully described in SPEC.

### 4.3 Ambiguity escalation
Stop and ask **only** if the decision is irreversible or costly to change later, **or** affects the demo / store-publication path, **or** has no reasonable default. Otherwise decide, and document the choice in the commit message. Anything in `SPEC.md` §14.1 must never be assumed.

### 4.4 Git
- **Conventional Commits in English** (`feat(engine): …`, `fix(laundry): …`). **No signature**: no `Co-Authored-By`, no "Generated with Claude Code" line, no attribution trailer, in commits or PRs.
- One branch per feature (`feat/<scope>-<short-name>`), merged into `main` after Candice's validation.
- **Never commit or push directly to `main`.**
- **Before any push**, show Candice the full text of the commits and of the PR (title + body), then wait for her explicit authorization to push.
- **Pre-PR review, every time**: just before opening a PR, run the `thermo-nuclear-code-quality-review` skill on the merge-base diff (`git diff --merge-base origin/main HEAD`) and show Candice its verdict together with the PR title and body. Blocking findings are fixed before the PR is opened; non-blocking ones are listed for her decision.
- **PR auto-fix, on by default**: once a PR is open, Claude subscribes to its activity and fixes CI failures and review comments. Level 3 fixes (types, lint, tests, formatting) are committed and pushed without waiting, the commit message documents the fix, and Candice gets a report afterwards. Any fix touching level 1 or level 2 still follows the rule above.

### 4.5 Enforcement layer
| Rule | Enforcement |
|---|---|
| Conventional Commits format, no attribution trailer | `commit-msg` hook (commitlint) — **mechanical** |
| No commit / push on `main` | `pre-commit` + `pre-push` hooks rejecting `main` — **mechanical** |
| No secret committed (public repo) | `pre-commit` secret scan (gitleaks) — **mechanical** |
| Lifecycle columns written only by `src/domain/lifecycle/` | `pre-commit` script grepping staged files outside that folder for writes to `location`, `locationSince`, `toIron`, `wearCount` — **mechanical** |
| No hard-coded user-facing strings | ESLint rule (`i18next/no-literal-string` on JSX) — **mechanical** |
| Types + lint + tests green before commit | `pre-commit`: `tsc --noEmit`, ESLint on staged files, Jest related tests — **mechanical** |
| Project state at session start | Claude Code `SessionStart` hook printing `git log --oneline -10`, current branch, and the §14.1 open items table — **mechanical** |
| Review levels, Plan Mode, escalation, TS explanations | Documented only (judgement) |
Hooks managed with Husky (Git) and `.claude/settings.json` (Claude Code), set up in Session 1.

## 5. Coding conventions
- Code, identifiers and comments in **English**; UI copy in French via i18n keys.
- Folders:
  - `src/app/` — Expo Router routes only (thin)
  - `src/features/<today|laundry|wardrobe|add|onboarding|settings>/` — screens, feature components, hooks
  - `src/domain/` — pure logic: `engine/`, `lifecycle/`, `weather/`, `catalogue/` (no React, no DB, no clock)
  - `src/db/` — Drizzle schema, migrations, repositories
  - `src/ui/` — shared components (looping carousel, sheet, radial menu, tab bar), design tokens
  - `src/i18n/` — locales
  - `modules/subject-cutout/` — Expo native module
- Discriminated unions for states; no `any`; exhaustive `switch` with `never` checks on enums.
- Components: function components, named exports; one component per file in `src/ui/`.
- Tests next to the code (`*.test.ts`); engine scenarios in `src/domain/engine/__fixtures__/`.
- Design tokens only from `src/ui/tokens.ts`, generated from `design/design-system/tokens.json` (one object per theme); role tokens only (`ground`, `ink`, `action`…), no palette colours or raw hex values in components.

## 6. Commands
```bash
npm install
npx expo start --dev-client      # dev server (development build)
npx expo run:ios                 # local iOS build (Mac mini)
npx expo run:android             # local Android build
eas build --profile development --platform all
npm run typecheck                # tsc --noEmit
npm run lint
npm test                         # jest
npx drizzle-kit generate         # new migration (level 1 review)
```
(Scripts to be created in Session 1.)

## 7. Reference
| File | Purpose |
|---|---|
| `SPEC.md` | Product and technical specification, risks (§3), open items and superseded decisions (§14), session roadmap (§15) |
| `DATA_MODEL.md` | Schema, enums, invariants, migration policy |
| `docs/cutout-protocol.md` | Fixed 15-photo cutout test protocol and results (created in S1–S2) |
| `design/CLAUDE.md` | Design → code handoff guide (made with Claude Design): how to use the folder, design rules, working method |
| `design/specs/NN-*.md` | One spec per journey (rules, states, exact French copy, accessible names, open questions). **Read before coding a screen** |
| `design/design-system/` | `DESIGN-SYSTEM.md` (principles, themes, gestures, a11y, voice), `tokens.json` (**source of truth for tokens**), `components/<Name>/README.md` |
| `design/mockups/`, `design/screens/` | Static HTML mockups (375 × 812 pt) and WebP captures, light and dark — layout/copy reference, not code to copy |
| `design/handoff.html` | Browser overview of every validated screen |

**Precedence.** `design/` is the reference for screens, copy, tokens and visual behaviour; `SPEC.md` and `DATA_MODEL.md` for product scope, engine, lifecycle and architecture. Within `design/`, a journey spec wins over its mockup. Any conflict between `design/specs/` and `SPEC.md` is escalated to Candice, never resolved alone.
