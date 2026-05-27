// ============================================================
// i18n — Lightweight internationalization (no dependencies)
// ============================================================

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

import en from './locales/en.json';
import tr from './locales/tr.json';

export type Locale = 'en' | 'tr';

type TranslationKeys = keyof typeof en;

const LOCALES: Record<Locale, Record<string, string>> = {
  en,
  tr,
};

const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  tr: 'Türkçe',
};

const LOCALE_STORAGE_KEY = 'linuxos_locale';

function loadLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale;
    if (saved && saved in LOCALES) return saved;
  } catch { /* ignore */ }
  // Try browser language
  const browserLang = navigator.language.split('-')[0] as Locale;
  if (browserLang in LOCALES) return browserLang;
  return 'en';
}

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKeys | string, params?: Record<string, string | number>) => string;
  availableLocales: typeof LOCALE_NAMES;
}

const I18nContext = createContext<I18nContextType | null>(null);

/**
 * Provides i18n context to the app.
 * Supports parameterized translations: t('greeting', { name: 'John' }) → "Hello, John!"
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(loadLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let text = LOCALES[locale]?.[key] || LOCALES['en']?.[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(`{{${k}}}`, String(v));
        });
      }
      return text;
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, availableLocales: LOCALE_NAMES }),
    [locale, setLocale, t]
  );

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook to access translations and locale settings.
 * @example
 * const { t, locale, setLocale } = useTranslation();
 * t('settings.language') → "Language"
 */
export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}
