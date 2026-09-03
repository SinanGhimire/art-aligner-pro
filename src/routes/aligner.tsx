import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";

import {
  DEFAULT_OPTIONS,
  downloadCanvas,
  extractAccessories,
  loadImageFile,
  type CellReport,
  type ExtractOptions,
} from "@/lib/sheet-extract";

export const Route = createFileRoute("/aligner")({
  head: () => ({
    meta: [
      { title: "Accessory Sheet Aligner — Bake Transparent Headgear" },
      {
        name: "description",
        content:
          "Upload a class sheet, align every cell to the plain hero, diff out the headgear, dilate the mask and download a transparent accessories PNG.",
      },
      { property: "og:title", content: "Accessory Sheet Aligner" },
      {
        property: "og:description",
        content:
          "Per-cell alignment, diffing and mask dilation that bakes a clean transparent accessories sheet in your browser.",
      },
    ],
  }),
  component: Aligner,
});

function Aligner() {
  const [options, setOptions] = useState<ExtractOptions>(DEFAULT_OPTIONS);
  const [reports, setReports] = useState<CellReport[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const resultRef = useRef<HTMLCanvasElement | null>(null);

  function set<K extends keyof ExtractOptions>(key: K, value: ExtractOptions[K]) {
    setOptions((o) => ({ ...o, [key]: value }));
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      imageRef.current = await loadImageFile(file);
      setStatus(`Loaded ${file.name} (${imageRef.current.width}x${imageRef.current.height}px).`);
      setReports([]);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not read that file.");
    }
  }

  function run() {
    const image = imageRef.current;
    if (!image) {
      setStatus("Load a class sheet first.");
      return;
    }
    setBusy(true);
    setStatus("Aligning cells and baking masks…");
    // let the browser paint the busy state before the synchronous pass
    requestAnimationFrame(() => {
      try {
        const { canvas, reports: r } = extractAccessories(image, options);
        resultRef.current = canvas;
        canvas.className = "w-full h-auto rounded-xl";
        const host = previewRef.current;
        if (host) {
          host.replaceChildren(canvas);
        }
        setReports(r);
        setStatus(`Baked ${r.length} cells. Empty cells mean the diff found nothing — raise the threshold sensitivity.`);
      } catch (e) {
        setStatus(e instanceof Error ? e.message : "Extraction failed.");
      } finally {
        setBusy(false);
      }
    });
  }

  return (
    <main className="min-h-screen stage-grid px-4 py-10 md:px-8">
      <header className="mx-auto mb-8 flex max-w-6xl flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-[0.3em] text-primary">
            Tooling
          </p>
          <h1 className="mt-2 text-4xl font-extrabold">Accessory sheet aligner</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Shifts each cell by its best-match offset against the plain hero, diffs the result,
            dilates the mask, then bakes a transparent PNG. On-face items like bandanas are lossy —
            tune the threshold and dilation for those.
          </p>
        </div>
        <Link
          to="/"
          className="btn-chunk btn-chunk-press bg-secondary px-4 py-2 text-secondary-foreground"
        >
          Back to class select
        </Link>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[320px_1fr]">
        <section className="panel-chunk space-y-5 p-6">
          <div>
            <label className="font-display text-sm font-bold" htmlFor="sheet">
              Class sheet
            </label>
            <input
              id="sheet"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => onFile(e.target.files?.[0])}
              className="mt-2 w-full rounded-lg border-2 border-border bg-input p-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Columns"
              value={options.cols}
              min={1}
              max={20}
              onChange={(v) => set("cols", v)}
            />
            <NumberField
              label="Rows"
              value={options.rows}
              min={1}
              max={20}
              onChange={(v) => set("rows", v)}
            />
            <NumberField
              label="Plain cell #"
              value={options.plainIndex}
              min={0}
              max={options.cols * options.rows - 1}
              onChange={(v) => set("plainIndex", v)}
            />
            <NumberField
              label="Search radius"
              value={options.searchRadius}
              min={0}
              max={24}
              onChange={(v) => set("searchRadius", v)}
            />
          </div>

          <RangeField
            label={`Diff threshold — ${options.threshold}`}
            value={options.threshold}
            min={4}
            max={120}
            onChange={(v) => set("threshold", v)}
          />
          <RangeField
            label={`Mask dilation — ${options.dilate}px`}
            value={options.dilate}
            min={0}
            max={8}
            onChange={(v) => set("dilate", v)}
          />
          <RangeField
            label={`Keep top ${Math.round(options.keepTop * 100)}% of cell`}
            value={Math.round(options.keepTop * 100)}
            min={20}
            max={100}
            onChange={(v) => set("keepTop", v / 100)}
          />

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={run}
              disabled={busy}
              className="btn-chunk btn-chunk-press bg-primary px-5 py-3 text-primary-foreground disabled:opacity-60"
            >
              {busy ? "Baking…" : "Align & bake"}
            </button>
            <button
              type="button"
              onClick={() =>
                resultRef.current && downloadCanvas(resultRef.current, "accessories-sheet.png")
              }
              disabled={!reports.length}
              className="btn-chunk btn-chunk-press bg-accent px-5 py-3 text-accent-foreground disabled:opacity-60"
            >
              Download transparent PNG
            </button>
          </div>

          {status && <p className="text-xs text-muted-foreground">{status}</p>}
        </section>

        <section className="space-y-6">
          <div className="panel-chunk p-4">
            <h2 className="mb-3 font-display text-lg font-bold">Baked sheet</h2>
            <div
              ref={previewRef}
              className="flex min-h-64 items-center justify-center rounded-xl bg-stage p-3 text-sm text-muted-foreground"
            >
              Nothing baked yet.
            </div>
          </div>

          {reports.length > 0 && (
            <div className="panel-chunk p-4">
              <h2 className="mb-3 font-display text-lg font-bold">Per-cell offsets</h2>
              <ul className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 md:grid-cols-5">
                {reports.map((r) => (
                  <li
                    key={r.index}
                    className="rounded-lg border-2 border-border bg-stage px-2 py-1.5"
                  >
                    <span className="font-display font-bold">#{r.index + 1}</span>{" "}
                    <span className="text-muted-foreground">
                      dx {r.dx} dy {r.dy} · {(r.coverage * 100).toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="font-display font-bold">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
        className="mt-1 w-full rounded-lg border-2 border-border bg-input px-2 py-1.5"
      />
    </label>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="font-display font-bold">{label}</span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-primary"
      />
    </label>
  );
}
