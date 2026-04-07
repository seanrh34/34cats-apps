"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FlashcatsDeck,
  FlashcatsPracticeMode,
  FlashcatsPracticeSettings,
} from "@/lib/types/flashcats";
import {
  getDefaultPracticeSettings,
  getFlashcatsFieldLabel,
  normalizePreferenceFields,
} from "@/lib/flashcats/utils";

interface FlashcatsPracticeSetupProps {
  deck: FlashcatsDeck;
  initialSettings?: FlashcatsPracticeSettings;
  isSignedIn: boolean;
  onStart: (settings: FlashcatsPracticeSettings) => Promise<void>;
  onBack: () => void;
}

export function FlashcatsPracticeSetup({
  deck,
  initialSettings,
  isSignedIn,
  onStart,
  onBack,
}: FlashcatsPracticeSetupProps) {
  const defaults = initialSettings || getDefaultPracticeSettings(deck);
  const [frontFields, setFrontFields] = useState(defaults.frontFields);
  const [backFields, setBackFields] = useState(defaults.backFields);
  const [mode, setMode] = useState<FlashcatsPracticeMode>(defaults.mode);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleSelection = (
    current: typeof frontFields,
    key: (typeof frontFields)[number]
  ) => {
    if (current.includes(key)) {
      return current.filter((value) => value !== key);
    }

    return [...current, key];
  };

  const handleStart = async () => {
    const allowedKeys = deck.field_definitions.map((field) => field.key);
    const normalizedFront = normalizePreferenceFields(frontFields, allowedKeys, []);
    const normalizedBack = normalizePreferenceFields(backFields, allowedKeys, []);

    if (normalizedFront.length === 0 || normalizedBack.length === 0) {
      setErrorMessage("Choose at least one field for both the front and back.");
      return;
    }

    setErrorMessage(null);
    setIsStarting(true);

    try {
      await onStart({
        frontFields: normalizedFront,
        backFields: normalizedBack,
        mode,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to start practice.");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Card className="border-[#E84A3A]/20 bg-gray-950/70 p-6 shadow-2xl shadow-black/30">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">{deck.title}</h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-400">
            {deck.description || "Pick what to show on each side before you start practising."}
          </p>
        </div>
        <Button variant="ghost" onClick={onBack}>
          Back to decks
        </Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-700 bg-gray-900/50 p-5">
          <h3 className="text-lg font-semibold text-white">Front of card</h3>
          <p className="mt-1 text-sm text-gray-400">
            Choose one or more fields to show before the flip.
          </p>
          <div className="mt-4 space-y-3">
            {deck.field_definitions.map((field) => (
              <label
                key={`front-${field.key}`}
                className="flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-950/50 px-4 py-3 text-sm text-gray-200"
              >
                <input
                  type="checkbox"
                  checked={frontFields.includes(field.key)}
                  onChange={() => setFrontFields((current) => toggleSelection(current, field.key))}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-[#E84A3A] focus:ring-[#E84A3A]"
                />
                {field.label}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-700 bg-gray-900/50 p-5">
          <h3 className="text-lg font-semibold text-white">Back of card</h3>
          <p className="mt-1 text-sm text-gray-400">
            Choose what appears after the card is flipped.
          </p>
          <div className="mt-4 space-y-3">
            {deck.field_definitions.map((field) => (
              <label
                key={`back-${field.key}`}
                className="flex items-center gap-3 rounded-xl border border-gray-700 bg-gray-950/50 px-4 py-3 text-sm text-gray-200"
              >
                <input
                  type="checkbox"
                  checked={backFields.includes(field.key)}
                  onChange={() => setBackFields((current) => toggleSelection(current, field.key))}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-[#E84A3A] focus:ring-[#E84A3A]"
                />
                {field.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-gray-700 bg-gray-900/50 p-5">
          <h3 className="text-lg font-semibold text-white">Practice mode</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("sequential")}
              className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                mode === "sequential"
                  ? "border-[#E84A3A] bg-[#E84A3A]/10 text-white"
                  : "border-gray-700 bg-gray-950/50 text-gray-300 hover:border-gray-500"
              }`}
            >
              <p className="font-semibold">Start to end</p>
              <p className="mt-1 text-sm text-gray-400">
                Keep the deck in its saved order.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setMode("shuffle")}
              className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                mode === "shuffle"
                  ? "border-[#E84A3A] bg-[#E84A3A]/10 text-white"
                  : "border-gray-700 bg-gray-950/50 text-gray-300 hover:border-gray-500"
              }`}
            >
              <p className="font-semibold">Shuffle</p>
              <p className="mt-1 text-sm text-gray-400">
                Randomize the order once at the start.
              </p>
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-700 bg-gray-900/50 p-5">
          <h3 className="text-lg font-semibold text-white">Session summary</h3>
          <div className="mt-4 space-y-3 text-sm text-gray-300">
            <p>
              <span className="font-semibold text-white">{deck.card_count}</span>{" "}
              cards ready to practise
            </p>
            <p>
              Front:{" "}
              {frontFields.length > 0
                ? frontFields.map((field) => getFlashcatsFieldLabel(deck, field)).join(", ")
                : "None selected"}
            </p>
            <p>
              Back:{" "}
              {backFields.length > 0
                ? backFields.map((field) => getFlashcatsFieldLabel(deck, field)).join(", ")
                : "None selected"}
            </p>
            <p className="text-xs text-gray-500">
              {isSignedIn
                ? "Your front/back layout will be saved for this deck."
                : "Guest sessions use this layout only for the current practice run."}
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onBack}>
          Cancel
        </Button>
        <Button
          onClick={handleStart}
          isLoading={isStarting}
          disabled={deck.card_count === 0}
        >
          Start practice
        </Button>
      </div>
    </Card>
  );
}
