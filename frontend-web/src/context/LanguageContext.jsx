import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { resolveLanguage, translate } from '../i18n';

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => resolveLanguage(localStorage.getItem('app_language') || 'en'));

  useEffect(() => {
    localStorage.setItem('app_language', language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage: (nextLanguage) => setLanguageState(resolveLanguage(nextLanguage)),
    t: (key, replacements) => translate(language, key, replacements),
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
