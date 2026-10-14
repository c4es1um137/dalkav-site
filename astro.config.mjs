// @ts-check
// SITE_ENV is resolved and validated before anything else; an invalid value
// on Cloudflare Pages or CI throws here and fails the build.
import { env } from './src/env.ts';

import { defineConfig, envField, fontProviders } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import envFiles from './src/integrations/env-files.ts';
import { markdownHastPlugins } from './src/lib/markdown.ts';
import { codeTheme, codeTransformer } from './src/styles/code-theme.ts';

// https://astro.build/config
export default defineConfig({
  site: env.site,
  output: 'static',
  trailingSlash: 'never',
  build: {
    // /notes → notes.html, served by Pages at /notes with no redirect.
    format: 'file',
  },

  env: {
    schema: {
      SITE_ENV: envField.enum({
        context: 'server',
        access: 'public',
        values: ['production', 'test', 'development'],
        default: 'development',
      }),
    },
  },

  i18n: {
    locales: ['en', 'tr'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },

  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: ['100 900'],
      styles: ['normal', 'italic'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['system-ui', 'sans-serif'],
      display: 'swap',
    },
    {
      provider: fontProviders.fontsource(),
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains-mono',
      weights: ['100 800'],
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['ui-monospace', 'monospace'],
      display: 'swap',
    },
  ],

  security: {
    // Astro hashes its own scripts and styles into a <meta> CSP on every page.
    // frame-ancestors can't live in a meta tag; it's in the generated _headers.
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'",
      ],
    },
  },

  image: {
    // Only repo-authored SVGs (project diagrams, OG source) are rasterised.
    dangerouslyProcessSVG: true,
  },

  markdown: {
    processor: satteri({ hastPlugins: markdownHastPlugins }),
    syntaxHighlight: { type: 'shiki', excludeLangs: ['math'] },
    shikiConfig: {
      theme: codeTheme,
      transformers: [codeTransformer],
      wrap: false,
    },
  },

  integrations: [
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', tr: 'tr' } },
      filter: (page) => !/\/404$/.test(new URL(page).pathname),
    }),
    envFiles(env),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
