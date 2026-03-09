"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Trans } from "@lingui/react/macro";

interface BarcodeScannerModalProps {
  onDetected: (ean: string) => void;
  onClose: () => void;
}

export function BarcodeScannerModal({ onDetected, onClose }: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const stoppedRef = useRef(false);
  const controlsRef = useRef<{ stop(): void } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function start() {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();

        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result, err) => {
            if (stoppedRef.current) return;
            if (result) {
              stoppedRef.current = true;
              controls?.stop();
              onDetected(result.getText());
            }
            void err;
          },
        );
        controlsRef.current = controls;
      } catch {
        setError("camera_unavailable");
      }
    }

    start();

    return () => {
      stoppedRef.current = true;
      controlsRef.current?.stop();
    };
  }, [mounted, onDetected]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-70 flex flex-col bg-black">
      <div className="flex shrink-0 items-center justify-between px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-white"><Trans>Scan a barcode</Trans></p>
          <p className="text-xs text-white/50"><Trans>Point the camera at the product barcode</Trans></p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-36 w-72">
            <div className="absolute inset-0 rounded-xl" style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)" }} />

            <div className="absolute left-0 top-0 h-5 w-5 rounded-tl-xl border-l-2 border-t-2 border-white" />
            <div className="absolute right-0 top-0 h-5 w-5 rounded-tr-xl border-r-2 border-t-2 border-white" />
            <div className="absolute bottom-0 left-0 h-5 w-5 rounded-bl-xl border-b-2 border-l-2 border-white" />
            <div className="absolute bottom-0 right-0 h-5 w-5 rounded-br-xl border-b-2 border-r-2 border-white" />

            <div
              className="absolute inset-x-2 h-0.5 rounded-full bg-primary opacity-80"
              style={{ animation: "scanline 2s ease-in-out infinite", top: "50%" }}
            />
          </div>
        </div>

        <style>{`
          @keyframes scanline {
            0%, 100% { transform: translateY(-28px); opacity: 0.4; }
            50% { transform: translateY(28px); opacity: 1; }
          }
        `}</style>
      </div>

      {error && (
        <div className="shrink-0 px-5 py-4 text-center">
          <p className="text-sm text-red-400"><Trans>Camera not available. Check permissions.</Trans></p>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 text-sm font-semibold text-white underline"
          >
            <Trans>Close</Trans>
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}
