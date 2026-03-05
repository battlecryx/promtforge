import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import translations from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [lang, setLangState] = useState(() => {
        try {
            return localStorage.getItem('pm_lang') || 'es';
        } catch {
            return 'es';
        }
    });

    const setLang = useCallback((newLang) => {
        setLangState(newLang);
        try { localStorage.setItem('pm_lang', newLang); } catch { }
    }, []);

    const t = useCallback((path) => {
        const keys = path.split('.');
        let val = translations[lang];
        for (const k of keys) {
            if (val && typeof val === 'object' && k in val) {
                val = val[k];
            } else {
                return path; // fallback: return key path
            }
        }
        return val;
    }, [lang]);

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
    return ctx;
}
