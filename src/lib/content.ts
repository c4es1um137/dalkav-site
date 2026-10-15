// Content queries shared by every view. Drafts are filtered here, in one place:
// visible with a pill on test/development, excluded everywhere on production.

import { getCollection, type CollectionEntry } from 'astro:content';
import { env } from '../env';
import { localizePath, otherLang, t, type Lang } from '../i18n';
import { readingTime } from './reading-time';

export type NoteEntry = CollectionEntry<'notes'>;
export type ProjectEntry = CollectionEntry<'projects'>;

export interface Note {
  entry: NoteEntry;
  lang: Lang;
  slug: string;
  url: string;
  minutes: number;
  data: NoteEntry['data'];
}

export interface Project {
  entry: ProjectEntry;
  lang: Lang;
  slug: string;
  url: string;
  data: ProjectEntry['data'];
}

function splitId(id: string): { lang: Lang; slug: string } {
  const [lang, slug] = id.split('/') as [Lang, string];
  return { lang, slug };
}

const isVisible = (data: { draft: boolean }) => env.showDrafts || !data.draft;

let notesCache: Promise<Note[]> | undefined;
let projectsCache: Promise<Project[]> | undefined;

/** All visible projects, both languages, by `order`. */
export function allProjects(): Promise<Project[]> {
  projectsCache ??= getCollection('projects', ({ data }) => isVisible(data)).then((entries) =>
    entries
      .map((entry) => {
        const { lang, slug } = splitId(entry.id);
        return { entry, lang, slug, url: localizePath(`/projects/${slug}`, lang), data: entry.data };
      })
      .sort((a, b) => a.data.order - b.data.order || a.slug.localeCompare(b.slug)),
  );
  return projectsCache;
}

/** All visible notes, both languages, newest first. Unknown project references fail the build. */
export function allNotes(): Promise<Note[]> {
  notesCache ??= (async () => {
    const [entries, projectEntries] = await Promise.all([getCollection('notes', ({ data }) => isVisible(data)), getCollection('projects')]);
    const projectSlugs = new Set(projectEntries.map((p) => splitId(p.id).slug));
    for (const entry of entries) {
      for (const ref of entry.data.projects) {
        if (!projectSlugs.has(ref)) {
          throw new Error(`src/content/notes/${entry.id}.md: "projects" lists "${ref}", which is not an existing project slug.`);
        }
      }
    }
    return entries
      .map((entry) => {
        const { lang, slug } = splitId(entry.id);
        return {
          entry,
          lang,
          slug,
          url: localizePath(`/notes/${slug}`, lang),
          minutes: readingTime(entry.body),
          data: entry.data,
        };
      })
      .sort((a, b) => b.data.date.getTime() - a.data.date.getTime() || a.slug.localeCompare(b.slug));
  })();
  return notesCache;
}

export async function notesIn(lang: Lang): Promise<Note[]> {
  return (await allNotes()).filter((n) => n.lang === lang);
}

export async function projectsIn(lang: Lang): Promise<Project[]> {
  return (await allProjects()).filter((p) => p.lang === lang);
}

/** Entries that exist only in the other language (for the "Only in Turkish" list). */
export function onlyInOther<T extends { lang: Lang; slug: string }>(items: T[], lang: Lang): T[] {
  const here = new Set(items.filter((i) => i.lang === lang).map((i) => i.slug));
  return items.filter((i) => i.lang === otherLang(lang) && !here.has(i.slug));
}

export function hasCounterpart<T extends { lang: Lang; slug: string }>(items: T[], slug: string, lang: Lang): boolean {
  return items.some((i) => i.slug === slug && i.lang === otherLang(lang));
}

/**
 * Pick one entry per slug for `lang`: the current-language version when it exists,
 * otherwise the other-language one (shown with a language badge).
 */
export function preferLang<T extends { lang: Lang; slug: string }>(items: T[], lang: Lang): T[] {
  const bySlug = new Map<string, T>();
  for (const item of items) {
    const current = bySlug.get(item.slug);
    if (!current || (current.lang !== lang && item.lang === lang)) bySlug.set(item.slug, item);
  }
  return [...bySlug.values()];
}

/** Notes that list the project, current language first, then other-language-only notes. */
export async function relatedNotes(projectSlug: string, lang: Lang): Promise<Note[]> {
  const related = (await allNotes()).filter((n) => n.data.projects.includes(projectSlug));
  const picked = preferLang(related, lang);
  return [...picked.filter((n) => n.lang === lang), ...picked.filter((n) => n.lang !== lang)];
}

/** Projects a note references, preferring the current-language version. */
export async function relatedProjects(note: Note, lang: Lang): Promise<Project[]> {
  const projects = await allProjects();
  return note.data.projects
    .map((slug) => preferLang(projects.filter((p) => p.slug === slug), lang)[0])
    .filter((p): p is Project => Boolean(p));
}

/** Previous/next within one language list (list order). */
export function neighbours<T>(list: T[], index: number): { prev?: T; next?: T } {
  return { prev: index > 0 ? list[index - 1] : undefined, next: index < list.length - 1 ? list[index + 1] : undefined };
}

/** Tag → count for one language, sorted by count then name. */
export async function tagCounts(lang: Lang): Promise<Array<{ tag: string; count: number }>> {
  const counts = new Map<string, number>();
  for (const note of await notesIn(lang)) {
    for (const tag of note.data.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function formatPeriod(period: NonNullable<Project['data']['period']>, lang: Lang): string {
  const end = period.end === 'present' ? t(lang, 'projects.present') : String(period.end);
  if (period.start === period.end) return String(period.start);
  // Spaced dash only when the start is still a [TODO] placeholder.
  return typeof period.start === 'number' ? `${period.start}–${end}` : `${period.start} – ${end}`;
}
