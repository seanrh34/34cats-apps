"use client";

import { useEffect } from "react";
import {
  FlashcatsCard,
  FlashcatsDeck,
  FlashcatsPracticeSettings,
} from "@/lib/types/flashcats";
import { getFlashcatsFieldLabel } from "@/lib/flashcats/utils";

interface FlashcardPracticeProps {
  deck: FlashcatsDeck;
  currentCard: FlashcatsCard;
  settings: FlashcatsPracticeSettings;
  isFlipped: boolean;
  remainingCount: number;
  completedCount: number;
  totalCount: number;
  onFlip: () => void;
  onSkip: () => void;
  onSaveForLater: () => void;
  onExit: () => void;
  exitLabel?: string;
}

function KeyboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M7 10h.01M10 10h.01M13 10h.01M16 10h.01M8 14h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
      <path
        d="m5 12 5 5L20 7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

const FLASHCATS_FIXED_CARD_HEIGHT_CLASS = "h-[clamp(28rem,72vh,48rem)]";

export function FlashcardPractice({
  deck,
  currentCard,
  settings,
  isFlipped,
  remainingCount,
  completedCount,
  totalCount,
  onFlip,
  onSkip,
  onSaveForLater,
  onExit,
  exitLabel = "Select a different deck",
}: FlashcardPracticeProps) {
  const activeFields = isFlipped ? settings.backFields : settings.frontFields;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") {
        return;
      }

      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        Boolean(target?.closest("button"));

      if (isTypingTarget) {
        return;
      }

      event.preventDefault();
      onFlip();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onFlip]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[#ff9e91]">
            FlashCats practice
          </p>
          <h2 className="mt-2 text-3xl font-bold text-white">{deck.title}</h2>
          <p className="mt-3 text-sm text-gray-400">
            {isFlipped ? "Back of card" : "Front of card"} with {remainingCount} remaining and{" "}
            {completedCount} completed.
          </p>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10"
        >
          {exitLabel}
        </button>
      </div>

      <div className="w-full">
        <button
          type="button"
          onClick={onFlip}
          className={`relative flex w-full flex-col rounded-[28px] border border-[#E84A3A]/20 bg-linear-to-br from-[#2c1815] via-[#1f1514] to-[#151214] p-6 text-left shadow-2xl shadow-black/30 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_30px_80px_rgba(232,74,58,0.12)] md:p-8 ${FLASHCATS_FIXED_CARD_HEIGHT_CLASS}`}
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-[#ff9e91]">
              {isFlipped ? "Back preview" : "Front preview"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
              Card {completedCount + 1} / {totalCount}
            </span>
          </div>

          <div className="flex flex-1 items-center justify-center py-6">
            <div className="w-full max-w-3xl space-y-5 px-2 text-center">
            {activeFields.map((fieldKey) => (
              <div key={`${currentCard.id}-${fieldKey}`}>
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#ff9e91] md:text-xs">
                  {getFlashcatsFieldLabel(deck, fieldKey)}
                </p>
                <p className="mt-3 break-words text-[clamp(1.25rem,3vw,2.75rem)] font-semibold leading-tight text-white">
                  {currentCard[fieldKey] || "—"}
                </p>
              </div>
            ))}
            </div>
          </div>

        </button>
      </div>

      <div className="rounded-2xl bg-[#ffb3aa] px-4 py-3 text-[#2b140f] shadow-lg shadow-[#E84A3A]/10">
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium md:text-base">
          <KeyboardIcon />
          <span>Shortcut</span>
          <span className="flex flex-wrap items-center justify-center gap-1.5 text-[#2b140f]/80">
            Press
            <kbd className="rounded-md border border-[#2b140f]/10 bg-white px-2.5 py-0.5 font-semibold text-[#2b140f] shadow-sm">
              Space
            </kbd>
            or click the card to flip
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="hidden md:block md:w-1/3" />

        <div className="flex items-center justify-center gap-6 md:w-1/3">
          <button
            type="button"
            onClick={onSaveForLater}
            className="group flex h-16 w-16 items-center justify-center rounded-full bg-[#271615] transition-colors hover:bg-[#3a1d19] cursor-pointer"
            aria-label="Save for later"
          >
            <span className="text-[#ef4444] transition-transform group-hover:scale-110">
              <XIcon />
            </span>
          </button>
          <span className="select-none text-lg font-bold tracking-[0.2em] text-[#ffe3df] md:text-xl">
            {completedCount + 1} / {totalCount}
          </span>
          <button
            type="button"
            onClick={onSkip}
            className="group flex h-16 w-16 items-center justify-center rounded-full bg-[#271615] transition-colors hover:bg-[#3a1d19] cursor-pointer"
            aria-label="Skip and complete"
          >
            <span className="text-[#22c55e] transition-transform group-hover:scale-110">
              <CheckIcon />
            </span>
          </button>
        </div>

        <div className="hidden md:block md:w-1/3" />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 border-t border-[#2d1a17] pt-8">
        <button
          type="button"
          onClick={onFlip}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10"
        >
          {isFlipped ? "Show front" : "Flip card"}
        </button>
        <div className="rounded-full border border-[#E84A3A]/14 bg-[#1a1415] px-4 py-2 text-sm text-gray-300">
          {remainingCount} remaining
        </div>
        <div className="rounded-full border border-[#E84A3A]/14 bg-[#1a1415] px-4 py-2 text-sm text-gray-300">
          {completedCount} completed
        </div>
      </div>
    </div>
  );
}
