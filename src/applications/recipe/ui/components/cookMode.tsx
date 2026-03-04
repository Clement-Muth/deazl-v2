"use client";

import { useState, useEffect } from "react";
import type { RecipeStep } from "@/applications/recipe/domain/entities/recipe";

interface Props {
  steps: RecipeStep[];
  recipeName: string;
  onClose: () => void;
}

export function CookMode({ steps, recipeName, onClose }: Props) {
  const [current, setCurrent] = useState(0);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  useEffect(() => {
    const wakeLock = navigator as unknown as { wakeLock?: { request(type: string): Promise<unknown> } };
    let sentinel: { release(): Promise<void> } | null = null;
    wakeLock.wakeLock?.request("screen").then((s) => { sentinel = s as typeof sentinel; }).catch(() => {});
    return () => { sentinel?.release(); };
  }, []);

  function toggleCheck(idx: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  const step = steps[current];
  const isLast = current === steps.length - 1;
  const isDone = checked.size === steps.length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-foreground" style={{ animation: "fadeIn 0.2s ease both" }}>
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-widest text-white/40">
            {recipeName}
          </span>
          <span className="text-sm font-semibold text-white/60">
            Étape {current + 1} / {steps.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition active:scale-90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="flex gap-1 px-5 pb-6">
        {steps.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= current ? "#16A34A" : "rgba(255,255,255,0.15)" }}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col justify-center px-6">
        <button
          onClick={() => toggleCheck(current)}
          className={`mb-6 flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all duration-200 ${
            checked.has(current)
              ? "border-primary bg-primary"
              : "border-white/30 bg-transparent"
          }`}
        >
          {checked.has(current) && (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>

        <p
          key={current}
          className="text-xl font-semibold leading-relaxed text-white"
          style={{ animation: "slideStepIn 0.25s cubic-bezier(0.22,1,0.36,1) both" }}
        >
          {step.description}
        </p>
      </div>

      {isDone && (
        <div className="mx-5 mb-4 rounded-2xl bg-primary/20 px-4 py-3 ring-1 ring-primary/30">
          <p className="text-center text-sm font-semibold text-primary">
            Toutes les étapes terminées !
          </p>
        </div>
      )}

      <div className="flex gap-3 px-5 pb-10">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-white/10 text-white transition active:scale-[0.97] disabled:opacity-20"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {isLast ? (
          <button
            onClick={onClose}
            className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/30 transition active:scale-[0.97]"
          >
            Terminer
          </button>
        ) : (
          <button
            onClick={() => { toggleCheck(current); setCurrent((c) => Math.min(steps.length - 1, c + 1)); }}
            className="flex h-14 flex-[3] items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/30 transition active:scale-[0.97]"
          >
            Étape suivante
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>

      <style>{`
        @keyframes slideStepIn {
          from { opacity: 0; transform: translateX(12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
