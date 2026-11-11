// i18next setup (CLAUDE.md §3.10). French only in Tier 1; English and the
// device language (expo-localization) come in S11 (SPEC §15).
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './locales/fr.json';

export const resources = { fr: { translation: fr } } as const;

// Resources are bundled, so init is synchronous: strings are ready on first render.
const i18n = createInstance();
i18n.use(initReactI18next).init({
  resources,
  lng: 'fr',
  fallbackLng: 'fr',
  initAsync: false,
  interpolation: { escapeValue: false }, // React already escapes
});

export default i18n;
