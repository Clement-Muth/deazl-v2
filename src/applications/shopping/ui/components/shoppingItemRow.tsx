"use client";

import { useRef, useState } from "react";
import type { ShoppingItem } from "@/applications/shopping/domain/entities/shopping";

interface ShoppingItemRowProps {
  item: ShoppingItem;
  onToggle: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
  hasDivider?: boolean;
}

const THRESHOLD = 72;
const MAX_REVEAL = 84;

function vibrate(ms: number) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
}

export function ShoppingItemRow({ item, onToggle, onDelete, hasDivider }: ShoppingItemRowProps) {
  const [tx, setTx] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const txRef = useRef(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const swipeDir = useRef<"h" | "v" | null>(null);

  const qty = item.quantity % 1 === 0
    ? item.quantity
    : parseFloat(item.quantity.toFixed(2).replace(/\.?0+$/, ""));

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (isAnimating) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    swipeDir.current = null;
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (isAnimating || e.pointerType === "mouse") return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (!swipeDir.current) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      swipeDir.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      if (swipeDir.current === "h") e.currentTarget.setPointerCapture(e.pointerId);
    }

    if (swipeDir.current !== "h") return;

    const sign = dx > 0 ? 1 : -1;
    const abs = Math.abs(dx);
    const rubber = abs > MAX_REVEAL ? MAX_REVEAL + (abs - MAX_REVEAL) * 0.15 : abs;
    const newTx = sign * rubber;
    txRef.current = newTx;
    setTx(newTx);
  }

  function onPointerUp() {
    if (swipeDir.current !== "h") { swipeDir.current = null; return; }
    swipeDir.current = null;
    const current = txRef.current;

    if (current >= THRESHOLD) {
      vibrate(10);
      setIsAnimating(true);
      const target = window.innerWidth;
      txRef.current = target;
      setTx(target);
      setTimeout(() => {
        onToggle(item.id, !item.isChecked);
        txRef.current = 0;
        setTx(0);
        setIsAnimating(false);
      }, 280);
    } else if (current <= -THRESHOLD) {
      vibrate(30);
      setIsAnimating(true);
      txRef.current = -window.innerWidth;
      setTx(-window.innerWidth);
      setTimeout(() => {
        onDelete(item.id);
      }, 280);
    } else {
      txRef.current = 0;
      setTx(0);
    }
  }

  const progress = Math.min(Math.abs(tx) / THRESHOLD, 1);
  const isRight = tx > 0;
  const isLeft = tx < 0;

  return (
    <div
      className={`relative overflow-hidden ${hasDivider ? "border-b border-black/4" : ""}`}
      style={{ animation: "fadeRowIn 0.22s ease both" }}
    >
      {isRight && (
        <div
          className="absolute inset-0 flex items-center pl-5"
          style={{ backgroundColor: `rgba(34,197,94,${progress * 0.9})` }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
            style={{ opacity: progress, transform: `scale(${0.6 + progress * 0.4})` }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
      {isLeft && (
        <div
          className="absolute inset-0 flex items-center justify-end pr-5"
          style={{ backgroundColor: `rgba(239,68,68,${progress * 0.9})` }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ opacity: progress, transform: `scale(${0.6 + progress * 0.4})` }}>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </div>
      )}

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          transform: `translateX(${tx}px)`,
          transition: swipeDir.current === "h" ? "none" : `transform 0.32s cubic-bezier(0.34,1.56,0.64,1)`,
          userSelect: "none",
          touchAction: "pan-y",
        }}
        className="relative flex items-center gap-3 bg-white px-4 py-3.5"
      >
        <button
          type="button"
          role="checkbox"
          aria-checked={item.isChecked}
          aria-label={item.customName}
          onClick={() => { vibrate(8); onToggle(item.id, !item.isChecked); }}
          className="-m-2.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full border-2"
            style={{
              borderColor: item.isChecked ? "var(--color-primary)" : "#D1D5DB",
              backgroundColor: item.isChecked ? "var(--color-primary)" : "transparent",
              transition: "background-color 0.18s ease, border-color 0.18s ease",
            }}
          >
            {item.isChecked && (
              <svg
                width="10" height="10" viewBox="0 0 12 12"
                fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ strokeDasharray: 20, strokeDashoffset: 0, animation: "drawCheck 0.22s ease forwards" }}
              >
                <polyline points="2 6 5 9 10 3" />
              </svg>
            )}
          </span>
        </button>

        <span className={`flex-1 text-sm ${item.isChecked ? "text-gray-400 line-through decoration-gray-300" : "font-medium text-foreground"}`}
          style={{ transition: "color 0.18s ease" }}>
          {item.customName}
        </span>

        <div className="flex shrink-0 flex-col items-end gap-0.5" aria-hidden={item.isChecked ? "true" : undefined}>
          <span className="text-xs font-medium text-gray-400">
            {qty} {item.unit}
          </span>
          {item.price && !item.isChecked && (
            <span className="text-[10px] font-semibold text-green-600">
              ~{item.price.estimatedCost.toFixed(2)} €
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes drawCheck {
          from { stroke-dashoffset: 20; opacity: 0; }
          to   { stroke-dashoffset: 0;  opacity: 1; }
        }
        @keyframes fadeRowIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
