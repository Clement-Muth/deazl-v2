"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import { useLingui, Trans } from "@lingui/react/macro";
import { addShoppingItem } from "@/applications/shopping/application/useCases/addShoppingItem";
import { addShoppingItemsBulk } from "@/applications/shopping/application/useCases/addShoppingItemsBulk";
import { getItemSuggestions } from "@/applications/shopping/application/useCases/getItemSuggestions";

interface AddItemFormProps {
  listId: string;
}

const UNITS = ["kg", "g", "mg", "l", "L", "cl", "dl", "ml", "pièce", "pièces", "pc", "pcs", "boîte", "boîtes", "paquet", "paquets", "sachet", "sachets", "bouteille", "bouteilles", "pot", "pots", "tranche", "tranches", "botte", "bottes"];

const UNIT_RE = new RegExp(
  `^(\\d+(?:[.,]\\d+)?)\\s*(${UNITS.join("|")})s?\\s+(.+)$`,
  "i"
);
const QTY_UNIT_SEP_RE = new RegExp(
  `^(\\d+(?:[.,]\\d+)?)\\s+(${UNITS.join("|")})s?\\s+(.+)$`,
  "i"
);
const QTY_ONLY_RE = /^(\d+(?:[.,]\d+)?)\s+(.+)$/;

function parse(raw: string): { qty: number; unit: string; name: string } {
  const s = raw.trim();
  if (!s) return { qty: 1, unit: "", name: "" };

  let m = UNIT_RE.exec(s);
  if (m) return { qty: parseFloat(m[1].replace(",", ".")), unit: m[2], name: m[3].trim() };

  m = QTY_UNIT_SEP_RE.exec(s);
  if (m) return { qty: parseFloat(m[1].replace(",", ".")), unit: m[2], name: m[3].trim() };

  m = QTY_ONLY_RE.exec(s);
  if (m) return { qty: parseFloat(m[1].replace(",", ".")), unit: "", name: m[2].trim() };

  return { qty: 1, unit: "", name: s };
}

function fmtQty(qty: number): string {
  return qty % 1 === 0 ? String(qty) : qty.toFixed(2).replace(/\.?0+$/, "");
}

export function AddItemForm({ listId }: AddItemFormProps) {
  const { t } = useLingui();
  const [raw, setRaw] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [bulkCount, setBulkCount] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getItemSuggestions().then(setSuggestions).catch(() => {});
  }, []);

  const parsed = parse(raw);
  const hasName = parsed.name.length > 0;
  const showHint = hasName && (parsed.qty !== 1 || parsed.unit !== "");

  const filteredSuggestions = raw.length >= 1
    ? suggestions
        .filter((s) => s.toLowerCase().includes(raw.toLowerCase()) && s.toLowerCase() !== raw.toLowerCase())
        .slice(0, 6)
    : [];

  function submit(items: { name: string; qty: number; unit: string }[]) {
    if (items.length === 0 || isPending) return;
    setError(null);
    startTransition(async () => {
      if (items.length === 1) {
        const fd = new FormData();
        fd.append("name", items[0].name);
        fd.append("quantity", String(items[0].qty));
        fd.append("unit", items[0].unit);
        const result = await addShoppingItem(listId, undefined, fd);
        if (result?.error) {
          setError(result.error);
          return;
        }
      } else {
        const result = await addShoppingItemsBulk(
          listId,
          items.map((i) => ({ name: i.name, quantity: i.qty, unit: i.unit })),
        );
        if (result.error) {
          setError(result.error);
          return;
        }
        setBulkCount(items.length);
        setTimeout(() => setBulkCount(null), 2000);
      }
      setRaw("");
      inputRef.current?.focus();
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasName) return;
    submit([{ name: parsed.name, qty: parsed.qty, unit: parsed.unit }]);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (!text.includes("\n")) return;
    e.preventDefault();
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length <= 1) return;
    const items = lines.map(parse).filter((p) => p.name);
    submit(items.map((p) => ({ name: p.name, qty: p.qty, unit: p.unit })));
  }

  function handleSuggestionClick(s: string) {
    setRaw(s);
    inputRef.current?.focus();
  }

  return (
    <div className="rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
      {filteredSuggestions.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-b border-black/5 px-4 py-2.5 scrollbar-none">
          {filteredSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSuggestionClick(s)}
              className="shrink-0 rounded-full border border-black/8 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-100 active:scale-95"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onPaste={handlePaste}
            placeholder={t`"2 pommes", "500g pâtes"…`}
            className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={isPending || !hasName}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition active:scale-[0.95] disabled:opacity-40"
          >
            {isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
          </button>
        </div>
        {showHint && (
          <div
            className="flex items-center gap-1.5 rounded-xl bg-primary/8 px-3 py-1.5"
            style={{ animation: "fadeSlideDown 0.15s ease forwards" }}
          >
            {parsed.qty !== 1 && (
              <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[11px] font-bold text-primary">
                {fmtQty(parsed.qty)}
              </span>
            )}
            {parsed.unit && (
              <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[11px] font-bold text-primary">
                {parsed.unit}
              </span>
            )}
            <span className="text-[11px] font-semibold text-primary/80 truncate max-w-40">
              {parsed.name}
            </span>
          </div>
        )}
      </form>

      {bulkCount !== null && (
        <p className="px-5 pb-3 text-xs font-medium text-green-600">
          <Trans>{bulkCount} items added</Trans>
        </p>
      )}
      {error && (
        <p className="px-5 pb-3 text-xs text-destructive">{error}</p>
      )}
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
