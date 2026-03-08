"use client";

import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { submitFeedback } from "@/applications/user/application/useCases/submitFeedback";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();

  async function handleSubmit() {
    if (!message.trim()) return;
    setStatus("sending");
    const result = await submitFeedback(message, pathname);
    if (result.error) {
      setStatus("error");
    } else {
      setStatus("sent");
      setMessage("");
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
      }, 1800);
    }
  }

  function handleOpen() {
    setOpen(true);
    setStatus("idle");
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label="Donner un avis"
        className="fixed bottom-28 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg shadow-black/10 ring-1 ring-black/6 transition-all active:scale-90"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="w-full rounded-t-3xl bg-white p-6 shadow-2xl">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-base font-semibold">Ton avis nous aide</h2>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Bug, idée, frustration — tout est utile.
            </p>

            {status === "sent" ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p className="font-medium text-foreground">Merci !</p>
                <p className="text-sm text-muted-foreground">Message bien reçu.</p>
              </div>
            ) : (
              <>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décris ce que tu as vécu..."
                  rows={4}
                  maxLength={2000}
                  className="w-full resize-none rounded-2xl border border-border bg-muted/40 p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {status === "error" && (
                  <p className="mt-1 text-xs text-destructive">Erreur lors de l'envoi, réessaie.</p>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || status === "sending"}
                  className="mt-3 w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-40"
                >
                  {status === "sending" ? "Envoi…" : "Envoyer"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
