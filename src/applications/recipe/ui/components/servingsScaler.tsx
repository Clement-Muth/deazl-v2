"use client";

interface Props {
  baseServings: number;
  servings: number;
  onChange: (n: number) => void;
}

export function ServingsScaler({ baseServings, servings, onChange }: Props) {
  const ratio = servings / baseServings;
  const isModified = servings !== baseServings;

  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-400">
          Portions
        </span>
        {isModified && (
          <span className="text-xs text-primary">
            ×{ratio % 1 === 0 ? ratio : ratio.toFixed(1)} vs recette de base
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, servings - 1))}
          disabled={servings <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-gray-600 transition active:scale-90 disabled:opacity-30"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <span className="w-6 text-center text-base font-bold text-foreground">
          {servings}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(99, servings + 1))}
          disabled={servings >= 99}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-gray-600 transition active:scale-90 disabled:opacity-30"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
