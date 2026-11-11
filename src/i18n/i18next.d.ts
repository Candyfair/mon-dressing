// Typed keys: t('subtypes.unknown') does not compile.
import 'i18next';

import type { resources } from '.';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: (typeof resources)['fr'];
  }
}
