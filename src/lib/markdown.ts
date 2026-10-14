// Local Sätteri hast plugin for notes and project bodies (no third-party plugins).
// - Wraps every <table> in a focusable, labelled scroll region (§3.3, WCAG 2.1.1).
// - Labels highlighted code blocks as focusable scroll regions ("Code: sh").
// The document language comes from the file path (content/<collection>/<lang>/…).

import type { SatteriProcessorOptions } from '@astrojs/markdown-satteri';

type HastPluginList = NonNullable<SatteriProcessorOptions['hastPlugins']>;

type Lang = 'en' | 'tr';

function langOf(fileURL: URL | undefined): Lang {
  return fileURL && /\/tr\/[^/]+\.md$/.test(fileURL.pathname) ? 'tr' : 'en';
}

const LABELS = {
  en: { table: 'Table', code: 'Code' },
  tr: { table: 'Tablo', code: 'Kod' },
} as const;

export const markdownHastPlugins: HastPluginList = [
  {
    name: 'dalkav:regions',
    element: {
      filter: ['table', 'pre'],
      visit(node, ctx) {
        if (node.type !== 'element') return;
        const labels = LABELS[langOf(ctx.fileURL)];
        if (node.tagName === 'table') {
          ctx.wrapNode(node, {
            type: 'element',
            tagName: 'div',
            properties: {
              className: ['table-scroll'],
              role: 'region',
              tabIndex: 0,
              ariaLabel: labels.table,
            },
            children: [],
          });
          return;
        }
        const language = node.properties?.dataLanguage;
        const label = typeof language === 'string' && language !== 'plaintext' ? `${labels.code}: ${language}` : labels.code;
        ctx.setProperty(node, 'role', 'region');
        ctx.setProperty(node, 'ariaLabel', label);
        // Shiki already marks the block focusable; only add it when missing.
        const props = node.properties ?? {};
        if (!('tabindex' in props) && !('tabIndex' in props)) ctx.setProperty(node, 'tabIndex', 0);
      },
    },
  },
];
