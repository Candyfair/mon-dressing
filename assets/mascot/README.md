# Weather mascot — frog

Hand-drawn by Candice. Seven states, all on the same square frame (450 × 450 px source, feet on a shared baseline), so they can be swapped without layout shift.

| File | State | Used on |
|---|---|---|
| `frog-welcome` | Welcome (blue jacket) | First launch (AL1/AM1) and "ready" step of the onboarding (AL5/AM5) |
| `frog-heatwave` | Heatwave (sunglasses, swim ring) | End of evening sort, tomorrow = heatwave |
| `frog-sunny` | Sunny (sunglasses) | End of evening sort, tomorrow = sunny |
| `frog-cloudy` | Cloudy (jumper, clouds) | End of evening sort, tomorrow = cloudy |
| `frog-rain` | Rain (umbrella, boots) | End of evening sort, tomorrow = rain |
| `frog-cold` | Cold (beanie, scarf) | End of evening sort, tomorrow = cold |
| `frog-snow` | Snow (goggles, skis) | End of evening sort, tomorrow = snow |

## Sizes

- Display size: 116 × 116 pt (`mascot` token in `design/design-system/tokens.json`).
- Each state ships as `@1x` (116 px), `@2x` (232 px) and `@3x` (348 px). Metro picks the right density from a plain `require('…/frog-rain.png')`.
- Same images in light and dark themes (no dark variant, by design decision).

## Usage

```tsx
import { Image } from 'expo-image';

<Image
  source={require('../../assets/mascot/frog-rain.png')}
  style={{ width: 116, height: 116 }}
  contentFit="contain"
  accessibilityLabel={t('mascot.rain')} // e.g. "Personnage météo : grenouille en tenue de pluie"
/>
```

- The mascot is decorative next to the weather sentence, but keeps an accessible label (see AA2 in `design/specs/04-tri-du-soir.md`).
- Reduced motion: no animation on the mascot itself.
