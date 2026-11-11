import { useColorScheme } from 'react-native';

import { type ThemeName, themes } from './tokens';

export type Theme = (typeof themes)[ThemeName];

// Light "Cocon du matin" or dark "Cocon du soir", following the system setting.
export function themeNameFor(colorScheme: ReturnType<typeof useColorScheme>): ThemeName {
  return colorScheme === 'dark' ? 'soir' : 'matin';
}

export function useTheme(): Theme {
  return themes[themeNameFor(useColorScheme())];
}
