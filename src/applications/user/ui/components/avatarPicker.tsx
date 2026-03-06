"use client";

import { useRef, useState, useTransition } from "react";
import { uploadAvatar } from "@/applications/user/application/useCases/uploadAvatar";

interface AvatarPickerProps {
  initials: string;
  avatarUrl?: string | null;
}

export function AvatarPicker({ initials, avatarUrl }: AvatarPickerProps) {
  const [preview, setPreview] = useState<string | null>(avatarUrl ?? null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const fd = new FormData();
    fd.append("avatar", file);

    startTransition(async () => {
      const result = await uploadAvatar(fd);
      if (result.url) {
        URL.revokeObjectURL(objectUrl);
        setPreview(result.url);
      }
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-primary text-2xl font-black text-white shadow-lg shadow-primary/25 transition active:scale-95"
      >
        {preview ? (
          <img src={preview} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          </div>
        )}
      </button>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-background transition active:scale-90"
        aria-label="Changer la photo"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
