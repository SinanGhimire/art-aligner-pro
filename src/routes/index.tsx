import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { AccessoryIcon, HeroPortrait } from "@/components/HeroPortrait";
import { ALL_CLASSES } from "@/lib/classes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hero Art Aligner — 30 Class Portraits" },
      {
        name: "description",
        content:
          "Pick from 30 hero classes with clean transparent headgear art, and bake your own accessory sheets with the per-cell aligner.",
      },
      { property: "og:title", content: "Hero Art Aligner — 30 Class Portraits" },
      {
        property: "og:description",
        content:
          "Pick from 30 hero classes with clean transparent headgear art, and bake your own accessory sheets with the per-cell aligner.",
      },
    ],
  }),
  component: ClassSelect,
});

function ClassSelect() {
  const [selectedId, setSelectedId] = useState(ALL_CLASSES[1]!.id);
  const selected = ALL_CLASSES.find((c) => c.id === selectedId) ?? ALL_CLASSES[0]!;

  return (
    <main className="min-h-screen stage-grid px-4 py-10 md:px-8">
      <header className="mx-auto mb-8 max-w-6xl text-center">
        <p className="font-display text-sm font-bold uppercase tracking-[0.3em] text-primary">
          Character Select
        </p>
        <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">Choose your class</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Every class is one hero with one clean headgear piece. Gear shows in the portrait and menu
          only — the in-game sprite stays untouched.
        </p>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[320px_1fr]">
        <section className="panel-chunk flex flex-col items-center gap-4 p-6">
          <div className="rounded-2xl bg-stage p-4">
            <HeroPortrait heroClass={selected} size={240} bob />
          </div>
          <div className="text-center">
            <p className="font-display text-xs font-bold uppercase tracking-widest text-primary">
              {selected.index === 0 ? "Base" : `Class ${String(selected.index).padStart(2, "0")}`}
            </p>
            <h2 className="mt-1 text-3xl font-extrabold">{selected.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{selected.blurb}</p>
          </div>
          <button
            type="button"
            className="btn-chunk btn-chunk-press w-full bg-primary px-5 py-3 text-primary-foreground hover:brightness-105"
          >
            Play as {selected.name}
          </button>
          <Link
            to="/aligner"
            className="btn-chunk btn-chunk-press w-full bg-secondary px-5 py-3 text-center text-secondary-foreground hover:brightness-110"
          >
            Open accessory aligner
          </Link>
        </section>

        <section className="panel-chunk p-4 md:p-6">
          <h2 className="mb-4 px-1 font-display text-lg font-bold">Base + 30 classes</h2>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {ALL_CLASSES.map((c) => {
              const active = c.id === selected.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    aria-pressed={active}
                    className={cn(
                      "btn-chunk btn-chunk-press flex w-full flex-col items-center gap-1 bg-stage px-2 py-3 text-center",
                      active && "bg-accent text-accent-foreground",
                    )}
                  >
                    <AccessoryIcon heroClass={c} size={52} />
                    <span className="font-display text-xs font-bold leading-tight">{c.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}
