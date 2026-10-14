// Lab tool registry. Adding a tool = one folder in src/lab/<slug>/ (Tool.astro,
// client.ts, meta.ts, README.md) + one Function in functions/api/lab/<slug>.ts
// + one entry below. Pages are generated from this list; no new page files.

import type { Lang } from '../i18n';
import edgeEcho from './edge-echo/meta';

export interface LabTool {
  slug: string;
  title: Record<Lang, string>;
  summary: Record<Lang, string>;
  howItWorks: Record<Lang, string>;
  status: 'live' | 'experimental';
  /** The tool's Pages Function endpoint. */
  apiPath: string;
}

export const registry: LabTool[] = [edgeEcho];

export function getTool(slug: string): LabTool {
  const tool = registry.find((t) => t.slug === slug);
  if (!tool) throw new Error(`Unknown lab tool "${slug}" (add it to src/lab/registry.ts).`);
  return tool;
}
