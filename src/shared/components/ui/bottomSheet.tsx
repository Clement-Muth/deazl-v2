"use client";

import {
  useState, useRef, useEffect, useCallback,
  createContext, useContext, forwardRef, useImperativeHandle,
} from "react";
import { createPortal } from "react-dom";

const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const DISMISS_THRESHOLD = 120;   // px — minimum downward drag to auto-dismiss
const VELOCITY_THRESHOLD = 0.4; // px/ms — minimum flick velocity to dismiss

// ── Context (dismiss only — drag is handled by the sheet container) ───────────

interface SheetCtx { dismiss: () => void; }
const SheetContext = createContext<SheetCtx | null>(null);

export function useSheetDismiss(): () => void {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error("useSheetDismiss must be used within BottomSheet");
  return ctx.dismiss;
}

// ── SheetHandle ───────────────────────────────────────────────────────────────
// Visual only: pill indicator + optional header content.
// touch-none prevents browser scroll gestures on the handle area so the
// sheet's own touch handlers (on the container) can take over cleanly.

export function SheetHandle({ children }: { children?: React.ReactNode }) {
  return (
    <div className="shrink-0 touch-none select-none">
      <div className="flex justify-center pb-1 pt-3">
        <div className="h-1 w-10 rounded-full bg-gray-200" />
      </div>
      {children}
    </div>
  );
}

// ── Scroll/drag conflict helpers ──────────────────────────────────────────────
// Walk up the DOM from a touch target to find the nearest scrollable ancestor
// that is actually scrollable (has overflow content). This lets us detect
// whether a touch started inside scrollable content and handle the conflict.

function isScrollable(el: Element): boolean {
  const { overflow, overflowY } = window.getComputedStyle(el);
  return /auto|scroll/.test(overflow + overflowY);
}

