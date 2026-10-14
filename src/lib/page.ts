// Canonical, hreflang and language-switcher targets for every page type (§2.1).

import { alternateFor, localizePath, otherLang, type Lang, type Section } from '../i18n';

export type NavKey = 'home' | 'projects' | 'notes' | 'lab' | 'cv' | 'contact';

export interface Switcher {
  href: string;
  /** False when the entry has no translation and the link goes to the section index. */
  exists: boolean;
  section?: Section;
}

export interface PageLinks {
  /** Served path of this page (self-canonical). */
  path: string;
  /** hreflang alternates: only languages where the page exists. */
  alternates: Partial<Record<Lang, string>>;
  /** x-default: the English page, or the English section index. */
  xDefault: string;
  switcher: Switcher;
}

/** A page that exists in both languages at the same neutral path ("/notes", "/cv", "/"). */
export function staticPage(neutralPath: string, lang: Lang): PageLinks {
  const en = localizePath(neutralPath, 'en');
  const tr = localizePath(neutralPath, 'tr');
  return {
    path: lang === 'en' ? en : tr,
    alternates: { en, tr },
    xDefault: en,
    switcher: { href: lang === 'en' ? tr : en, exists: true },
  };
}

/** An entry page that may exist in one language only. */
export function entryPage(section: Section, slug: string, lang: Lang, hasCounterpart: boolean): PageLinks {
  const self = localizePath(`/${section}/${slug}`, lang);
  const other = otherLang(lang);
  const alternate = alternateFor(section, slug, other, hasCounterpart);
  const alternates: Partial<Record<Lang, string>> = { [lang]: self };
  if (alternate.exists) alternates[other] = alternate.href;
  const enPage = lang === 'en' ? self : alternate.exists ? alternate.href : undefined;
  return {
    path: self,
    alternates,
    xDefault: enPage ?? localizePath(`/${section}`, 'en'),
    switcher: { href: alternate.href, exists: alternate.exists, section },
  };
}
