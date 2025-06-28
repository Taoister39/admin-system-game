import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import EN_US from '@common/locales/en-US.json';
import ZH_CN from '@common/locales/zh-CN.json';

const resources = {
  'en-US': { translation: EN_US },
  'zh-CN': { translation: ZH_CN },
} as const;

i18next.use(initReactI18next).init({
  resources,
  fallbackLng: 'en-US',
});
