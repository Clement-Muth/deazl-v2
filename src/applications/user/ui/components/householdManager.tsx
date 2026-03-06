"use client";

import { useState, useTransition } from "react";
import { createHousehold } from "@/applications/user/application/useCases/createHousehold";
import { joinHousehold } from "@/applications/user/application/useCases/joinHousehold";
import { leaveHousehold } from "@/applications/user/application/useCases/leaveHousehold";
import type { Household } from "@/applications/user/domain/entities/household";

interface Props {
  initialHousehold: Household | null;
  currentUserId: string;
}

function MemberAvatar({ displayName, avatarUrl }: { displayName: string | null; avatarUrl: string | null }) {
  const initials = displayName
    ? displayName.trim().split(/\s+/).map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  return avatarUrl ? (
    <img src={avatarUrl} alt={displayName ?? ""} className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white" />
  ) : (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary ring-2 ring-white">
      {initials}
    </span>
  );
}

export function HouseholdManager({ initialHousehold, currentUserId }: Props) {
  const [household, setHousehold] = useState<Household | null>(initialHousehold);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createHousehold();
      if ("error" in result) { setError(result.error); return; }
      setHousehold(result);
    });
  }

  function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 6) return;
    setError(null);
    startTransition(async () => {
      const result = await joinHousehold(code);
      if ("error" in result) { setError(result.error); return; }
      setHousehold(result);
      setJoinCode("");
    });
  }

  function handleLeave() {
    setError(null);
    startTransition(async () => {
      const result = await leaveHousehold();
      if (result?.error) { setError(result.error); return; }
      setHousehold(null);
      setShowLeaveConfirm(false);
    });
  }

  function handleCopy() {
    if (!household) return;
    navigator.clipboard.writeText(household.inviteCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!household) {
    return (
      <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
        <div className="flex items-center gap-3 px-4 pb-3 pt-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Foyer</p>
            <p className="text-xs text-muted-foreground">Partage de liste de courses</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4 pb-4">
          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Créer un foyer
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-xs text-muted-foreground/60">ou rejoindre</span>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
              placeholder="CODE"
              maxLength={6}
              className="flex-1 rounded-xl border border-border bg-muted/60 px-4 py-3 font-mono text-base font-bold uppercase tracking-[0.25em] outline-none transition placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-muted-foreground/40 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={handleJoin}
              disabled={isPending || joinCode.length < 6}
              className="rounded-xl bg-muted px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-gray-200 active:scale-[0.98] disabled:opacity-40"
            >
              Rejoindre
            </button>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-[0_1px_4px_rgba(28,25,23,0.08)]">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Foyer</p>
            <p className="text-xs text-muted-foreground">
              {household.members.length} membre{household.members.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex -space-x-2">
          {household.members.slice(0, 4).map((m) => (
            <MemberAvatar key={m.userId} displayName={m.displayName} avatarUrl={m.avatarUrl} />
          ))}
        </div>
      </div>

      {household.members.map((member) => (
        <div key={member.userId} className="flex items-center gap-3 px-4 py-3 [&:not(:last-of-type)]:border-b [&:not(:last-of-type)]:border-border/40">
          <MemberAvatar displayName={member.displayName} avatarUrl={member.avatarUrl} />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {member.displayName ?? "Membre"}
            </p>
            {member.userId === currentUserId && (
              <p className="text-xs text-muted-foreground/60">Vous</p>
            )}
          </div>
          {member.userId === household.createdBy && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Admin</span>
          )}
        </div>
      ))}

      <div className="border-t border-border/60 px-4 py-3.5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/60">Code d'invitation</p>
        <button
          type="button"
          onClick={handleCopy}
          className="flex w-full items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3 transition hover:bg-gray-100 active:scale-[0.99]"
        >
          <span className="font-mono text-lg font-black tracking-[0.3em] text-foreground">
            {household.inviteCode}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            {copied ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-green-600">Copié !</span>
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copier
              </>
            )}
          </span>
        </button>
      </div>

      <div className="border-t border-border/60 px-4 py-3">
        {showLeaveConfirm ? (
          <div className="flex items-center gap-2">
            <p className="flex-1 text-xs text-muted-foreground">Quitter le foyer ?</p>
            <button
              type="button"
              onClick={() => setShowLeaveConfirm(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleLeave}
              disabled={isPending}
              className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/20 disabled:opacity-50"
            >
              Confirmer
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowLeaveConfirm(true)}
            className="text-xs font-medium text-muted-foreground/60 transition hover:text-destructive"
          >
            Quitter le foyer
          </button>
        )}
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
