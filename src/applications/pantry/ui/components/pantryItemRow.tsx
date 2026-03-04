"use client";

import { useRef, useState, useTransition } from "react";
import { deletePantryItem } from "@/applications/pantry/application/useCases/deletePantryItem";
import { updatePantryItemQuantity } from "@/applications/pantry/application/useCases/updatePantryItemQuantity";
import type { PantryItem } from "@/applications/pantry/domain/entities/pantry";

interface Props {
  item: PantryItem;
}

function fmtQty(qty: number): string {
  return qty % 1 === 0 ? String(qty) : qty.toFixed(2).replace(/\.?0+$/, "");
}

function expiryStatus(dateStr: string): { days: number; label: string; color: "ok" | "soon" | "expired" } {
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (days < 0) return { days, label: `Expiré il y a ${Math.abs(days)}j`, color: "expired" };
  if (days === 0) return { days, label: "Expire aujourd'hui", color: "soon" };
  if (days <= 3) return { days, label: `Expire dans ${days}j`, color: "soon" };
  return { days, label: `${days}j`, color: "ok" };
}

const SWIPE_THRESHOLD = 72;
const MAX_REVEAL = 84;

export function PantryItemRow({ item }: Props) {
  const [isPending, startTransition] = useTransition();
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  function handlePointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    currentX.current = e.clientX;
    setIsDragging(false);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (e.pointerType === "mouse") return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 6) setIsDragging(true);
    const clamped = Math.max(-MAX_REVEAL, Math.min(0, dx > 0 ? 0 : dx));
    setOffset(clamped);
  }

  function handlePointerUp() {
    if (offset <= -SWIPE_THRESHOLD) {
      navigator.vibrate?.(30);
      startTransition(() => deletePantryItem(item.id));
    } else {
      setOffset(0);
    }
    setIsDragging(false);
  }

  function handleDecrement(e: React.MouseEvent) {
    if (isDragging) return;
    e.stopPropagation();
    const next = (item.quantity ?? 1) - 1;
    startTransition(() => updatePantryItemQuantity(item.id, next <= 0 ? null : next));
  }

  function handleIncrement(e: React.MouseEvent) {
    if (isDragging) return;
    e.stopPropagation();
    const next = (item.quantity ?? 0) + 1;
    startTransition(() => updatePantryItemQuantity(item.id, next));
  }

  const expiry = item.expiryDate ? expiryStatus(item.expiryDate) : null;
  const isExpired = expiry?.color === "expired";
  const isSoon = expiry?.color === "soon";
  const swipeProgress = Math.min(1, Math.abs(offset) / SWIPE_THRESHOLD);

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ animation: "fadeRowIn 0.22s ease both" }}
    >
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end px-5"
        style={{
          backgroundColor: `rgba(239,68,68,${0.08 + swipeProgress * 0.92})`,
          borderRadius: "16px",
        }}
      >
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ opacity: swipeProgress, transform: `scale(${0.7 + swipeProgress * 0.3})` }}
        >
          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
        </svg>
      </div>

      <div
        className={`relative flex items-center gap-3 rounded-2xl px-4 py-3 shadow-sm ring-1 backdrop-blur-sm transition-opacity ${
          isPending ? "opacity-40" : ""
        } ${
          isExpired
            ? "bg-destructive-light ring-destructive/20"
            : isSoon
            ? "bg-accent-light ring-accent/30"
            : "bg-white/80 ring-black/5"
        }`}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
          touchAction: "pan-y",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{item.customName}</p>
          {(item.quantity !== null || expiry) && (
            <div className="mt-0.5 flex items-center gap-2">
              {item.quantity !== null && (
                <span className="text-xs text-muted-foreground">
                  {fmtQty(item.quantity)}{item.unit ? ` ${item.unit}` : ""}
                </span>
              )}
              {expiry && (
                <span className={`text-[10px] font-semibold ${
                  isExpired ? "text-destructive" : isSoon ? "text-accent-dark" : "text-muted-foreground"
                }`}>
                  {expiry.label}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleDecrement}
            disabled={isPending}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground transition active:scale-90 disabled:opacity-40"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleIncrement}
            disabled={isPending}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground transition active:scale-90 disabled:opacity-40"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeRowIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
