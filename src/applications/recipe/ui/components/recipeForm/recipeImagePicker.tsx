"use client";

import { useRef, useState } from "react";

interface Props {
  defaultImageUrl?: string | null;
}

export function RecipeImagePicker({ defaultImageUrl }: Props) {
  const [preview, setPreview] = useState<string | null>(defaultImageUrl ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  return (
    <div
      className="relative cursor-pointer overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 backdrop-blur-sm"
      onClick={() => inputRef.current?.click()}
    >
      {preview ? (
        <div className="relative h-44">
          <img src={preview} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-end justify-end p-3">
            <span className="rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              Changer la photo
            </span>
          </div>
        </div>
      ) : (
        <div className="flex h-32 flex-col items-center justify-center gap-2">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="text-xs font-medium text-gray-400">Ajouter une photo</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        name="image"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
