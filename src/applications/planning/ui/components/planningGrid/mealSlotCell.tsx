"use client";

import type { ReactNode } from "react";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react/macro";
import type { MealSlotData, MealType } from "@/applications/planning/domain/entities/planning";
import type { MessageDescriptor } from "@lingui/core";

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="4" />
    <line x1="12" y1="20" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
    <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="4" y2="12" />
    <line x1="20" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
    <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
  </svg>
);

const ForkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <line x1="7" y1="2" x2="7" y2="22" />
    <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h1v5" />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const MEAL_CONFIG: Record<MealType, {
  label: MessageDescriptor;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  labelColor: string;
}> = {
  breakfast: {
    label: msg`Breakfast`,
    icon: <SunIcon />,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    labelColor: "text-amber-500",
  },
  lunch: {
    label: msg`Lunch`,
    icon: <ForkIcon />,
    iconBg: "bg-primary-light",
    iconColor: "text-primary",
    labelColor: "text-primary",
  },
  dinner: {
    label: msg`Dinner`,
    icon: <MoonIcon />,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-500",
    labelColor: "text-violet-500",
  },
};

interface MealSlotCellProps {
  slot: MealSlotData;
  onTap: () => void;
  isPending: boolean;
}

export function MealSlotCell({ slot, onTap, isPending }: MealSlotCellProps) {
  const { t } = useLingui();
  const config = MEAL_CONFIG[slot.mealType];
  const isFilled = !!slot.recipeName;

  return (
    <button
      type="button"
      onClick={onTap}
      disabled={isPending}
      className="flex w-full items-center gap-3.5 px-4 py-4 text-left transition-colors active:bg-black/3 disabled:opacity-50"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition ${
        isFilled ? `${config.iconBg} ${config.iconColor}` : "bg-muted text-muted-foreground/30"
      }`}>
        {config.icon}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={`text-[10px] font-bold uppercase leading-none tracking-[0.14em] ${
          isFilled ? config.labelColor : "text-muted-foreground/50"
        }`}>
          {t(config.label)}
        </span>
        {isFilled ? (
          <span className="truncate text-[15px] font-semibold leading-snug text-foreground">
            {slot.recipeName}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground/30">Ajouter un repas</span>
        )}
      </div>

      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke={isFilled ? "#C8C4BE" : "#D6D3CE"}
        strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round"
      >
        {isFilled ? (
          <polyline points="9 18 15 12 9 6" />
        ) : (
          <>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </>
        )}
      </svg>
    </button>
  );
}
