# Frog-à-porter — Specification

> Living document. Sections are numbered (§1, §2…) and referenced from `CLAUDE.md`, commit messages and `DATA_MODEL.md`.
> When a decision changes, update the section **and** log the old decision in §14.2 "Superseded decisions".
> Anything listed in §14.1 "Open items" must not be assumed: ask before implementing.

App name: **Frog-à-porter** (see §13.5).

---

## §1 Product overview

### §1.1 Problem
Choosing an outfit each morning means opening the window, checking the forecast for rain later in the day, then opening several wardrobes and drawers. Frog-à-porter replaces that ritual: **in a few seconds** it knows today's weather and today's program, and proposes a default outfit built only from garments that are **actually available right now** (not in the laundry basket, not drying, not waiting to be ironed). Each piece of the outfit can be swapped individually with a swipe.

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
- Inventory: add garments with photo **+ automatic cutout (background removal)**, type, optional toggles and usages (§4).
- Availability lifecycle: locations, wear counter, airing, laundry cycle, ironing (§8).
- Weather via Open-Meteo, evaluated on commute/outdoor windows (§6).
- Day context: activity + commute modes + occasion, weekly program, one-tap override (§5).
- Deterministic filtering engine: one default outfit, per-row swipe through compatible alternatives (§7).
- "Je porte cette tenue" validation, evening sort with end animation, washes-avoided counter and weather mascot (§8.5).
- Today / Laundry / Wardrobe tabs, onboarding, settings, opt-in notifications (§9).
- Reminders line under the weather (umbrella, gloves…) (§6.4).

### §2.2 Tier 2 — publishable v1
- 2–3 outfit variants.
- Demo data (marked demo garments, rules §9.7).
- English localisation.
- Backup export/import (archive of DB + photos).
- Maestro E2E flows on critical paths.
- "Offrez-moi un thé" tip jar (in-app purchases, §13.6).
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
| R2 | Adding the wardrobe is too tedious; inventory never completed | **S3**: time adding 10 real garments in burst mode. Target **< 30 s per garment** | Replanning trigger | Faster type grid (recent types), partial inventory sufficient to start |
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
| `top` | Always, unless a one-piece is selected |
| `bottom` | Always, unless a one-piece is selected |
| `onePiece` (dress, dungarees, jumpsuit) | Takes the place of top + bottom |
| `midLayer` (sweater, cardigan, blazer) — "Couche 1" | Conditional: weather (§6.3), or added manually |
| `outerLayer` (jacket, coat, raincoat) — "Couche 2" | Conditional: weather (§6.3), or added manually |
| `shoes` | Always (optional for validation, §9.3) |

- **One-pieces live in the top carousel**, interleaved with tops in the same order (rotation, §7). When a one-piece arrives, the bottom row fades out during the swipe and disappears on release; swiping back to a top brings back the previous bottom (kept in memory). If the morning's first proposal is a one-piece, the bottom row is empty from the start. Shoes and layers stay independent.
- Underwear and socks are out of scope. Accessories are not slots; gloves/scarf/umbrella appear only as reminders (§6.5).
- Wardrobe categories (§9.5) group slots for browsing: Hauts (`top`), Couches (`midLayer` + `outerLayer`), Bas (`bottom`), Robes (`onePiece`), Chaussures (`shoes`).

### §4.2 Attributes
| Attribute | Values | Role |
|---|---|---|
| `subtype` ("type") | t-shirt, shirt, jeans, dress, raincoat, ankle boots… | Chosen by the user; determines the slot and the wear limit (§8.2) |
| `slot` | see §4.1 | Derived from the type |
| `usages` | see §4.3 | Filtering only |
| `isFavorite` | boolean | Bonus in the rotation, never absolute priority (§4.4, §7) |
| `statementPiece` ("Pièce forte") | boolean (default false) | Max one per outfit (§4.5) |
| `needsIroning` ("Se repasse") | boolean | After washing → also "to iron" (§8) |
| cutout / original photo | toggle | §10.3 |

Default add flow: **photo → type → save** (§9.6). Toggles (favourite, statement piece, needs ironing) and usages are optional.
**The app never infers anything from the type** other than slot and wear limit: no hidden warmth, formality or weather attributes.

### §4.3 Usages
Usages are **tags the user gives a garment**, in four groups. The app never deduces them and never recommends: it only filters.

