// Per-language RSS feeds (drafts already excluded on production by allNotes()).

import rss from '@astrojs/rss';
import { env } from '../env';
import { t, type Lang } from '../i18n';
import { notesIn } from './content';

export async function notesFeed(lang: Lang): Promise<Response> {
  const notes = await notesIn(lang);
  const feedPath = lang === 'en' ? '/rss.xml' : '/tr/rss.xml';
  const self = new URL(feedPath, env.site).href;
  return rss({
    title: `${t(lang, 'site.name')} · ${t(lang, 'notes.title')}`,
    description: t(lang, 'notes.intro'),
    site: env.site,
    trailingSlash: false,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: `<language>${lang === 'en' ? 'en-gb' : 'tr-tr'}</language><atom:link href="${self}" rel="self" type="application/rss+xml"/>`,
    items: notes.map((note) => ({
      title: note.data.title,
      description: note.data.description,
      link: new URL(note.url, env.site).href,
      pubDate: note.data.date,
      categories: note.data.tags,
    })),
  });
}
