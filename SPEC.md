# Mon Dressing — Specification

> Living document. Sections are numbered (§1, §2…) and referenced from `CLAUDE.md`, commit messages and `DATA_MODEL.md`.
> When a decision changes, update the section **and** log the old decision in §14.2 "Superseded decisions".
> Anything listed in §14.1 "Open items" must not be assumed: ask before implementing.

Working title: **Mon Dressing** (final name decided in Tier 2, see §13.5).

---

## §1 Product overview

### §1.1 Problem
Choosing an outfit each morning means opening the window, checking the forecast for rain later in the day, then opening several wardrobes and drawers. Mon Dressing replaces that ritual: **in a few seconds** it knows today's weather and today's program, and proposes a default outfit built only from garments that are **actually available right now** (not in the laundry basket, not drying, not waiting to be ironed). Each piece of the outfit can be swapped individually with a swipe.

### §1.2 Principles
1. **Speed above all.** Time from app open to decision is the success metric (see R1).
2. **An assistant, not a diary.** No daily logging obligation. Every recurring chore is either a single gesture or automatic.
3. **Sobriety as a through-line.** Fewer washes (airing between wears, ADEME guidance), no account, no server, no data collection. This is a product value *and* an architecture choice.
4. **The user's choice always wins over the engine.**

### §1.3 Audience and nature of the project
- Primary user: Candice (personal daily use).
- Portfolio piece (front-end/mobile **and** UX/UI), published on the App Store and Google Play so recruiters can try it; open to any user it suits.
- **Ultimate fallback:** if the app is never shipped, the project still yields a presentable UX/UI case study. Design rationale is therefore documented as we go (this spec, the `design/` handoff folder, design journal).

---

## §2 Scope

### §2.1 Tier 1 — the core (useful to Candice alone, installed as a development build)
- Inventory: add garments with photo **+ automatic cutout (background removal)**, subtype, prefilled attributes (§4).
- Availability lifecycle: locations, wear counter, airing, laundry cycle, ironing (§8).
- Weather via Open-Meteo, evaluated on commute/outdoor windows (§6).
- Day context: activity + commute modes, weekly program, one-tap override (§5).
- Deterministic suggestion engine: one default outfit, per-slot swipe through compatible alternatives (§7).
- "I'm wearing this outfit" validation, evening sort (§9).
- Today / Laundry / Wardrobe tabs, minimal onboarding (§9).
- Reminders line under the weather (umbrella, gloves…).

### §2.2 Tier 2 — publishable v1
- 2–3 outfit variants.
- Demo mode (pre-filled "Demo" wardrobe).
- English localisation.
- Backup export/import (archive of DB + photos).
- Maestro E2E flows on critical paths.
- Store publication (TestFlight, Play closed test, production).

### §2.3 Deferred (post-v1) — do not build without an explicit decision
- Calendar sync.
- Secondary wardrobes UI (suitcase, other home). **The `wardrobe` entity exists from day 1** (§11.3, `DATA_MODEL.md`).
- Explicit pair exclusions "never combine X with Y" (§4.5).
- Automatic frequency-based ranking (data is collected from day 1, §8.6).
- Dominant-colour extraction (display/filter/sort only — never used by the engine).
- Accessories as swipeable slots, multi-slot days (office morning + evening out), weather alert notifications after validation, manual cutout retouching, "donated/sold" archiving, free-text tags.

---

## §3 Known risks

No risk in this list is a kill switch: the ultimate fallback for every one of them is the UX/UI case study (§1.3).