| Group | Values |
|---|---|
| Weather ("Météo") | Hot, Mild, Cool, Cold, Rain (Chaud, Doux, Frais, Froid, Pluie) |
| Activity ("Activité") | Office, Remote, Relax, Sport (Bureau, Télétravail, Détente, Sport) |
| Commute ("Déplacement") | Walking, Bike, Scooter, Public transport, Car, Motorbike (À pied, Vélo, Trottinette, Transports en commun, Voiture, Moto) |
| Occasion | Everyday, Evening, Festive, Ceremony, Job interview (Quotidien, Soirée, Festif, Cérémonie, Entretien professionnel) |

- **No usage in a group = proposed in every case of that group.** Choosing usages restricts the garment to those cases. Help text: see `design/specs/07-ajout-en-rafale.md`.
- Matching rules: §7.
- The Wardrobe "Sport" filter shows garments with the Sport activity usage.

### §4.4 Favourites
- Toggled from the garment sheet or the long-press menu (§9.1).
- **Default outfit and every row:** favourites get a bonus in the rotation (§7), **never an absolute priority**: otherwise the same favourite would come back every day until it goes to the laundry.
- Tier 2+: frequency signals from validation history (§8.6) may refine the rotation, weight capped to avoid a self-reinforcing loop.

### §4.5 Coordination
- Tier 1 rule: **at most one statement piece per outfit** (applied to the default outfit; if the user's swipe breaks it, a discreet indicator shows it, nothing is corrected — §7).
- Deferred: explicit exclusions via long press on a combination. Pulled into Tier 1 if R3 shows the single rule is not enough.
- Colour-harmony algorithms: rejected.

**End-to-end verification (§4):** add one garment of each slot with the default flow (no usage); check each is proposed in every context; give a coat the "Cold" usage only and check it disappears on a mild day; mark two items as statement pieces and confirm the default outfit never contains both across all §7 scenarios.

---

## §5 Day context

### §5.1 Three axes
- **Activity — exactly one per day:** office, remote, relax, sport (fixed list, matches the Activity usages).
- **Commute modes — one or more:** walking, bike, scooter, public transport, car, motorbike. Set once at onboarding ("Trajet") and in Settings ("Trajet du bureau"); used on days that have a commute.
- **Occasion — exactly one per day:** everyday by default; evening, festive, ceremony, job interview set for the day through the override (§5.3).

### §5.2 Weekly program
- Set at onboarding **day by day** (Office / Remote / Relax for each weekday), then editable in Settings ("Semaine type").
- Office days carry approximate times: default departure 08:30, return 18:30 (editable in Settings).
- **"Je sors le midi"** (global setting): the weather between 11:00 and 15:00 counts in the outfit (§6.2).
- Applied every morning **without asking**.

### §5.3 One-off override
- The program label at the top of Today (activity + commute icon) opens a compact picker: activity, commute modes, occasion → outfit recomputed instantly.
- Override is for today only; the weekly program is unchanged.

**End-to-end verification (§5):** configure Mon–Tue office, Wed–Fri remote; check Monday and Tuesday open on "Bureau"; override Tuesday to Remote + occasion Evening, confirm the outfit recomputes, then confirm Wednesday is unaffected.

---

## §6 Weather

### §6.1 Provider
- **Open-Meteo** (no API key, hourly felt temperature and precipitation probability). Fallback: MET Norway.
- CC BY 4.0 attribution shown in Settings ("Données météo").
- **Before publication:** email Open-Meteo to confirm a free, ad-free store app qualifies as non-commercial (§14.1).
- Fetched at app open, cached (TanStack Query). Only the city is sent.

### §6.2 Windows
| Day type | Windows constraining the outfit | Windows producing a reminder only |
|---|---|---|
| Office | Outbound and return commutes (± 1 h for rain); **11:00–15:00 if "Je sors le midi" is on** | — |
| Remote | None, unless a commute is added by override; **11:00–15:00 if "Je sors le midi" is on** | — |
| Relax, sport | Whole active day (default 09:00–20:00) | — |

### §6.3 Weather conditions of the day
- The **minimum felt temperature during constraining windows** (not the daily average) maps to one category: Hot, Mild, Cool or Cold (thresholds: §14.1).
- Bike commute: category shifted colder (relative wind; correction value §14.1).
- Rain probability above threshold during a constraining window adds the **Rain** condition.
- Days without constraining window: indoor comfort; outer layers not proposed.
- The conditions decide **which layer slots appear** (rule: §14.1) and filter garments through their Weather usages (§7).
- Display: three ambiences only — rain, sun, cold (`design/specs/01-aujourdhui.md`).

### §6.4 Reminders line
- Two lines under the temperature: a useful forecast ("Pluie 70 % vers 18 h") and a piece of advice ("Parapluie conseillé vers 12 h 30", "Gel jusqu'à 10 h"). Text rules only, no slot.

### §6.5 Location
- City set at onboarding ("Utiliser ma position" or city search).
- Each wardrobe can carry its own city (holiday wardrobes, post-v1 UI).

**End-to-end verification (§6):** with recorded forecasts, office day, "Je sors le midi" off: rain at 14:00 → no Rain condition, reminder only; rain at 18:00 → Rain condition; "Je sors le midi" on: rain at 12:30 → Rain condition; cold morning / mild afternoon → category from the morning.

---

## §7 Suggestion engine

- **Pure, deterministic TypeScript module. No LLM.** Inputs are injected: `now`, forecast, inventory, context, settings. It never reads the clock or the database directly.
- **The app does not decide or recommend: it filters** the available garments by the usages the user gave them, then orders them.
- Pipeline:
  1. Eligible garments = in the active wardrobe ∧ available (§8.1) ∧ not over their type's wear limit (§8.2).
  2. Usage filter, group by group (weather, activity, commute, occasion): a garment **with no usage in the group passes**; otherwise at least one of its usages must match the day (weather: one of today's conditions, §6.3; commute: it must cover **every** commute mode of the day).
  3. Layers: layer slots shown according to the weather conditions (§6.3); the user can add or remove a layer.
  4. Order each row by a **deterministic rotation** so outfits vary from one day to the next:
     - main criterion: **time since last worn** (last `worn` event, §8.6), capped; never-worn garments count as worn long ago; yesterday's pieces go to the end of the row;
     - **favourite bonus**, equivalent to a few days of recency (never an absolute priority, §4.4);
     - small **fit bonus** for an explicitly matching usage versus "all cases";
     - stable tie-break (e.g. creation date) — no randomness.
     Weights: §14.1. Ordering only: nothing is hidden or advised against, every eligible garment stays one swipe away.
  5. Default outfit = first garment of each row, respecting the coordination rule (§4.5) and **avoiding exactly yesterday's outfit**; one-pieces compete in the top row (§4.1).
  6. Output: default outfit + **ranked alternatives per row**.
- Swiping a row **never changes other rows** (the only exception: a one-piece hides the bottom row, §4.1). If the user's choice breaks a rule (two statement pieces), a discreet indicator shows it; nothing is corrected automatically.
- Once the outfit is validated ("Je porte cette tenue"), it is **frozen for the day** (no recomputation on later opens, even if the forecast changes).
- Tier 2: 2–3 variants, selected through tabs near the header (never by swipe).

**End-to-end verification (§7):** run the 10 reference scenarios (R3) as Jest fixtures and on device with the real wardrobe; validate an outfit, change the forecast fixture, reopen: outfit unchanged; **rotation scenario**: 5 consecutive days with the same context and no laundry → the default outfit is never identical two days in a row and favourites come back more often without appearing every day.

---

## §8 Garment lifecycle

### §8.1 Locations and ironing
A garment has **one location** plus an independent **"to iron" flag**.

| Location | Available to the engine | Badge |
|---|---|---|
| `stored` (wardrobe/drawers) | yes | — |
| `airing` (balcony) | yes, from the next morning | balcony |
| `onDryingRack` (dry, not put away) | yes **if "L'étendoir sert de rangement" is on** (default on) | drying rack |
| `dirty` (laundry basket) | no | — |
| `drying` | no | — |

- **To iron flag** (`toIron`): set when a `needsIroning` garment is washed; the garment is **unavailable while the flag is set**, whatever its location. It shows in the Laundry "À repasser" section (double status while on the drying rack; put away without ironing, it stays in "À repasser" — "clean basket").
- Shoes are never sorted: they always return to `stored`.

### §8.2 Wear counter
- `wearCount` since last wash, compared with the **wear limit of the garment's type** ("Ports avant lavage", set per type in Settings, starting values inspired by ADEME guidance — DATA_MODEL.md §5, §14.2; "Revenir aux valeurs de départ").
- Incremented on **outfit validation** (or when a probable outfit is sorted, §8.5).

### §8.3 Airing option ("eco option")
- Global setting. **Offered at the first evening sort** where a piece could be aired ("Aérer plutôt que laver ?" — Activer l'aération / Pas maintenant), changeable in Settings.
- Off: no airing option in the sort, counter hidden.

### §8.4 Transitions
```
stored ──(worn + evening sort)──▶ airing | dirty | stored
airing ──(next morning, automatic)──▶ available with "balcony" badge (location stays airing until put away)
dirty ──[Lessive faite]──▶ drying            (wearCount reset; toIron set if needsIroning)
drying ──(auto after delay, default 24 h, or "Déjà sec ?")──▶ onDryingRack
onDryingRack ──[Linge rangé]──▶ stored        (toIron kept)
toIron ──[Repassé]──▶ flag cleared
Wardrobe long press: set any status directly (Aérer, Au sale, Ranger, À sécher, Sur l'étendoir, À repasser);
releasing on an active status removes it (location → stored, or toIron cleared).
```
- When `wearCount` reaches the wear limit, the evening sort recommends "Au sale" (override allowed).
- Laundry actions apply to the **selected** pieces of a section (§9.4).
- The lifecycle is implemented as an **explicit state machine** (pure module, exhaustive transition tests).

### §8.5 Evening sort
- From a configurable time (default **20:00**), **Today becomes the evening sort** for the day's outfit:
  - the validated outfit, or
  - **safety net:** if no outfit was explicitly validated, the outfit that was displayed when the app was last closed that day ("probable outfit"). Sorting it records it as worn.
  - **no sort** if that outfit was incomplete (guided state, validation impossible) or if the app was not opened that day: nothing is recorded as worn.
- Long press on a piece → menu limited to Favori, Aérer, Au sale, Ranger; recommended option highlighted (airing until the wear limit, dirty after; shoes: put away). Releasing on an active status removes it.
- "Ranger le reste : N pièces" finishes in one tap; "Terminer le tri" when everything is sorted.
- **End animation** (played once): pieces fly to the Laundry and Wardrobe tabs, then "Tout est rangé", tomorrow's weather and the **weather mascot (frog)**; the card shows the summary then flips to the **"washes avoided" counter** (pieces aired instead of washed during evening sorts this calendar month), animated increment; "+N" badges on the tabs. Reduced motion: final state directly.
- No notification by default (opt-in in Settings).
- If the sort is skipped: items stay `stored` with incremented counters; errors are corrected later from the Wardrobe long press.
- Details, copy and accessibility: `design/specs/04-tri-du-soir.md`.

### §8.6 History
Every location change, ironing-flag change and validation is written to an append-only log with timestamp. **Usage signal = validation.** Used for Tier 2 ranking and the washes-avoided counter; collected silently from day 1.

**End-to-end verification (§8):** walk one t-shirt (limit 2), one pair of jeans (limit 10) and one shirt (needsIroning) through two days of validation, evening sort, laundry, drying, drying rack, put away and ironing, with "L'étendoir sert de rangement" on then off. Check each location, flag, badge, availability and counter at every step, and that history rows exist.

---

## §9 Screens and interactions

Screen-level rules, exact copy, accessible names and validated mockups live in `design/specs/` (one file per journey). This section keeps the product-level rules.

### §9.1 Gesture grammar (applies to every screen)
| Gesture | Meaning |
|---|---|
| Swipe | Choose another garment / browse — nothing else. **Every carousel loops**; a single compatible piece bounces back |
| Tap | See it large / open it (Today: layer sheet; Wardrobe: garment sheet). **Exception: in Laundry, tap selects** |
| Long press | Act on the garment: radial menu around the finger (press-drag-release). Evening sort: Favori, Aérer, Au sale, Ranger. Wardrobe: Favori, Aérer, Au sale, Ranger, À sécher, Sur l'étendoir, À repasser |
- Recommended option highlighted (mustard ring) — a hint, never a decision.
- Every gesture has an equivalent **accessibility action** (VoiceOver/TalkBack), e.g. "Pièce suivante" / "Pièce précédente" on each row.

### §9.2 Navigation
- Custom **floating tab bar**: Linge (left) · **Aujourd'hui (centre, larger)** · Dressing (right).
- Today icon must evoke "today's outfit" (hanger/silhouette), never "+".
- App always opens on Today.
- Settings: icon in Today's header.
- Scrollable content keeps bottom padding so nothing hides under the bar.

### §9.3 Today — `design/specs/01`, `02`, `03`
- Header: short date, program label (activity + commute icon), settings button, large temperature, day's max, two weather lines (§6.4). Weather-driven background (light: linen + halos; dark: dusk, lamp glow, grain).
- **One column** when there is no layer: top, bottom (or one-piece), shoes, each row directly swipeable; "Ajouter une couche" left of the top.
- **Two columns** as soon as there is a layer: layers on the left (layer 1 aligned with the top), top/bottom/shoes on the right, swipeable in its lane (gradient-masked edges). Tap a layer → **layer sheet**: carousel of compatible layers, dots, "Retirer cette couche"; last layer removed → one column.
- Tapping a piece never opens its garment sheet (sheets open only from the Wardrobe).
- Location badge against the shoulder of pieces not in the wardrobe (balcony, drying rack).
- Round "Je porte cette tenue" button on the right, above the tab bar. Enabled as soon as there is a top + bottom or a one-piece (shoes and layers optional).
- **Guided state** (`03`): for a category never added, a dotted silhouette with "+" opens burst add with the type preselected; sentence "Encore 1 haut, 1 bas et 1 paire de chaussures"… If the category exists but everything is in the laundry: "Vos bas sont au linge" + "Trier le linge".
- After the evening sort time → evening sort (§8.5).
- Reduced motion: no background animation; piece changes by cross-fade.

### §9.4 Laundry — `design/specs/06`
- Shelves: Au sale ("Lessive faite"), À sécher ("Déjà sec ?", subtitle "Sec demain vers 9 h"), Sur l'étendoir ("Linge rangé"), À repasser ("Repassé").
- Tap selects (check mark); "Tout" pill selects the whole section; actions are outlined at rest, filled with the count when there is a selection ("Lessive faite · 2"). Selection is per section and cleared after the action.
- Ironing carousel: not designed yet (§14.1).

### §9.5 Wardrobe — `design/specs/05`, `08`
- Header: "Dressing", "+" (burst add), category pills (Hauts, Couches, Bas, Robes, Chaussures), filters (Disponibles, Favoris, Sport), grid toggle. Header keeps room for a future wardrobe selector.
- **Shelf carousel** (default): centre piece 270 pt on a common floor line, neighbours 150 pt faded, **no 3D rotation**, loops. Under the piece: "Pièce forte" badge, wear count, active statuses, position ("12 / 38"); no name. Reduced motion: flat.
- Optional grid view: two glass tiles per row, statuses as mini-badges.
- Tap → **garment sheet**: auto-saved, type ("Changer de type"), wear count and availability, cutout / original photo, toggles, usages by group, "Supprimer la pièce" (centred confirmation popup, plum, never red). Laundry statuses are not changed from the sheet.
- Long press → status menu (§9.1).
- Empty states: empty category, filter without result (where the pieces are, "Voir tous les hauts", "Trier le linge").
- The carousel is **one shared component**, reused in the Today layer sheet.

### §9.6 Add flow (burst mode) — `design/specs/07`
Full-screen camera, always dark ("Posez la pièce à plat, bien éclairée", stack of taken photos, "Terminer") → type sheet ("Détourage…", "Quel type de pièce ?", recent types then all types) with toggles and optional usages ("Plus de détails · facultatif") → "Enregistrer · photo suivante" → camera. Camera access denied: "Ouvrir les réglages" / "Choisir dans la galerie". Cutout runs in the background (§10).

### §9.7 First launch and onboarding — `design/specs/09`
- AL1: two doors, **"Créer mon dressing"** / **"Découvrir avec un dressing de démo"** (Tier 2).
- Create: city → week day by day → commute → ready ("Commencer l'ajout en rafale", "Essayer avec le dressing de démo", "Plus tard"). Back / step dots / "Passer".
- Today then shows the guided state (§9.3); the engine starts as soon as a minimal outfit is possible.
- **Just-in-time option:** airing at the first evening sort.
- **Demo data (Tier 2):**
  - Demo garments are marked as such in the user's wardrobe (no separate wardrobe). Demo and user garments do not coexist by default.
  - Demo data can be installed **only when the wardrobe is empty**.
  - As soon as the user starts taking her own photos, the app **offers to delete the demo garments**. If she declines, they stay and can be deleted later from Settings ("Supprimer les pièces de démo", confirmation popup), without touching her own garments.
  - The "Essayer avec le dressing de démo" button in Settings **disappears as soon as the database contains user garments**.

### §9.8 Settings — `design/specs/10`
- Ma semaine: Semaine type, Trajet du bureau, Je sors le midi, Ville.
- Horaires: Tenue prête à (07:00), Départ pour le bureau (08:30), Retour du bureau (18:30), Tri du soir à partir de (20:00).
- Linge: L'étendoir sert de rangement, Temps de séchage (24 h), Aération, Ports avant lavage (per type, §8.2).
- Notifications (opt-in): Tenue du matin, Rappel du tri du soir, Linge sec.
- Dressing de démo (§9.7).
- À propos: Frog-à-porter et moi, Offrez-moi un thé (Tier 2, §13.6), Écrire à la développeuse, Politique de confidentialité, Données météo (Open-Meteo attribution), Version.
- Language (Tier 2).

**End-to-end verification (§9):** on iPhone 12 mini and Galaxy A06: open on a cold rainy office day → two columns with two layers; change the coat via its sheet; swipe the top; validate; at 20:00 sort via long press; check with VoiceOver that every gesture has an action; enable reduce-motion and redo the flow.

---

## §10 Cutout pipeline

### §10.1 Native module
- Home-made **Expo module** (Expo Modules API): Swift + Vision on iOS, Kotlin + ML Kit Subject Segmentation on Android (ML Kit API currently **beta**). `react-native-subject-lift` is a reading reference only, not a dependency.
- Single function: image in → cutout image (PNG with alpha) out.
- Requires a development build (no Expo Go).
- **iOS 17 minimum** (floor of Vision's foreground instance mask).
- **Android**: the model is delivered by Google Play services, not shipped in the APK. It is requested at install time through the manifest, then checked before each cutout and downloaded on demand if missing (`ERR_MODEL_UNAVAILABLE` on failure). Input scaled down to 2048 px on the longest side.

### §10.2 Asynchronous processing
Photo saved immediately; cutout computed afterwards; card shows a loading state. Burst-mode timing (R2) must not include processing time.

### §10.3 User fallback
Toggle "Détourée / Photo d'origine" on the garment sheet. Cards are designed to work with both. If the cutout fails, the original photo is used and the sheet offers "Réessayer".

### §10.4 Fallback chain (R7)
1. On-device native APIs (target).
2. Embedded open-source segmentation model (ONNX or equivalent).
3. **Replicate** via a serverless proxy holding the key (try another Replicate model before giving up). Photoroom rejected. Would require privacy policy and store privacy labels update.
4. UX/UI case study.

**S2 decision (2026-11-08):** step 1 is kept on both platforms, no fallback is started (13/15 usable on iPhone 12 mini, 15/15 on Galaxy A06; results in `docs/cutout-protocol.md`).

**End-to-end verification (§10):** run the fixed 15-photo protocol on both devices after any module change; record quality notes and processing time per photo in `docs/cutout-protocol.md`.

---

## §11 Architecture and tech stack

### §11.1 Local-first, no backend
- No account, no server, no data collection. Store privacy labels: "no data collected".
- Only possible server element: the Replicate proxy, built **only if** that fallback is triggered.

### §11.2 Stack
- Expo, **latest stable SDK at init**: SDK 58 / React Native 0.88 (initialised 2026-10-31), development build via EAS.
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
- `wardrobe` entity from day 1 (secondary wardrobes, per-wardrobe city).
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
- EAS free plan (15 Android + 15 iOS builds/month, low-priority queue) is the default for Android builds; local builds on the Mac mini as fallback, in particular if iterating on native Kotlin (S2) burns through the quota.
- Open-Meteo free; Replicate ≈ 0 € if triggered.

### §13.2 Stages
Tier 1: development build on Candice's devices → Tier 2: TestFlight + Play closed test (≥ 12 testers, 14 consecutive days, started in parallel with polish) → production.

### §13.3 Identifiers
Bundle ID / package name are **immutable after publication** and independent from the commercial name: `com.candyfairstudio.wardrobe` (iOS and Android).

Development builds use a separate `.dev` variant (`com.candyfairstudio.wardrobe.dev`), selected in `app.config.ts` from an environment variable. Both can be installed side by side, so development never touches the local data of the daily-use build.

### §13.4 Privacy policy
Hosted as a page on candyfairstudio.com. Required by both stores even with no data collected.

### §13.5 Naming
- **Name: Frog-à-porter.** Display name can change at any update; the bundle ID does not depend on it (§13.3).
- **App Store subtitle:** FR "Ta tenue, sans y penser" / EN "Today’s outfit, weather-ready".
- **Store keywords:** "frog a porter" (no accent), dressing, garde-robe, lessive.
- **Checks done:** absent from INPI, TMview and both stores.
- **Rejected:** Rainette (existing trademark), Frog'n'Go (existing FrogGo app), Hopwear (filed in the USA in March 2026).

### §13.6 Tip jar
"Offrez-moi un thé": consumable in-app purchases (2 €, 5 €, 10 €), store billing only (no external payment link), **no feature unlocked**. Tier 2; requires store product setup and a privacy-label check.

---

## §14 Open items and decision log

### §14.1 Open items — do not assume, ask before implementing
| Item | Resolved when |
|---|---|
| Felt-temperature thresholds for Hot / Mild / Cool / Cold | S4 |
| Rule deciding which layer slots appear from the weather conditions | S4 |
| Rotation weights: recency cap, favourite bonus, fit bonus (§7 step 4) | S4 (10 reference scenarios + rotation scenario) |
| Rain probability threshold and ± window margin | S4 |
| Bike correction on the weather category | S4 |
| Android system backup coverage for photos | S3 |
| Glass blur vs semi-opaque on Android (design: blur, semi-opaque fallback on low-end Android) | S6 |
| Animation durations and curves (swipe, fade, bounce, end of sort) | S6 prototype |
| Ironing carousel (not designed) | Before S8 |
| Demo wardrobe content | S10 |
| Final weather mascot illustrations, onboarding illustration | Before S12 |
| "Frog-à-porter et moi" text, photo, contact e-mail | Before S12 |
| Open-Meteo non-commercial confirmation | Before S12 |

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
| 2026-10-31 | Subtype prefills hidden attributes (warmth, formality, waterproof, bikeFriendly, technical, material); engine scores them | User-given usages in four groups (weather, activity, commute, occasion); no usage = all cases; the app filters, never infers or recommends | Design handoff: the user stays in control, simpler mental model |
| 2026-10-31 | Six customisable activity presets with rules (formality range, fresh pieces, imposed layer); user-created sport labels; 4 commute modes | Fixed activities office / remote / relax / sport, separate occasion axis, 6 commute modes | Design handoff; rules now carried by usages |
| 2026-10-31 | Single location incl. `toIron`; auto put-away option; "Laundry done" list pre-checked | Location + independent "to iron" flag; drying → drying rack automatically; "L'étendoir sert de rangement" setting; per-section selection with "Tout" | Design handoff: ironing is independent from being put away |
| 2026-10-31 | `maxWears` per garment from subtype + material | Wear limit per type in Settings | Design handoff: one setting instead of per-garment tuning |
| 2026-10-31 | Lunch outing = reminder only, 12:00–14:00 per day | Global "Je sors le midi": 11:00–15:00 constrains the outfit; office departure/return times kept | Candice's arbitration mixing SPEC and design |
| 2026-10-31 | Today states A/B/C (open: 2 vs 3) | One column / two columns, right column swipeable in its lane, layer sheet | Design handoff |
| 2026-10-31 | Row order "favourites first, then fit" (design) / favourite score bonus + Tier 2 recency penalty (SPEC) | Deterministic rotation in Tier 1: time since last worn, favourite and fit bonuses | Filtering alone would propose the same outfit every day with the same context; Candice's decision |
| 2026-10-31 | One-piece via a template button, not a swipe | One-pieces interleaved in the top carousel, bottom row fades | Design handoff |
| 2026-10-31 | Evening sort = card on Today | Today becomes the sort; end animation, washes-avoided counter, frog mascot; safety net = outfit displayed at last app close | Design handoff + Candice's arbitration |
| 2026-10-31 | Onboarding week template in one tap; separate "Demo" wardrobe deleted when leaving | Week day by day + commute step; demo garments marked, installable only on an empty wardrobe, deletion offered when the user starts adding | Design handoff + Candice's arbitration |
| 2026-10-31 | Piece shadow open (none / contact / drop) | Contact shadow | Design handoff |
| 2026-10-31 | Relative-wear threshold for "fresh pieces required" (open) | Dropped with activity rules | No longer applicable |
| 2026-11-02 | Final name decided in a dedicated session in Tier 2 (S11) | **Frog-à-porter**, decided before S11 | Name found early; availability checks done (§13.5) |
| 2026-11-02 | Proposed bundle ID `com.candygetshandy.wardrobe`, privacy page on candygetshandy.com (Ghost) | `com.candyfairstudio.wardrobe`, privacy page on candyfairstudio.com | App attached to candyfairstudio.com, the studio showcase shared with Christian |
| 2026-11-03 | Relax / sport active day defaults to 09:00–19:00 | 09:00–20:00 | Candice's decision |
| 2026-11-08 | Minimum iOS version (open) | iOS 17 | Floor of the Vision cutout API; no "cutout unavailable" state to design |
| 2026-11-08 | Android ML Kit model delivery / size (open) | Requested at install through the manifest, checked and downloaded on demand before a cutout; size not measured | The model is only available through Google Play services |
| 2026-11-08 | Fallback chain (§10.4) decided after S2 | Native APIs on both platforms, no fallback started | Protocol: 13/15 usable on iOS, 15/15 on Android; iOS failures covered by shooting guidance and §10.3 |
| 2026-11-11 | Starting wear limits from the official ADEME page (open) | ADEME guidance as relayed by the press (lower bound of each range), Candice's values for the other types; 23 types incl. "Haut en laine" (7) and "Haut en coton" (4, added the same day); shoes have no limit; Settings copy « Valeurs de départ inspirées des repères de l'ADEME » | The ADEME site no longer gives per-garment figures; the press infographic covers only some types |

---

## §15 Session roadmap

Each session ships something testable and ends with its verification step. Risk tests come first (§3).

### Before S1 (Candice)
Create the personal Apple Developer account (identity verification can take days). Until it is active, sign locally with Xcode and a free Apple ID.

### Tier 1
| Session | Ships | Verification | Risk |
|---|---|---|---|
| S1 | Repo (public), Expo + TS strict, ESLint/Prettier/Jest, **Husky hooks + Claude Code SessionStart hook + gitleaks + lifecycle grep check + i18n lint rule**, bundle ID + `.dev` variant, `docs/cutout-protocol.md`, **iOS cutout module (minimal)** | A non-conventional commit and a commit on `main` are rejected; cutout of 15 photos on iPhone 12 mini | R7 (iOS) |
| S2 | Android cutout module, protocol on both devices, fallback-chain decision, min iOS version | Protocol results recorded | R7 (decision) |
| S3 | Drizzle schema + migrations, lifecycle state machine + tests, burst add flow with async cutout, subtype catalogue with ADEME values | **10 real garments added, timed (< 30 s each)**; state-machine tests green | R2 |
| S4 | Engine v0, Open-Meteo windows, reminders, 10 reference scenarios as fixtures | Scenarios rated on the real wardrobe; recorded forecasts tests | R3, R4 |
| S5 | ~~Claude Design exploration~~ **Done**: handoff in `design/` (specs, tokens, mockups) | — | — |
| S6 | Coded interaction prototype: Today one/two columns with lane swipe, layer sheet, shared looping carousel, radial menu, tab bar; perf on Galaxy A06 (blur fallback) | Swipes stay in their lane; smooth on A06; animation durations set | R9 |
| S7 | Today complete (incl. guided state), validation + freeze, evening sort with end animation, probable-outfit safety net | §9 verification | — |
| S8 | Laundry tab (full cycle), Wardrobe tab (carousel, grid, sheet) | §8 and §9 verifications | — |
| S9 | Onboarding, weekly program, settings, just-in-time prompts | First-launch flow on both devices | — |
| **Checkpoint** | **1–2 weeks of real use** (time from open to decision), then **re-examine the Tier 1 / Tier 2 cut** | Timing log | R1, R6 |

### Tier 2
| Session | Ships | Verification | Risk |
|---|---|---|---|
| S10 | Outfit variants, demo data (Candice's photos, rules §9.7); start recruiting the 12 testers; create Play Console account if not done | Recruiter flow < 10 s to value | R5 |
| S11 | App icon, English localisation, export/import (priority per Android backup finding) | Round-trip export/import on another device | — |
| S12 | Privacy page on candyfairstudio.com, Open-Meteo confirmation, store listings, tip jar IAP, Maestro flows; **start TestFlight + Play closed test (14 days)** | Maestro green; builds accepted in test tracks | R5, R8 |
| S13 | Fixes from tester feedback, production release | Live on both stores | — |
