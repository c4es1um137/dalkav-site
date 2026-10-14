// Open Graph images, rasterised at build time with astro:assets (sharp).
// The default images come from src/assets/og/og.svg (EN) and og.tr.svg (TR):
// shapes and outlined stroke paths only, so no system font is involved.

import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import type { Lang } from '../i18n';
import ogEn from '../assets/og/og.svg';
import ogTr from '../assets/og/og.tr.svg';

const sources: Record<Lang, ImageMetadata> = { en: ogEn, tr: ogTr };

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

async function toPng(src: ImageMetadata): Promise<string> {
  const image = await getImage({ src, format: 'png', width: OG_WIDTH, height: OG_HEIGHT, fit: 'cover' });
  return image.src;
}

export function defaultOgImage(lang: Lang): Promise<string> {
  return toPng(sources[lang]);
}

/** A project cover as og:image when it can fill 1200×630 (aspect within 10%). */
export function coverOgImage(cover: ImageMetadata, lang: Lang): Promise<string> {
  const ratio = cover.width / cover.height;
  const target = OG_WIDTH / OG_HEIGHT;
  return Math.abs(ratio - target) / target <= 0.1 && cover.width >= 600 ? toPng(cover) : defaultOgImage(lang);
}
