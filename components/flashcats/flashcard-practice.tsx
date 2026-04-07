"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[#ff9e91]">
            FlashCats practice
          </p>
          <h2 className="mt-2 text-3xl font-bold text-white">{deck.title}</h2>
        </div>
        <Button variant="ghost" onClick={onExit}>
          {exitLabel}
        </Button>
      </div>

      <Card className="border-[#E84A3A]/20 bg-gray-950/70 p-6 shadow-2xl shadow-black/30">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-400">
              Card {completedCount + 1} of {totalCount}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.3em] text-gray-500">
              {isFlipped ? "Back of card" : "Front of card"}
            </p>
          </div>
          <div className="flex gap-3 text-sm text-gray-400">
            <span>{remainingCount} remaining</span>
            <span>{completedCount} completed</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onFlip}
          className="w-full rounded-[28px] border border-white/10 bg-linear-to-br from-[#1f1614] via-[#18181b] to-[#101012] p-8 text-left shadow-inner transition-transform hover:-translate-y-0.5"
        >
          <div className="space-y-6">
            {activeFields.map((fieldKey) => (
              <div key={`${currentCard.id}-${fieldKey}`}>
                <p className="text-xs uppercase tracking-[0.3em] text-[#ff9e91]">
                  {getFlashcatsFieldLabel(deck, fieldKey)}
                </p>
                <p className="mt-3 text-2xl font-semibold text-white md:text-4xl">
                  {currentCard[fieldKey] || "—"}
                </p>
              </div>
            ))}
          </div>
        </button>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="secondary" onClick={onFlip}>
              {isFlipped ? "Show front" : "Flip card"}
            </Button>
            <Button variant="outline" onClick={onSaveForLater}>
              Save for later
            </Button>
          </div>
          <Button onClick={onSkip}>Skip and complete</Button>
        </div>
      </Card>
    </div>
  );
}
