# Cutout test protocol

Fixed protocol for risk R7 (`SPEC.md` §3, §10). Run it on both reference devices after any change to `modules/subject-cutout/`. The photos stay on the device: they are not versioned, because this repository is public.

## Devices
- iPhone 12 mini (S1)
- Galaxy A06 (S2)

## The 15 photos
Real garments from the wardrobe, shot the way burst mode will be used: phone in hand, ordinary home lighting, no staging. Keep the same 15 photos between runs.

| # | Case |
|---|---|
| 1 | Plain light top, flat on a dark surface |
| 2 | Plain dark top, flat on a light surface |
| 3 | Top close in colour to the background |
| 4 | Patterned top |
| 5 | Top on a hanger, against a wall |
| 6 | Trousers, flat |
| 7 | Dark trousers on a dark surface |
| 8 | Skirt with folds |
| 9 | Dress on a hanger |
| 10 | Thin or see-through fabric |
| 11 | Knit with an irregular outline |
| 12 | Coat or jacket, sleeves spread out |
| 13 | Pair of shoes, side by side |
| 14 | Busy background (bed, chair, clutter) |
| 15 | Low-light shot |

## Method
1. Build with `npx expo run:ios --device`. A debug build is enough for quality, but timings should be read with care: note the build type.
2. Close other apps, then open the app (cutout harness screen).
3. Pick the 15 photos in order. They are processed one at a time.
4. Check each cutout on the white, black and magenta backdrops: magenta reveals fringes and holes.
5. Export the CSV and copy the timings below.

## Rating
- **Good**: usable as is.
- **Acceptable**: visible defect, but the garment reads well on a card.
- **Unusable**: part of the garment is missing, or part of the background remains.

The fallback decision (`SPEC.md` §10.4) is taken in S2, once both devices have been tested.

## Results

### iPhone 12 mini
Date: 2026-11-06 · iOS: 27.0.1 · Build: Debug (`npx expo run:ios --device`)

| # | Rating | Duration (ms) | Size | Notes |
|---|---|---|---|---|
| 1 | Good | 747 | 2954 × 3419 |  |
| 2 | Good | 416 | 2878 × 3277 |  |
| 3 | Good | 347 | 2877 × 2804 |  |
| 4 | Good | 419 | 2558 × 2962 |  |
| 5 | Acceptable | 336 | 2860 × 3009 | Wooden hanger kept; its metal hook was removed |
| 6 | Unusable | 576 | 2942 × 4032 | Light blue jeans on a white surface: only a small part of the background removed, on the right |
| 7 | Unusable | 484 | 2830 × 3985 | Background kept as if it were part of the garment |
| 8 | Good | 381 | 2924 × 1961 |  |
| 9 | Acceptable | 351 | 2009 × 4009 | Same as 5: wooden part of the hanger kept |
| 10 | Good | 245 | 2954 × 1490 |  |
| 11 | Good | 396 | 2896 × 2875 |  |
| 12 | Good | 294 | 3734 × 2062 |  |
| 13 | Good | 351 | 2274 × 3300 |  |
| 14 | Unusable | 498 | 2682 × 3969 | Part of the background merged into the garment |
| 15 | Good | 307 | 1977 × 2316 |  |

**Summary:** 10 good, 2 acceptable, 3 unusable. Both acceptable cases keep a wooden hanger. The unusable ones are low contrast (6, 7) and a busy background (14).

**Timings:** median 381 ms, mean 410 ms, range 245–747 ms. The slowest is the first photo, which probably includes loading the model; the others stay under 600 ms. Debug build, so a release build should be at least as fast.

**Output size:** the PNGs keep the source resolution, up to 3734 × 2062 and 2942 × 4032 px. To keep in mind for storage and card thumbnails in S3.

Rows follow the selection order (the order of the cases above), not the file names.

### Galaxy A06
Not run yet (S2).