| # | Risk | Early test | Classification | Fallback |
|---|---|---|---|---|
| R7 | On-device cutout unusable or poor on one platform | **S1–S2**: minimal native module, fixed set of ~15 real garment photos, run on iPhone 12 mini and Galaxy A06. Measure quality, processing time, minimum iOS version, Android model download behaviour | Replanning trigger | Chain (§10.4): embedded open-source model → Replicate via serverless proxy (another Replicate model before giving up) → case study |
| R2 | Adding the wardrobe is too tedious; inventory never completed | **S3**: time adding 10 real garments in burst mode. Target **< 30 s per garment** | Replanning trigger | Stronger subtype prefill, partial inventory sufficient to start |
| R3 | Engine proposes incoherent outfits | **S4**: 10 reference scenarios on the real wardrobe, each proposal rated; scenarios become permanent test fixtures | Replanning trigger | Tune rules; pull pair exclusions (§4.5) into Tier 1 |
| R4 | Weather data insufficient (hourly precision, quotas, terms) | **S4**: real Open-Meteo calls | Replanning trigger | MET Norway (yr.no) |
| R9 | Carousel / translucent surfaces not smooth on low-end Android | **S6**: interaction prototype on Galaxy A06 | Replanning trigger | Flat carousel; semi-opaque surfaces without blur |
| R1 | Opening the app is not faster than the current ritual | **After S9**: 1–2 weeks of real use, time from open to decision | Replanning trigger (portfolio value remains) | Rework the Today screen; case study |
| R5 | App rejected by stores (too minimal, unusable without data) | **S12**: early external TestFlight with demo mode | Replanning trigger | Richer demo, onboarding adjustments |
| R8 | Google Play: new personal account must run a closed test with ≥ 12 opted-in testers for 14 consecutive days (counter resets below 12) | Account created during Tier 1; testers recruited from S10 | Replanning trigger | Start the closed test in parallel with Tier 2 polish |
| R6 | Not enough personal time | Mid-roadmap checkpoint (end of Tier 1) | Replanning trigger | Tier 1 alone is useful |

Sequencing: R7 → R2 → R3/R4 → R9 → R1 → R5/R8. R7 comes first because cutout quality conditions Candice's own adoption.

---

## §4 Garments and outfits

### §4.1 Outfit anatomy — slots
| Slot | Presence |
|---|---|
| `top` | Always, unless the one-piece template is used |
| `bottom` | Always, unless the one-piece template is used |
| `onePiece` (dress, jumpsuit) | Alternative to top + bottom |
| `midLayer` (sweater, cardigan, blazer) | Conditional: temperature, or imposed by activity |
| `outerLayer` (jacket, coat, raincoat) | Conditional: temperature and rain |
| `shoes` | Always |

- "Top + bottom" vs "one-piece" is an **outfit template**, switched by a discreet button on the bottom row (shown only if at least one compatible one-piece is available). Not a swipe.
- **An activity can impose a layer** regardless of weather (e.g. job interview → `midLayer` with formality `dressy`, such as a blazer). A blazer is a `midLayer`.
- Underwear and socks are out of scope. Accessories are not slots; gloves/scarf/umbrella appear only as reminders (§6.5).

### §4.2 Attributes
| Attribute | Values | Engine role |
|---|---|---|
| `slot` | see §4.1 | Row in the outfit |
| `subtype` | t-shirt, shirt, jeans, dress, raincoat, ankle boots… | **Prefills every other attribute** |
| `warmth` | 1 light · 2 medium · 3 warm | Sum of layers compared with a target derived from felt temperature (§6.3) |
| `formality` | `sport` · `casual` · `smart` · `dressy` | Each activity accepts a range |
| `waterproof` | boolean | Outer layer and shoes when rain hits a constraining window |
| `bikeFriendly` | boolean | Excludes long wide skirts, heels… when commuting by bike |
| `technical` | boolean + optional list of user-created sports | Required by "Outdoor sport" activity (§5.1) |
| `statementPiece` | boolean (default false) | Max one per outfit (§4.5) |
| `needsIroning` | boolean | After washing → "to iron" instead of available (§8) |
| `material` | optional | Adjusts default `maxWears` |
| `maxWears` | integer | Wears before washing (§8.2) |
| `isFavorite` | boolean | §4.4 |

