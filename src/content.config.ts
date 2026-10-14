import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Slug = filename. ASCII kebab-case; the same filename under en/ and tr/ makes a translation pair.
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const TAG = SLUG;

/** Entry id "en/<slug>" or "tr/<slug>". Fails the build with the file path on a bad filename. */
function langSlugId({ entry }: { entry: string }): string {
  const match = /^(en|tr)\/([^/]+)\.md$/.exec(entry);
  if (!match) {
    throw new Error(`${entry}: content files must live directly in en/ or tr/ and end in .md.`);
  }
  const [, lang, slug] = match;
  if (!SLUG.test(slug)) {
    throw new Error(`${entry}: filename "${slug}" must be lowercase ASCII kebab-case (a-z, 0-9, single hyphens).`);
  }
  return `${lang}/${slug}`;
}

const tags = (min: number, max: number) =>
  z
    .array(z.string().regex(TAG, 'tags must be lowercase ASCII kebab-case, e.g. "high-voltage"'))
    .min(min)
    .max(max);

const notes = defineCollection({
  // _images/ is outside the pattern, so image folders are never parsed as entries.
  loader: glob({ pattern: '{en,tr}/*.md', base: './src/content/notes', generateId: langSlugId }),
  schema: z.object({
    title: z.string().min(1).max(90),
    description: z.string().min(50).max(160),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: tags(1, 6),
    // Must name existing project slugs; checked in src/lib/content.ts.
    projects: z.array(z.string().regex(SLUG)).default([]),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '{en,tr}/*.md', base: './src/content/projects', generateId: langSlugId }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1).max(90),
      summary: z.string().min(1).max(220),
      role: z.string().min(1),
      period: z.object({
        // A visible "[TODO: …]" is allowed while the year is unknown (never invent dates).
        start: z.union([z.number().int().min(1990).max(2100), z.string().regex(/^\[TODO[^\]]*\]$/)]),
        end: z.union([z.number().int().min(1990).max(2100), z.literal('present')]),
      }),
      status: z.enum(['completed', 'ongoing']),
      order: z.number(),
      featured: z.boolean().default(false),
      // hero = 4×2, tall = 2×2, wide = 3×1, standard = 2×1 on the 6-column desktop grid.
      bento: z.enum(['hero', 'tall', 'wide', 'standard']).default('standard'),
      cover: image(),
      coverAlt: z.string().min(1),
      tags: tags(0, 10),
      results: z.array(z.string().min(1)).default([]),
      gallery: z
        .array(z.object({ src: image(), alt: z.string().min(1), caption: z.string().optional() }))
        .default([]),
      links: z.array(z.object({ label: z.string().min(1), url: z.url() })).default([]),
      draft: z.boolean().default(false),
    }),
});

const cv = defineCollection({
  // One YAML file per language: src/content/cv/en.yaml, tr.yaml.
  loader: glob({ pattern: '*.yaml', base: './src/content/cv' }),
  schema: z.object({
    name: z.string(),
    headline: z.string(),
    location: z.string(),
    summary: z.string(),
    experience: z.array(
      z.object({
        org: z.string(),
        role: z.string(),
        period: z.string(),
        bullets: z.array(z.string()).default([]),
      }),
    ),
    education: z.array(
      z.object({
        school: z.string(),
        degree: z.string(),
        period: z.string(),
        notes: z.array(z.string()).default([]),
      }),
    ),
    skills: z.array(z.object({ category: z.string(), items: z.array(z.string()).min(1) })),
    languages: z.array(z.object({ name: z.string(), level: z.string() })),
    links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
  }),
});

export const collections = { notes, projects, cv };
