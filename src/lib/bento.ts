// Bento layout (§3.1, §4.5): asymmetric and fully filled on the 6-column desktop grid.
//
// Cards are placed like CSS grid auto-placement (first free slot, row-major),
// then rows with spare columns are filled: in a row of single-height cards the
// `wide` card (or the last one) absorbs the spare columns; elsewhere cards grow
// into free cells on their right. With the four starter projects (hero 4×2,
// tall 2×2, wide 3, standard 2) the third row would hold 5 of 6 columns, so
// `wide` grows to 4: rows stay full and the layout stays asymmetric.
// Placement is emitted as static class names (no style attributes), so every
// class below is spelled out for Tailwind.

export type BentoSize = 'hero' | 'tall' | 'wide' | 'standard';

const SIZE: Record<BentoSize, { w: number; h: number }> = {
  hero: { w: 4, h: 2 },
  tall: { w: 2, h: 2 },
  wide: { w: 3, h: 1 },
  standard: { w: 2, h: 1 },
};

const COLS = 6;

const LG_COL_START = ['lg:col-start-1', 'lg:col-start-2', 'lg:col-start-3', 'lg:col-start-4', 'lg:col-start-5', 'lg:col-start-6'];
const LG_COL_SPAN = ['', 'lg:col-span-1', 'lg:col-span-2', 'lg:col-span-3', 'lg:col-span-4', 'lg:col-span-5', 'lg:col-span-6'];
const LG_ROW_START = [
  'lg:row-start-1', 'lg:row-start-2', 'lg:row-start-3', 'lg:row-start-4', 'lg:row-start-5', 'lg:row-start-6',
  'lg:row-start-7', 'lg:row-start-8', 'lg:row-start-9', 'lg:row-start-10', 'lg:row-start-11', 'lg:row-start-12',
  'lg:row-start-13', 'lg:row-start-14', 'lg:row-start-15', 'lg:row-start-16', 'lg:row-start-17', 'lg:row-start-18',
];
const LG_ROW_SPAN = ['', 'lg:row-span-1', 'lg:row-span-2'];
const MD_COL_SPAN = ['', 'md:col-span-1', 'md:col-span-2'];

export interface BentoCell {
  size: BentoSize;
  /** Effective desktop width after filling (for choosing the card layout). */
  width: number;
  height: number;
  className: string;
}

function placeDesktop(sizes: BentoSize[]) {
  const grid: boolean[][] = [];
  const free = (r: number, c: number) => !grid[r]?.[c];
  const fits = (r: number, c: number, w: number, h: number) => {
    if (c + w > COLS) return false;
    for (let y = r; y < r + h; y++) for (let x = c; x < c + w; x++) if (!free(y, x)) return false;
    return true;
  };
  const mark = (r: number, c: number, w: number, h: number) => {
    for (let y = r; y < r + h; y++) {
      grid[y] ??= Array(COLS).fill(false);
      for (let x = c; x < c + w; x++) grid[y][x] = true;
    }
  };

  const placed = sizes.map((size) => {
    const { w, h } = SIZE[size];
    for (let r = 0; ; r++) {
      for (let c = 0; c < COLS; c++) {
        if (fits(r, c, w, h)) {
          mark(r, c, w, h);
          return { size, row: r, col: c, w, h };
        }
      }
    }
  });

  // A multi-row card that hangs below every other card would leave a ragged
  // last row: shorten it to end with the rest of the grid.
  const lastRowOf = (p: (typeof placed)[number]) => p.row + p.h - 1;
  for (const p of placed) {
    if (p.h === 1) continue;
    const othersEnd = Math.max(-1, ...placed.filter((q) => q !== p).map(lastRowOf));
    if (lastRowOf(p) > othersEnd && placed.length > 1) {
      const newH = Math.max(1, othersEnd - p.row + 1);
      for (let y = p.row + newH; y < p.row + p.h; y++) for (let x = p.col; x < p.col + p.w; x++) grid[y][x] = false;
      p.h = newH;
    }
  }

  // Rows holding only single-height cards: give the spare columns to the
  // `wide` card (or the last card) and repack the row left to right.
  const rows = new Set(placed.map((p) => p.row));
  for (const r of rows) {
    const inRow = placed.filter((p) => p.row <= r && r < p.row + p.h);
    if (inRow.some((p) => p.h !== 1)) continue;
    const spare = COLS - inRow.reduce((sum, p) => sum + p.w, 0);
    if (spare <= 0) continue;
    inRow.sort((a, b) => a.col - b.col);
    const grow = inRow.find((p) => p.size === 'wide') ?? inRow[inRow.length - 1];
    grow.w += spare;
    let col = 0;
    for (const p of inRow) {
      p.col = col;
      col += p.w;
    }
    mark(r, 0, COLS, 1);
  }

  // Remaining gaps (next to multi-row cards): widen cards into free cells on their right.
  for (const p of placed) {
    while (p.col + p.w < COLS) {
      const x = p.col + p.w;
      let canGrow = true;
      for (let y = p.row; y < p.row + p.h; y++) if (!free(y, x)) canGrow = false;
      if (!canGrow) break;
      mark(p.row, x, 1, p.h);
      p.w += 1;
    }
  }
  // A card that is alone in its row would fill all 6 columns; that's fine (and full).
  return placed;
}

/** Tablet: 2 columns, no row spans. hero/wide take both columns; a lone half card is widened. */
function placeTablet(sizes: BentoSize[]): number[] {
  const widths = sizes.map((s) => (s === 'hero' || s === 'wide' ? 2 : 1));
  let used = 0;
  for (let i = 0; i < widths.length; i++) {
    if (used === 1 && widths[i] === 2) {
      widths[i - 1] = 2; // previous card was alone in its row
      used = 0;
    }
    used = (used + widths[i]) % 2;
  }
  if (used === 1) widths[widths.length - 1] = 2;
  return widths;
}

export function bentoLayout(sizes: BentoSize[]): BentoCell[] {
  const desktop = placeDesktop(sizes);
  const tablet = placeTablet(sizes);
  return desktop.map((p, i) => ({
    size: p.size,
    width: p.w,
    height: p.h,
    className: [
      MD_COL_SPAN[tablet[i]],
      LG_COL_START[p.col],
      LG_COL_SPAN[p.w],
      LG_ROW_START[Math.min(p.row, LG_ROW_START.length - 1)],
      LG_ROW_SPAN[p.h],
    ]
      .filter(Boolean)
      .join(' '),
  }));
}