Default add flow: **photo → subtype → save**. Only `statementPiece`, favourite and material are typically corrected, all optional.

### §4.3 Sports
- Users create their own sport labels (cycling, hiking, running…). They also act as filters in the Wardrobe.
- A technical garment can be linked to several sports, or to none ("technical" alone is enough for single-sport users).
- `formality = sport` covers a sporty *style* (hoodie, joggers) and is independent from `technical` (performance gear). Examples: joggers = sport / not technical; trail jacket = sport / technical; shirt = smart / not technical.

### §4.4 Favourites
- Toggled from the garment sheet or the floating action menu (§9.1).
- **Default outfit:** strong score bonus, never forced (otherwise the default outfit would always be identical).
- **Per-slot swipe:** favourites first among compatible garments.
- Tier 2+: frequency-based ranking from validation history (§8.6), frequency weight capped to avoid a self-reinforcing loop; possible light penalty for very recently worn items.

### §4.5 Coordination
- Tier 1 rule: **at most one statement piece per outfit**.
- Deferred: explicit exclusions via long press on a combination. Pulled into Tier 1 if R3 shows the single rule is not enough.
- Colour-harmony algorithms: rejected.

**End-to-end verification (§4):** add one garment of each slot with the default flow; open each sheet and check prefilled attributes match the subtype table; mark two items as statement pieces and confirm the engine never proposes both in one outfit across all §7 scenarios.

---

## §5 Day context

### §5.1 Two independent axes
- **Activity — exactly one per day:** office, remote work, weekend, holidays, professional event (e.g. job interview), outdoor sport (optional sport label). User-customisable presets. Carries the **formality range**, the **"fresh pieces required"** flag and possibly an **imposed layer**.
- **Commute modes — one or more:** walking, bike, public transport, car. With several, the engine applies the most demanding constraint.
- Bike as commute → `bikeFriendly` pieces. Cycling as activity → technical gear.

### §5.2 Weekly program
- Set at onboarding from a template ("Office 5 days", "Hybrid 2 office / 3 remote", "Remote") then editable.
- Each day type carries approximate times (default departure 08:30, return 18:30) and a lunch outing (default on for office, 12:00–14:00).
- Applied every morning **without asking**.

### §5.3 One-off override
- Two chips at the top of Today (e.g. "Office · Bike"). Tap → compact picker → outfit recomputed instantly.
- Override is for today only; the weekly program is unchanged.

**End-to-end verification (§5):** configure "Hybrid"; check Monday and Tuesday open on the right chips; override Tuesday to "Office · Public transport", confirm the outfit recomputes, then confirm Wednesday is unaffected.

---

## §6 Weather

### §6.1 Provider
- **Open-Meteo** (no API key, hourly felt temperature and precipitation probability). Fallback: MET Norway.
- CC BY 4.0 attribution shown in Settings.
- **Before publication:** email Open-Meteo to confirm a free, ad-free store app qualifies as non-commercial (§14.1).
- Fetched at app open, cached (TanStack Query).

### §6.2 Windows
| Day type | Windows constraining the outfit | Windows producing a reminder only |
|---|---|---|
| Office | Outbound and return commutes (± 1 h for rain) | Lunch outing |
| Remote work | None, unless a commute is added | Lunch outing, if enabled |
| Weekend, holidays, outdoor sport | Whole active day (default 09:00–19:00) | — |

### §6.3 Warmth target
- Based on the **minimum felt temperature during constraining windows**, not the daily average.
- Bike commute: target raised (relative wind).
- Days without constraining window: indoor comfort; outer layers not proposed.
- The sum of layer `warmth` vs target is what makes conditional layers appear (§4.1).

### §6.4 Rain
- Probability above threshold (see §14.1) during a constraining window → `waterproof` outer layer and shoes required.

### §6.5 Reminders line
- One line under the weather: "Umbrella advised around 12:30", "Remember gloves". Text rules only, no slot.

