"use client";

import { useRef } from "react";
import { Trans } from "@lingui/react/macro";

interface Props {
  previewUrl?: string | null;
  onFileChange?: (file: File) => void;
  fullHeight?: boolean;
}

export function RecipeImagePicker({ previewUrl, onFileChange, fullHeight = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileChange?.(file);
  }

  const emptyHeight = fullHeight ? "h-72" : "h-48";
  const previewHeight = fullHeight ? "h-72" : "h-52";

  return (
    <div
      className="relative cursor-pointer overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]"
      onClick={() => inputRef.current?.click()}
    >
      {previewUrl ? (
        <div className={`relative ${previewHeight}`}>
          <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-3 right-3">
            <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <Trans>Change photo</Trans>
            </span>
          </div>
        </div>
      ) : (
        <div className={`flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-gray-50 to-white ${emptyHeight}`}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/70">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-sm font-semibold text-muted-foreground"><Trans>Add a photo</Trans></span>
            <span className="text-xs text-muted-foreground/70"><Trans>Tap to browse your library</Trans></span>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
