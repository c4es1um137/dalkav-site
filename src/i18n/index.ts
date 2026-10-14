import en from './en.json';
import tr from './tr.json';

export const LANGS = ['en', 'tr'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'en';

export type UiKey = keyof typeof en;

const dictionaries: Record<Lang, Record<string, string>> = { en, tr };

// Build-time check: both dictionaries must have exactly the same keys.
(function assertKeyParity() {
  const enKeys = new Set(Object.keys(en));
  const trKeys = new Set(Object.keys(tr));
  const missingInTr = [...enKeys].filter((k) => !trKeys.has(k));
  const missingInEn = [...trKeys].filter((k) => !enKeys.has(k));
  if (missingInTr.length || missingInEn.length) {
    throw new Error(
      'i18n key mismatch between src/i18n/en.json and src/i18n/tr.json.' +
        (missingInTr.length ? ` Missing in tr.json: ${missingInTr.join(', ')}.` : '') +
        (missingInEn.length ? ` Missing in en.json: ${missingInEn.join(', ')}.` : ''),
    );
  }
})();

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'tr' : 'en';
}

/** Translate a UI key, replacing {name} placeholders with `vars`. */
export function t(lang: Lang, key: UiKey, vars: Record<string, string | number> = {}): string {
  const template = dictionaries[lang][key] ?? dictionaries[DEFAULT_LANG][key] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

/** BCP 47 tag and Open Graph locale per language. */
export const LOCALE: Record<Lang, { intl: string; og: string }> = {
  en: { intl: 'en-GB', og: 'en_US' },
  tr: { intl: 'tr-TR', og: 'tr_TR' },
};

/**
 * Prefix a language-neutral path for `lang`.
 * localizePath('/notes', 'tr') → '/tr/notes'; localizePath('/', 'tr') → '/tr'.
 * Paths never end with a slash, except the English home "/".
 */
export function localizePath(path: string, lang: Lang): string {
  const clean = ('/' + path.replace(/^\/+/, '')).replace(/\/+$/, '') || '/';
  if (lang === DEFAULT_LANG) return clean;
  return clean === '/' ? `/${lang}` : `/${lang}${clean}`;
}

/** Split a served path into its language and language-neutral path. */
export function splitPath(pathname: string): { lang: Lang; path: string } {
  const match = /^\/(tr)(\/.*)?$/.exec(pathname);
  if (match) return { lang: 'tr', path: match[2] || '/' };
  return { lang: 'en', path: pathname || '/' };
}

export type Section = 'notes' | 'projects' | 'lab';

export interface Alternate {
  href: string;
  /** True when the target is the same entry in the other language. */
  exists: boolean;
}

/**
 * Where the language switcher (and hreflang) points for an entry:
 * its counterpart when one exists, otherwise the section index in `lang`.
 */
export function alternateFor(section: Section, slug: string, lang: Lang, counterpartExists: boolean): Alternate {
  return counterpartExists
    ? { href: localizePath(`/${section}/${slug}`, lang), exists: true }
    : { href: localizePath(`/${section}`, lang), exists: false };
}

/** Uppercase/lowercase with Turkish rules where needed (never plain toUpperCase on Turkish). */
export function upper(text: string, lang: Lang): string {
  return text.toLocaleUpperCase(LOCALE[lang].intl);
}

export function lower(text: string, lang: Lang): string {
  return text.toLocaleLowerCase(LOCALE[lang].intl);
}