### §6.6 Location
- City set at onboarding, optional geolocation.
- Each wardrobe can carry its own city (holiday wardrobes, post-v1 UI).

**End-to-end verification (§6):** with recorded forecasts, check: rain at 14:00 on an office day → no raincoat, no reminder; rain at 12:30 → reminder only; rain at 18:00 → raincoat + waterproof shoes; cold morning / mild afternoon → layers sized for the morning.

---

## §7 Suggestion engine

- **Pure, deterministic TypeScript module. No LLM.** Inputs are injected: `now`, forecast, inventory, context, settings. It never reads the clock or the database directly.
- Pipeline:
  1. Eligible garments = in the active wardrobe ∧ in an *available* location (§8.1) ∧ not over wear limit.
  2. Activity constraints: formality range, imposed layers, technical requirement (sport label → any technical → most casual, flagged).
  3. Commute constraints: `bikeFriendly`, walking-suitable shoes.
  4. Weather constraints: warmth target → number of layers; rain → waterproof.
  5. Freshness: when the activity requires fresh pieces, exclude garments whose **relative wear** (`wearCount / maxWears`) exceeds the threshold (§14.1). A pair of jeans at 2/10 stays eligible; a cotton t-shirt at 1/2 does not.
  6. Score: favourite bonus (+ frequency in Tier 2+), coordination rule (§4.5).
  7. Output: default outfit + **ranked alternatives per slot** (favourites first).
- Swiping a row **never changes other rows**. If the user's choice breaks a rule (two statement pieces), a discreet indicator shows it; nothing is corrected automatically.
- Once the outfit is validated ("I'm wearing this outfit"), it is **frozen for the day** (no recomputation on later opens, even if the forecast changes).
- Tier 2: 2–3 variants, selected through tabs near the header (never by swipe).

**End-to-end verification (§7):** run the 10 reference scenarios (R3) as Jest fixtures and on device with the real wardrobe; validate an outfit, change the forecast fixture, reopen: outfit unchanged.

---

## §8 Garment lifecycle

### §8.1 Locations
| Location | Available to the engine | Badge |
|---|---|---|
| `stored` (wardrobe/drawers) | yes | — |
| `airing` (outdoor rack / balcony) | yes, from the next morning | "balcony" |
| `onDryingRack` (dry, not put away) | yes | "drying rack" |
| `dirty` (laundry basket) | no | — |
| `drying` | no | — |
| `toIron` | no | — |
Shoes are never sorted: they always return to `stored`.

### §8.2 Wear counter
- `wearCount` since last wash, compared with `maxWears` (default from subtype + material, calibrated on the official ADEME list — §14.1; editable per garment).
- Incremented on **outfit validation**.

### §8.3 Airing option ("eco option")
- Global setting. **Offered at the first evening sort** (just-in-time, §9.7), changeable in Settings.
- Off: evening sort sends items straight to `dirty`, counter hidden.

### §8.4 Transitions
```
stored ──(validated + evening sort)──▶ airing | dirty | stored
airing ──(next morning, automatic)──▶ available with "balcony" badge (location stays airing until put away)
dirty ──[Laundry done]──▶ drying
drying ──(auto after delay, default 24 h, or "Dry" gesture)──▶
    ├─ needsIroning ──▶ toIron ──[Ironed]──▶ stored
    ├─ auto put-away ON ──▶ stored
    └─ auto put-away OFF ──▶ onDryingRack ──[Laundry put away] / long press "Put away"──▶ stored
any available ──(long press "Not available: dirty")──▶ dirty
```
- Wear counter resets when an item goes through `drying` (washed).
- When `wearCount` reaches `maxWears`, evening sort defaults to "dirty" (override allowed).
- **Auto put-away option:** offered at the first "Laundry done" (just-in-time), changeable in Settings. Candice's setting: OFF.
- "Laundry done" opens the dirty list **all pre-checked**; uncheck exceptions (hand-wash wool, separate colours).
- The lifecycle is implemented as an **explicit state machine** (pure module, exhaustive transition tests).

