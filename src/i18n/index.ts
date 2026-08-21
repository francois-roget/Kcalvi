import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './fr.json';

// i18next's named `use` export is the same singleton method as `i18next.use` -- but aliasing
// it away from that name isn't worth it here: any local alias still starting with `use` would
// collide with react-hooks' hook-naming heuristic and fail rules-of-hooks (not a real hook).
// eslint-disable-next-line import/no-named-as-default-member
i18next.use(initReactI18next).init({
  lng: 'fr',
  fallbackLng: 'fr',
  resources: {
    fr: { translation: fr },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
