import { LOCALE, type Lang } from '../i18n';

const formatters = new Map<Lang, Intl.DateTimeFormat>();

/** "14 September 2026" / "14 Eylül 2026", always in UTC so the date never shifts. */
export function formatDate(date: Date, lang: Lang): string {
  let fmt = formatters.get(lang);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(LOCALE[lang].intl, { dateStyle: 'long', timeZone: 'UTC' });
    formatters.set(lang, fmt);
  }
  return fmt.format(date);
}

/** YYYY-MM-DD for <time datetime>. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