### §8.5 Evening sort
- From a configurable time (default **20:00**), if an outfit was validated and not sorted, Today shows a "Put away today's outfit" card.
- No notification by default (opt-in in Settings).
- Sorting happens **on the same Today interface** via long press → floating menu (§9.1): airing / dirty / put away, with the recommended option highlighted.
- If the sort is skipped: items stay `stored` with incremented counters; any error is corrected on the fly via long press when the engine proposes an unavailable item.
- **Safety net:** if no outfit was validated, the evening card proposes the last consulted outfit as "probable outfit", editable.

### §8.6 History
Every location change and every validation is written to an append-only log with timestamp. **Usage signal = validation.** Used for Tier 2 ranking; collected silently from day 1.

**End-to-end verification (§8):** walk one t-shirt (maxWears 2), one pair of jeans (maxWears 10) and one shirt (needsIroning) through two days of validation, evening sort, laundry, drying, ironing, with auto put-away OFF then ON. Check each location, badge, availability and counter at every step, and that history rows exist.

---

## §9 Screens and interactions

### §9.1 Gesture grammar (applies to every screen)
| Gesture | Meaning |
|---|---|
| Swipe | Choose another garment / browse — nothing else |
| Tap | See it large (single-piece bottom sheet) |
| Long press | Act on the garment: floating radial menu (Pinterest-style, press-drag-release): favourite, airing, dirty, put away (Tier 2+: "don't combine") |
- Recommended action highlighted in the menu.
- Long-press actions are also exposed as **accessibility actions** (VoiceOver/TalkBack).
- One-time hint on first validated outfit.

### §9.2 Navigation
- Custom **floating tab bar**: Laundry (left) · **Today (centre, larger)** · Wardrobe (right).
- Today icon must evoke "today's outfit" (hanger/silhouette), never "+".
- App always opens on Today.
- Settings: icon in Today's header.
- Scrollable content keeps bottom padding so nothing hides under the bar.

### §9.3 Today
- Header: large date and temperature, most significant rain episode with its time, reminders line, activity/commute chips. Weather-driven background halo (see `design/specs/01-aujourdhui.md`).
- Tier 2 variant tabs near the header.
- Layout states (depend on whether layers are recommended for the day — by weather **or** activity, or added manually):
  - **State A — no layer:** single centred column (top, bottom/one-piece, shoes), each row directly swipeable; "+" button on the left to add a layer.
  - **State B — ≥ 1 layer:** column shifts right; layers stacked on the left (outer above mid). Tap a layer → bottom sheet with **that piece only**, swipeable. Tap the column → State C.
  - **State C — editing the base:** column recentred and directly swipeable; layers shrunk to thumbnails on the left; tap a thumbnail → back to B.
  - **Open: 2 vs 3 states** — variant where the column stays directly swipeable in B (no State C). Decided by prototype test in S6 (§14.1).
- Animated transitions (column sliding, layers shrinking) are part of the spec, not polish. Reduced-motion: cross-fade.
- Removing a layer: "Remove" in its bottom sheet; last layer removed → State A.
- "I'm wearing this outfit" button just above the tab bar.
- Physical-location badges on pieces (balcony, drying rack).

### §9.4 Bottom sheet (single piece)
- Large view of the tapped piece, swipeable through compatible alternatives using the **shared carousel component** (§9.6). The top third of the screen stays visible to keep the outfit in context.

### §9.5 Laundry tab
- Sections: Dirty ("Laundry done"), Drying (+ "Dry"), On drying rack ("Laundry put away"), To iron.
- To iron: carousel of pending pieces; big **"Ironed"** button under the card, auto-advance to next piece; "Mark all as ironed" + multi-select.