function scrollableAncestor(target: Element, boundary: Element): Element | null {
  let el: Element | null = target;
  while (el && el !== boundary) {
    if (isScrollable(el) && el.scrollHeight > el.clientHeight) return el;
    el = el.parentElement;
  }
  return null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BottomSheetHandle { dismiss: () => void; }

interface BottomSheetProps {
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: string;
  zIndex?: number;
}

// ── BottomSheet ───────────────────────────────────────────────────────────────

export const BottomSheet = forwardRef<BottomSheetHandle, BottomSheetProps>(
  function BottomSheet({ onClose, children, maxHeight = "90vh", zIndex = 60 }, ref) {
    const [mounted, setMounted] = useState(false);
    const sheetRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    // Drag tracking
    const startYRef = useRef(0);
    const lastYRef = useRef(0);
    const lastTimeRef = useRef(0);
    const isDraggingRef = useRef(false);
    // "pending": touch started, direction not yet decided (scrollable-at-top case)
    const pendingRef = useRef(false);
    const isDismissingRef = useRef(false);

    useEffect(() => { setMounted(true); }, []);

    // ── Body scroll lock ─────────────────────────────────────────────────────
    // Prevents the background page from scrolling while the sheet is open.
    // Uses position:fixed technique which is more reliable than overflow:hidden
    // on iOS Safari.
    useEffect(() => {
      if (!mounted) return;
      const scrollY = window.scrollY;
      const prev = { overflow: document.body.style.overflow };
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev.overflow;
        window.scrollTo(0, scrollY);
      };
    }, [mounted]);

    // ── Mount animation ──────────────────────────────────────────────────────
    useEffect(() => {
      if (!mounted) return;
      const sheet = sheetRef.current;
      const backdrop = backdropRef.current;
      if (!sheet || !backdrop) return;
      backdrop.style.opacity = "0";
      sheet.style.transform = "translateY(100%)";
      sheet.style.transition = "none";
      requestAnimationFrame(() => requestAnimationFrame(() => {
        backdrop.style.opacity = "1";
        backdrop.style.transition = "opacity 0.25s ease";
        sheet.style.transform = "translateY(0)";
        sheet.style.transition = `transform 0.35s ${EASE}`;
      }));
    }, [mounted]);

    // ── Dismiss ──────────────────────────────────────────────────────────────
    const dismiss = useCallback(() => {
      if (isDismissingRef.current) return;
      isDismissingRef.current = true;
      const sheet = sheetRef.current;
      const backdrop = backdropRef.current;
      if (sheet) { sheet.style.transform = "translateY(100%)"; sheet.style.transition = `transform 0.3s ${EASE}`; }
      if (backdrop) { backdrop.style.opacity = "0"; backdrop.style.transition = "opacity 0.3s ease"; }
      setTimeout(onClose, 300);
    }, [onClose]);

    useImperativeHandle(ref, () => ({ dismiss }), [dismiss]);

    // ── Escape key ───────────────────────────────────────────────────────────
    useEffect(() => {
      if (!mounted) return;
      const handler = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss(); };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [mounted, dismiss]);

    // ── iOS Safari: non-passive touchmove ────────────────────────────────────
    // React's synthetic onTouchMove may be passive in some environments,
    // meaning preventDefault() is silently ignored. We add a native listener
    // with { passive: false } so we can block body scroll during sheet dragging.
    useEffect(() => {
      if (!mounted) return;
      const sheet = sheetRef.current;
      if (!sheet) return;
      const handler = (e: TouchEvent) => {
        if (isDraggingRef.current) e.preventDefault();
      };
      sheet.addEventListener("touchmove", handler, { passive: false });
      return () => sheet.removeEventListener("touchmove", handler);
    }, [mounted]);

    // ── Snap back ────────────────────────────────────────────────────────────
    const snapBack = useCallback(() => {
      const sheet = sheetRef.current;
      const backdrop = backdropRef.current;
      if (sheet) { sheet.style.transform = "translateY(0)"; sheet.style.transition = `transform 0.3s ${EASE}`; }
      if (backdrop) { backdrop.style.opacity = "1"; backdrop.style.transition = "opacity 0.2s ease"; }
    }, []);

    // ── Touch handlers ───────────────────────────────────────────────────────
    // Placed on the ENTIRE sheet container (not just the handle) so users
    // can drag from anywhere, including scrollable content areas (handled via
    // the scrollableAncestor check below).

    const onTouchStart = useCallback((e: React.TouchEvent) => {
      // Ignore if already dismissing or if multi-touch
      if (isDismissingRef.current || e.touches.length > 1) return;
      const sheet = sheetRef.current;
      if (!sheet) return;

      const y = e.touches[0].clientY;
      startYRef.current = y;
      lastYRef.current = y;
      lastTimeRef.current = Date.now();

      const scrollable = scrollableAncestor(e.target as Element, sheet);

      if (scrollable && scrollable.scrollTop > 0) {
        // Touch is inside scrollable content that's scrolled down.
        // Don't track — let the scroll handle it.
        pendingRef.current = false;
        isDraggingRef.current = false;
        return;
      }

      // Either non-scrollable area, or scrollable content at scroll-top.
      // Enter "pending" state: commit to sheet drag on downward move,
      // or cancel on upward move (to allow content to scroll up).
      pendingRef.current = true;
      isDraggingRef.current = false;
    }, []);

    const onTouchMove = useCallback((e: React.TouchEvent) => {
      const sheet = sheetRef.current;
      if (!sheet || isDismissingRef.current) return;

      const y = e.touches[0].clientY;
      const delta = y - startYRef.current;

      if (pendingRef.current) {
        if (delta > 8) {
          // Downward intent confirmed — commit to sheet drag
          pendingRef.current = false;
          isDraggingRef.current = true;
          sheet.style.transition = "none";
        } else if (delta < -8) {
          // Upward intent — cancel drag, let scroll take over
          pendingRef.current = false;
          return;
        } else {
          // Not enough movement to decide yet
          return;
        }
      }

      if (!isDraggingRef.current) return;

      const clamped = Math.max(0, delta);
      sheet.style.transform = `translateY(${clamped}px)`;
      if (backdropRef.current) {
        backdropRef.current.style.opacity = String(Math.max(0, 1 - clamped / 280));
      }
      lastYRef.current = y;
      lastTimeRef.current = Date.now();
    }, []);

    const onTouchEnd = useCallback((e: React.TouchEvent) => {
      pendingRef.current = false;
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      const endY = e.changedTouches[0].clientY;
      const dt = Date.now() - lastTimeRef.current;
      const delta = Math.max(0, endY - startYRef.current);
      // Velocity in px/ms — positive means downward (towards dismiss)
      const velocity = dt > 0 ? (endY - lastYRef.current) / dt : 0;

      if (delta > DISMISS_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
        dismiss();
      } else {
        snapBack();
      }
    }, [dismiss, snapBack]);

    if (!mounted) return null;

    return createPortal(
      <SheetContext.Provider value={{ dismiss }}>
        <div
          ref={backdropRef}
          className="fixed inset-0 bg-black/40"
          style={{ zIndex }}
          onClick={dismiss}
          aria-hidden
        />
        <div
          ref={sheetRef}
          className="fixed bottom-0 left-0 right-0 flex flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl"
          style={{ maxHeight, zIndex: zIndex + 1, overscrollBehavior: "none" }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {children}
        </div>
      </SheetContext.Provider>,
      document.body
    );
  }
);
