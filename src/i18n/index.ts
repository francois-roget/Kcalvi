import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './fr.json';

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