### §9.6 Wardrobe tab
- Default view: **one carousel per slot**, slot chips on top, filters (available, favourites, sports). Centre piece large; neighbours **smaller and receding (scale + opacity), no 3D rotation**. Name, badges, wear gauge (if airing on) and position ("12 / 38") under the centre piece.
- Fast inertial scrolling; default order: favourites, then available, then unavailable.
- Optional grid view (toggle in header).
- Tap → garment sheet (attributes editable inline, delete with confirmation). Long press → floating menu.
- Header keeps room for a future wardrobe selector.
- "+" → burst add flow.
- The carousel is **one shared component**, reused in the Today bottom sheet. Reduced-motion: flat carousel.

### §9.7 Add flow (burst mode)
Camera (framing guide "lay the garment on a plain background") → subtype grid (recently used first) → save → camera reopens. Gallery import available. Optional toggles on the same screen. Cutout runs in the background (§10).

### §9.8 First launch and onboarding
- Two doors: **"Explore with a demo wardrobe"** (Tier 2) / **"Create my wardrobe"**.
- Create: city (or geolocation) → weekly template in one tap → burst add. Today shows a guiding empty state ("1 more bottom and 1 pair of shoes for your first outfit"); engine starts as soon as a minimal outfit is possible.
- **Just-in-time options:** airing option at first evening sort; auto put-away at first "Laundry done".
- Demo mode = a wardrobe named "Demo" with ~30 cutout garments (Candice's own clothes); leaving it deletes that wardrobe.

### §9.9 Settings
Weekly program and times, lunch outing, airing option, auto put-away, drying delay, evening sort time, notifications, city/geolocation, language (Tier 2), Open-Meteo attribution, privacy policy link.

**End-to-end verification (§9):** on iPhone 12 mini and Galaxy A06: open on a cold rainy office day → State B with two layers; change the coat via its sheet; switch to C and change the top; return to B; validate; at 20:00 sort via long press; check with VoiceOver that every long-press action is reachable; enable reduce-motion and redo the flow.

---

## §10 Cutout pipeline

### §10.1 Native module
- Home-made **Expo module** (Expo Modules API): Swift + Vision on iOS, Kotlin + ML Kit Subject Segmentation on Android (ML Kit API currently **beta**). `react-native-subject-lift` is a reading reference only, not a dependency.
- Single function: image in → cutout image (PNG with alpha) out.
- Requires a development build (no Expo Go).

### §10.2 Asynchronous processing
Photo saved immediately; cutout computed afterwards; card shows a loading state. Burst-mode timing (R2) must not include processing time.

### §10.3 User fallback
Toggle "cutout / original photo" on the garment sheet. Cards are designed to work with both.

### §10.4 Fallback chain (R7)
1. On-device native APIs (target).
2. Embedded open-source segmentation model (ONNX or equivalent).
3. **Replicate** via a serverless proxy holding the key (try another Replicate model before giving up). Photoroom rejected. Would require privacy policy and store privacy labels update.
4. UX/UI case study.

**End-to-end verification (§10):** run the fixed 15-photo protocol on both devices after any module change; record quality notes and processing time per photo in `docs/cutout-protocol.md`.

---

## §11 Architecture and tech stack

### §11.1 Local-first, no backend
- No account, no server, no data collection. Store privacy labels: "no data collected".
- Only possible server element: the Replicate proxy, built **only if** that fallback is triggered.

### §11.2 Stack
- Expo, **latest stable SDK at init** (SDK 57 / React Native 0.86 at the time of writing — check whether SDK 58 is out), development build via EAS.
- TypeScript `strict`.
- Expo Router; custom floating tab bar.
- Reanimated 4 + Gesture Handler.
- expo-image (cache, right-sized thumbnails).
- expo-sqlite + Drizzle ORM (typed schema, versioned migrations, live queries). See `DATA_MODEL.md`.
- State: Drizzle live queries for data (single source of truth); TanStack Query for weather; Zustand only for shared transient UI state (today's override).
- expo-file-system: photos in the documents directory, **relative paths only**.
- expo-localization + i18next: all strings externalised from day 1; FR in Tier 1, EN in Tier 2.
- ESLint, Prettier, Jest (jest-expo).

### §11.3 Forward-compatibility rules
- **UUIDs** for every entity (sync remains possible later without rewrite).
- `wardrobe` entity from day 1 (demo mode, secondary wardrobes).
- Relative photo paths (export/import).

### §11.4 Backup
- Tier 1: rely on system backups (iOS documents directory). Android coverage to verify (§14.1).
- Tier 2: manual export/import archive (DB + photos).

---

## §12 Testing strategy

### §12.1 Automated (Jest)
- Suggestion engine: 10 reference scenarios as fixtures.
- Lifecycle state machine: every allowed/forbidden transition.
- Weather window evaluation with recorded forecasts.
- Date/time edge cases: DST switches, midnight, a wardrobe's own time zone.
- Data queries: same Drizzle schema on in-memory SQLite in Node.

### §12.2 Deliberately not automated
Visual components/snapshots; animations and gestures (judged on device); the native cutout module (manual protocol §10); E2E in Tier 1 (Maestro in Tier 2 on: enter demo mode, validate outfit, evening sort).

### §12.3 Definition of done
1. Logic tests pass.
2. The section's end-to-end verification has been run on **iPhone 12 mini and Galaxy A06**.
3. Screen-reader labels and accessibility actions in place.
4. Reduced-motion fallback works where relevant.
5. No hard-coded user-facing string.

---

## §13 Distribution and release

### §13.1 Accounts and budget
- **Personal** Apple Developer (~99 €/year, create before S1) and Google Play Console (25 $ once, create during Tier 1). Never the employer's accounts.
- EAS free plan (15 Android + 15 iOS builds/month); local builds on the Mac mini as fallback.
- Open-Meteo free; Replicate ≈ 0 € if triggered.

### §13.2 Stages
Tier 1: development build on Candice's devices → Tier 2: TestFlight + Play closed test (≥ 12 testers, 14 consecutive days, started in parallel with polish) → production.

### §13.3 Identifiers
Bundle ID / package name are **immutable after publication** and independent from the commercial name: proposed `com.candygetshandy.wardrobe` (confirm in S1, §14.1).

### §13.4 Privacy policy
Hosted as a page on candygetshandy.com (Ghost). Required by both stores even with no data collected.

### §13.5 Naming
Dedicated session in Tier 2 (S11), with store availability check. Display name can change at any update.

---

## §14 Open items and decision log

### §14.1 Open items — do not assume, ask before implementing
| Item | Resolved when |
|---|---|
| Default `maxWears` per subtype/material, from the **official ADEME page** | S3 |
| Relative-wear threshold for "fresh pieces required" | S4 |
| Rain probability threshold and ± window margin | S4 |
| Bike warmth correction value | S4 |
| Minimum iOS version (cutout API) | S2 |
| Android ML Kit model delivery / size | S2 |
| Android system backup coverage for photos | S3 |
| Bundle ID confirmation | S1 |
| 2 vs 3 Today states | S6 prototype test |
| Piece shadow: none / contact / drop | S5 exploration |
| Glass blur vs semi-opaque on Android | S6 |
| Open-Meteo non-commercial confirmation | Before S12 |
| Final app name | S11 |

### §14.2 Superseded decisions
| Date | Old decision | New decision | Why |
|---|---|---|---|
| 2026-10-24 | Usage signal = transition to "dirty" | Usage signal = outfit validation | Airing means a worn item doesn't always go to the laundry; validation is explicit |
| 2026-10-24 | No "validate outfit" button | "I'm wearing this outfit" button + "probable outfit" safety net | Evening sort needs to know what was worn; freezing the outfit for the day |
| 2026-10-24 | Cutout in Tier 2 | Cutout in Tier 1 | Candice would not use the app without it |
| 2026-10-24 | Airing and auto put-away options asked during onboarding | Asked just-in-time (first evening sort / first "Laundry done") | Understood better when it applies; shorter onboarding |
| 2026-10-24 | Grid Wardrobe | Carousel per slot, grid optional | Grid looks small, cluttered and empty with cutouts |
| 2026-10-24 | 3D Cover Flow rotation | Scale + opacity carousel, no rotation | Matches reference, less dated, lighter on low-end Android |
| 2026-10-24 | Fixed layer zone even when empty | States A/B/C driven by recommended layers | Avoids a dead zone half of the year |
| 2026-10-24 | Engine weather = whole day | Constraining windows + reminder-only short outings | Only time spent outside matters |
| 2026-10-24 | Single "laundry done" returns everything | Drying timer + optional auto put-away, "On drying rack" location | Folding can take weeks; dry items are wearable from the rack |

---

## §15 Session roadmap

Each session ships something testable and ends with its verification step. Risk tests come first (§3).

### Before S1 (Candice)
Create the personal Apple Developer account (identity verification can take days). Until it is active, sign locally with Xcode and a free Apple ID.

### Tier 1
| Session | Ships | Verification | Risk |
|---|---|---|---|
| S1 | Repo (public), Expo + TS strict, ESLint/Prettier/Jest, **Husky hooks + Claude Code SessionStart hook + gitleaks + lifecycle grep check + i18n lint rule**, bundle ID, `docs/cutout-protocol.md`, **iOS cutout module (minimal)** | A non-conventional commit and a commit on `main` are rejected; cutout of 15 photos on iPhone 12 mini | R7 (iOS) |
| S2 | Android cutout module, protocol on both devices, fallback-chain decision, min iOS version | Protocol results recorded | R7 (decision) |
| S3 | Drizzle schema + migrations, lifecycle state machine + tests, burst add flow with async cutout, subtype catalogue with ADEME values | **10 real garments added, timed (< 30 s each)**; state-machine tests green | R2 |
| S4 | Engine v0, Open-Meteo windows, reminders, 10 reference scenarios as fixtures | Scenarios rated on the real wardrobe; recorded forecasts tests | R3, R4 |
| S5 | Claude Design exploration → Figma tokens and key screens (outside Claude Code, can run in parallel with S3–S4) | Direction chosen, open design items §14.1 resolved | — |
| S6 | Coded interaction prototype: Today A/B/C vs 2-state variant, shared carousel, floating menu, tab bar; perf on Galaxy A06 (blur fallback) | 2 vs 3 states decided with 2–3 testers; smooth on A06 | R9 |
| S7 | Today complete, validation + freeze, evening sort, probable-outfit safety net | §9 verification | — |
| S8 | Laundry tab (full cycle), Wardrobe tab (carousel, grid, sheet) | §8 and §9 verifications | — |
| S9 | Onboarding, weekly program, settings, just-in-time prompts | First-launch flow on both devices | — |
| **Checkpoint** | **1–2 weeks of real use** (time from open to decision), then **re-examine the Tier 1 / Tier 2 cut** | Timing log | R1, R6 |

### Tier 2
| Session | Ships | Verification | Risk |
|---|---|---|---|
| S10 | Outfit variants, demo mode ("Demo" wardrobe with Candice's photos); start recruiting the 12 testers; create Play Console account if not done | Recruiter flow < 10 s to value | R5 |
| S11 | **Naming session**, app icon, English localisation, export/import (priority per Android backup finding) | Round-trip export/import on another device | — |
| S12 | Privacy page on candygetshandy.com, Open-Meteo confirmation, store listings, Maestro flows; **start TestFlight + Play closed test (14 days)** | Maestro green; builds accepted in test tracks | R5, R8 |
| S13 | Fixes from tester feedback, production release | Live on both stores | — |
