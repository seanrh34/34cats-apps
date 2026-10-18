"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { Bracket } from "@/components/brand/bracket";
import { Cat } from "@/components/brand/cat";
import { tintClass } from "@/lib/app-utils";
import type { AppTint } from "@/lib/types";

export interface DeskTile {
  name: string;
  host: string;
  status: string;
  tint: AppTint;
}

/** Tile layouts by index; extra apps wrap around. Values are % of the desk. */
const slots = [
  { left: 13, top: 41, width: 47, rot: -5 },
  { left: 44, top: 62, width: 47, rot: 4 },
  { left: 18, top: 77, width: 40, rot: 3 },
  { left: 52, top: 40, width: 38, rot: -3 },
];
const durations = ["6s", "7.4s", "5.4s", "6.6s"];

export function HeroDesk({ tiles }: { tiles: DeskTile[] }) {
  const ref = useRef<HTMLDivElement>(null);

  // Pointer parallax: fine pointers only, rAF-throttled, transform-only (via CSS vars).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches) return;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    const tick = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      el.style.setProperty("--px", cx.toFixed(3));
      el.style.setProperty("--py", cy.toFixed(3));
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.002 ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="desk relative mx-auto aspect-square w-full max-w-[18.5rem] sm:max-w-[26rem] lg:max-w-[30rem]" aria-hidden="true">
      <div className="par absolute inset-0" style={{ "--depth": 4 } as CSSProperties}>
        <Bracket animate fill="var(--surface)" strokeWidth={4.5} className="absolute left-[15%] top-[27%] w-[70%]" />
        <div className="cat-arrive absolute left-[41%] top-[27%] w-[38%] -translate-y-full" style={{ marginTop: "2.4cqw" }}>
          <Cat className="block w-full" />
        </div>
      </div>

      {tiles.map((tile, i) => {
        const slot = slots[i % slots.length];
        return (
          <div
            key={tile.name}
            className="par absolute"
            style={{ left: `${slot.left}%`, top: `${slot.top}%`, width: `${slot.width}%`, "--depth": 10 + (i % 2) * 4 } as CSSProperties}
          >
            <div className="tile-drop" style={{ "--rot": `${slot.rot}deg`, "--k": i } as CSSProperties}>
              <div className="tile-bob" style={{ "--dur": durations[i % durations.length], "--k": i } as CSSProperties}>
                <div
                  className={`${tintClass[tile.tint]} rounded-[1.1rem] border-2 border-copy text-[var(--ink)]`}
                  style={{ padding: "3.2cqw 3.6cqw", boxShadow: "0.9cqw 0.9cqw 0 var(--text)" }}
                >
                  <p className="flex items-center gap-[1.4cqw] font-mono uppercase tracking-[0.08em]" style={{ fontSize: "clamp(0.5rem, 2.3cqw, 0.7rem)" }}>
                    <span className="rounded-full bg-live" style={{ width: "1.8cqw", height: "1.8cqw", minWidth: 6, minHeight: 6 }} />
                    {tile.status}
                  </p>
                  <p className="portal-heading mt-[1.2cqw] leading-none" style={{ fontSize: "clamp(0.95rem, 5.2cqw, 1.5rem)" }}>
                    {tile.name}
                  </p>
                  <p className="mt-[1.2cqw] truncate font-mono opacity-75" style={{ fontSize: "clamp(0.5rem, 2.2cqw, 0.68rem)" }}>
                    {tile.host}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
