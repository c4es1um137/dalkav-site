// Syntax highlighting theme built from the code tokens in docs/DESIGN.md (§3.3).
//
// Shiki normally writes colours into inline `style` attributes, which the CSP
// and verify-dist forbid. So each token colour here is a unique key: the
// transformer below swaps every inline colour for a `tok-*` class, and
// src/styles/prose.css colours those classes from the design tokens.
// No inline style survives into the HTML.

import type { ShikiConfig } from 'astro';

type ThemeRegistration = Extract<NonNullable<ShikiConfig['theme']>, { tokenColors?: unknown }>;
type ShikiTransformer = NonNullable<ShikiConfig['transformers']>[number];

export const CODE_TOKENS = {
  fg: '#EDEDEF',
  comment: '#8A8F98',
  keyword: '#9EA5F0',
  string: '#9FD4B0',
  number: '#E6B98A',
  function: '#C9CDF7',
  type: '#8CC8E8',
  punctuation: '#A1A5AD',
} as const;

type TokenName = keyof typeof CODE_TOKENS;

const CLASS_BY_COLOR = new Map<string, TokenName>(
  (Object.entries(CODE_TOKENS) as [TokenName, string][]).map(([name, color]) => [color.toLowerCase(), name]),
);

export const codeTheme: ThemeRegistration = {
  name: 'dalkav-linear',
  type: 'dark',
  colors: {
    'editor.background': '#0A0A0C',
    'editor.foreground': CODE_TOKENS.fg,
  },
  tokenColors: [
    { settings: { foreground: CODE_TOKENS.fg } },
    {
      scope: ['comment', 'punctuation.definition.comment', 'string.comment'],
      settings: { foreground: CODE_TOKENS.comment },
    },
    {
      scope: [
        'keyword',
        'storage',
        'storage.type',
        'storage.modifier',
        'keyword.control',
        'keyword.operator.new',
        'keyword.operator.expression',
        'variable.language',
      ],
      settings: { foreground: CODE_TOKENS.keyword },
    },
    {
      scope: ['string', 'string.quoted', 'string.template', 'markup.inline.raw', 'string.regexp'],
      settings: { foreground: CODE_TOKENS.string },
    },
    {
      scope: [
        'constant',
        'constant.numeric',
        'constant.language',
        'constant.character',
        'constant.other',
        'support.constant',
        'variable.other.constant',
      ],
      settings: { foreground: CODE_TOKENS.number },
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call', 'variable.function'],
      settings: { foreground: CODE_TOKENS.function },
    },
    {
      scope: [
        'entity.name.type',
        'entity.name.class',
        'support.type',
        'support.class',
        'entity.other.inherited-class',
        'entity.name.tag',
        'entity.other.attribute-name',
      ],
      settings: { foreground: CODE_TOKENS.type },
    },
    {
      scope: ['punctuation', 'keyword.operator', 'meta.brace', 'punctuation.separator', 'punctuation.terminator'],
      settings: { foreground: CODE_TOKENS.punctuation },
    },
  ],
};

interface HastLike {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastLike[];
}

function addClass(node: HastLike, name: string): void {
  const props = (node.properties ??= {});
  const current = props.class;
  const list = Array.isArray(current) ? current.map(String) : typeof current === 'string' ? current.split(/\s+/) : [];
  if (!list.includes(name)) list.push(name);
  props.class = list.filter(Boolean).join(' ');
}

function styleToClass(node: HastLike): void {
  if (node.type === 'element' && node.properties && 'style' in node.properties) {
    const style = String(node.properties.style ?? '');
    const color = /(?:^|;)\s*color\s*:\s*(#[0-9a-f]{3,8})/i.exec(style)?.[1]?.toLowerCase();
    const token = color ? CLASS_BY_COLOR.get(color) : undefined;
    if (token && token !== 'fg') addClass(node, `tok-${token}`);
    if (/user-select\s*:\s*none/i.test(style)) addClass(node, 'select-none');
    delete node.properties.style;
  }
  node.children?.forEach(styleToClass);
}

/** Replaces every inline style Shiki and Astro emit with classes. */
export const codeTransformer: ShikiTransformer = {
  name: 'dalkav:style-to-class',
  root(root) {
    styleToClass(root as unknown as HastLike);
  },
};
