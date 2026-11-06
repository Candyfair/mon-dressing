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
Date: — · iOS: — · Build: —

| # | Rating | Duration (ms) | Size | Notes |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |
| 6 | | | | |
| 7 | | | | |
| 8 | | | | |
| 9 | | | | |
| 10 | | | | |
| 11 | | | | |
| 12 | | | | |
| 13 | | | | |
| 14 | | | | |
| 15 | | | | |

### Galaxy A06
Not run yet (S2).
