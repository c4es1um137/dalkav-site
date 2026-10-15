// JSON-LD builders: Person (home, CV) and BlogPosting (notes).

import { site } from '../config/site';
import { env } from '../env';
import { LOCALE, type Lang } from '../i18n';
import { isoDate } from './dates';
import type { Note } from './content';

const sameAs = () => [site.github, site.linkedin].filter(Boolean);

export function personJsonLd(lang: Lang, url: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.fullName,
    alternateName: site.name,
    url,
    jobTitle: lang === 'en' ? 'Electrical Engineering student' : 'Elektrik Mühendisliği öğrencisi',
    address: { '@type': 'PostalAddress', addressLocality: lang === 'en' ? 'Istanbul' : 'İstanbul', addressCountry: 'TR' },
    affiliation: { '@type': 'CollegeOrUniversity', name: 'İstanbul Teknik Üniversitesi', alternateName: 'İTÜ' },
    memberOf: { '@type': 'SportsTeam', name: 'İTÜ Racing' },
    ...(sameAs().length ? { sameAs: sameAs() } : {}),
  };
}

export function blogPostingJsonLd(note: Note, ogImage: string): Record<string, unknown> {
  const url = new URL(note.url, env.site).href;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: note.data.title,
    description: note.data.description,
    datePublished: isoDate(note.data.date),
    dateModified: isoDate(note.data.updated ?? note.data.date),
    inLanguage: LOCALE[note.lang].intl,
    keywords: note.data.tags.join(', '),
    url,
    mainEntityOfPage: url,
    image: new URL(ogImage, env.site).href,
    author: { '@type': 'Person', name: site.fullName, url: new URL(note.lang === 'en' ? '/' : '/tr', env.site).href },
  };
}
