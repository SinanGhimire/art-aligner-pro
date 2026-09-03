/**
 * Per-cell accessory extraction.
 *
 * Pipeline for every cell of a labelled class sheet:
 *   1. align  — shift the cell by the offset that best matches the plain cell
 *   2. diff   — keep pixels whose color differs from the aligned plain cell
 *   3. dilate — grow the mask so anti-aliased outlines survive
 *   4. bake   — composite the masked pixels into a new transparent sheet
 *
 * On-face items (bandanas, masks) are lossy by nature: they overlap features
 * that exist in the plain cell too, hence the tunable threshold + dilation.
 */

export type ExtractOptions = {
  cols: number;
  rows: number;
  /** zero-based index of the plain (accessory-free) reference cell */
  plainIndex: number;
  /** max pixel shift searched in each direction */
  searchRadius: number;
  /** 0-255 color distance above which a pixel counts as "accessory" */
  threshold: number;
  /** mask dilation radius in pixels */
  dilate: number;
  /** fraction of cell height kept from the top (1 = whole cell) */
  keepTop: number;
};

export const DEFAULT_OPTIONS: ExtractOptions = {
  cols: 6,
  rows: 5,
  plainIndex: 0,
  searchRadius: 8,
  threshold: 42,
  dilate: 2,
  keepTop: 1,
};

export type CellReport = {
  index: number;
  dx: number;
  dy: number;
  coverage: number;
};

export type ExtractResult = {
  canvas: HTMLCanvasElement;
  reports: CellReport[];
};

function getCell(
  source: ImageData,
  cw: number,
  ch: number,
  col: number,
  row: number,
  dx: number,
  dy: number,
  out: Uint8ClampedArray,
) {
  const { width, height, data } = source;
  for (let y = 0; y < ch; y++) {
    const sy = row * ch + y + dy;
    for (let x = 0; x < cw; x++) {
      const sx = col * cw + x + dx;
      const o = (y * cw + x) * 4;
      if (sx < 0 || sy < 0 || sx >= width || sy >= height) {
        out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
        continue;
      }
      const s = (sy * width + sx) * 4;
      out[o] = data[s]!;
      out[o + 1] = data[s + 1]!;
      out[o + 2] = data[s + 2]!;
      out[o + 3] = data[s + 3]!;
    }
  }
}

/** Mean absolute difference over the lower part of the cell (body, not headgear). */
function bodyScore(a: Uint8ClampedArray, b: Uint8ClampedArray, cw: number, ch: number) {
  let sum = 0;
  let n = 0;
  const start = Math.floor(ch * 0.55);
  for (let y = start; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const o = (y * cw + x) * 4;
      sum +=
        Math.abs(a[o]! - b[o]!) +
        Math.abs(a[o + 1]! - b[o + 1]!) +
        Math.abs(a[o + 2]! - b[o + 2]!) +
        Math.abs(a[o + 3]! - b[o + 3]!);
      n += 4;
    }
  }
  return n ? sum / n : Number.MAX_SAFE_INTEGER;
}

function dilateMask(mask: Uint8Array, cw: number, ch: number, radius: number) {
  if (radius <= 0) return mask;
  let current = mask;
  for (let pass = 0; pass < radius; pass++) {
    const next = new Uint8Array(current);
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const i = y * cw + x;
        if (current[i]) continue;
        const up = y > 0 && current[i - cw];
        const down = y < ch - 1 && current[i + cw];
        const left = x > 0 && current[i - 1];
        const right = x < cw - 1 && current[i + 1];
        if (up || down || left || right) next[i] = 1;
      }
    }
    current = next;
  }
  return current;
}

export function extractAccessories(
  image: HTMLImageElement | ImageBitmap,
  options: ExtractOptions,
): ExtractResult {
  const { cols, rows, plainIndex, searchRadius, threshold, dilate, keepTop } = options;
  const width = image.width;
  const height = image.height;

  const read = document.createElement("canvas");
  read.width = width;
  read.height = height;
  const rctx = read.getContext("2d", { willReadFrequently: true })!;
  rctx.drawImage(image as CanvasImageSource, 0, 0);
  const source = rctx.getImageData(0, 0, width, height);

  const cw = Math.floor(width / cols);
  const ch = Math.floor(height / rows);

  const out = document.createElement("canvas");
  out.width = cw * cols;
  out.height = ch * rows;
  const octx = out.getContext("2d")!;
  octx.clearRect(0, 0, out.width, out.height);

  const plainCol = plainIndex % cols;
  const plainRow = Math.floor(plainIndex / cols);
  const plain = new Uint8ClampedArray(cw * ch * 4);
  getCell(source, cw, ch, plainCol, plainRow, 0, 0, plain);

  const cell = new Uint8ClampedArray(cw * ch * 4);
  const best = new Uint8ClampedArray(cw * ch * 4);
  const reports: CellReport[] = [];
  const keepRows = Math.max(1, Math.floor(ch * Math.min(1, Math.max(0.1, keepTop))));

  for (let index = 0; index < cols * rows; index++) {
    const col = index % cols;
    const row = Math.floor(index / cols);

    // 1. alignment search
    let bestScore = Number.MAX_SAFE_INTEGER;
    let bdx = 0;
    let bdy = 0;
    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        getCell(source, cw, ch, col, row, dx, dy, cell);
        const score = bodyScore(cell, plain, cw, ch);
        if (score < bestScore) {
          bestScore = score;
          bdx = dx;
          bdy = dy;
        }
      }
    }
    getCell(source, cw, ch, col, row, bdx, bdy, best);

    // 2. diff against the plain cell
    const mask = new Uint8Array(cw * ch);
    for (let y = 0; y < keepRows; y++) {
      for (let x = 0; x < cw; x++) {
        const i = y * cw + x;
        const o = i * 4;
        if (best[o + 3]! < 16) continue;
        const d =
          Math.abs(best[o]! - plain[o]!) +
          Math.abs(best[o + 1]! - plain[o + 1]!) +
          Math.abs(best[o + 2]! - plain[o + 2]!) +
          Math.abs(best[o + 3]! - plain[o + 3]!);
        if (d / 4 > threshold) mask[i] = 1;
      }
    }

    // 3. dilate
    const grown = dilateMask(mask, cw, ch, dilate);

    // 4. bake
    const baked = new ImageData(cw, ch);
    let kept = 0;
    for (let i = 0; i < grown.length; i++) {
      const o = i * 4;
      if (!grown[i]) continue;
      baked.data[o] = best[o]!;
      baked.data[o + 1] = best[o + 1]!;
      baked.data[o + 2] = best[o + 2]!;
      baked.data[o + 3] = best[o + 3] || 255;
      kept++;
    }
    if (index !== plainIndex) octx.putImageData(baked, col * cw, row * ch);
    reports.push({
      index,
      dx: bdx,
      dy: bdy,
      coverage: kept / (cw * ch),
    });
  }

  return { canvas: out, reports };
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

export function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image file."));
    img.src = URL.createObjectURL(file);
  });
}
