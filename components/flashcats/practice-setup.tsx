"use client";

import { useEffect, useState } from "react";
import {
  FlashcatsCard,
  FlashcatsDeck,
  FlashcatsPracticeMode,
  FlashcatsPracticeSettings,
} from "@/lib/types/flashcats";
import {
  getFlashcatsFieldLabel,
  normalizePreferenceFields,
} from "@/lib/flashcats/utils";

interface FlashcatsPracticeSetupProps {
  deck: FlashcatsDeck;
  initialSettings: FlashcatsPracticeSettings;
  isSignedIn: boolean;
  onStart: (settings: FlashcatsPracticeSettings) => Promise<void>;
  onBack: () => void;
  onShare?: () => Promise<void> | void;
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 16V4m0 0l-4 4m4-4l4 4M6 14v4a2 2 0 002 2h8a2 2 0 002-2v-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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

function renderPreviewText(
  card: FlashcatsCard | null,
  fieldKeys: FlashcatsPracticeSettings["frontFields"],
  deck: FlashcatsDeck
) {
  if (!card) {
    return [{ label: "Preview", value: "This deck has no cards yet." }];
  }

  return fieldKeys.map((fieldKey) => ({
    label: getFlashcatsFieldLabel(deck, fieldKey),
    value: card[fieldKey] || "—",
  }));
}

const FLASHCATS_FIXED_CARD_HEIGHT_CLASS = "h-[clamp(28rem,72vh,48rem)]";

export function FlashcatsPracticeSetup({
  deck,
  initialSettings,
  isSignedIn,
  onStart,
  onBack,
  onShare,
}: FlashcatsPracticeSetupProps) {
  const [frontFields, setFrontFields] = useState(initialSettings.frontFields);
  const [backFields, setBackFields] = useState(initialSettings.backFields);
  const [mode, setMode] = useState<FlashcatsPracticeMode>(initialSettings.mode);
  const [isStarting, setIsStarting] = useState(false);
  const [isPreviewFlipped, setIsPreviewFlipped] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setFrontFields(initialSettings.frontFields);
    setBackFields(initialSettings.backFields);
    setMode(initialSettings.mode);
  }, [initialSettings]);

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
      setIsPreviewFlipped((current) => !current);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const handleShare = async () => {
    if (!onShare) {
      return;
    }

    await onShare();
  };

  const previewContent = renderPreviewText(
    deck.cards[0] || null,
    isPreviewFlipped ? backFields : frontFields,
    deck
  );

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
          {deck.title}
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="rounded-full border border-[#E84A3A]/20 bg-[#271615] px-4 py-2 text-sm font-medium text-[#ffb3aa] transition-colors hover:bg-[#3a1d19] cursor-pointer"
            aria-label="Copy deck link"
          >
            <span className="flex items-center gap-2">
              <ShareIcon />
              Copy deck link
            </span>
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10 cursor-pointer"
          >
            Back to decks
          </button>
        </div>
      </header>

      <div className="w-full">
        <button
          type="button"
          onClick={() => setIsPreviewFlipped((current) => !current)}
          className={`relative flex w-full flex-col rounded-[28px] border border-[#E84A3A]/20 bg-linear-to-br from-[#2c1815] via-[#1f1514] to-[#151214] p-6 text-left shadow-2xl shadow-black/30 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-[0_30px_80px_rgba(232,74,58,0.12)] md:p-8 ${FLASHCATS_FIXED_CARD_HEIGHT_CLASS}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-[#ff9e91]">
              {isPreviewFlipped ? "Back preview" : "Front preview"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
              {deck.card_count} card{deck.card_count === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex flex-1 items-center justify-center py-6">
            <div className="w-full max-w-3xl space-y-5 px-2 text-center">
              {previewContent.map((item, index) => (
                <div key={`${item.label}-${index}`} className="space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#ff9e91] md:text-xs">
                    {item.label}
                  </p>
                  <p className="break-words text-[clamp(1.25rem,3vw,2.75rem)] font-semibold tracking-wide leading-tight text-white">
                    {item.value}
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
            or click the card to flip the preview
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="hidden md:block md:w-1/3" />

        <div className="flex items-center justify-center gap-6 md:w-1/3">
          <button
            type="button"
            onClick={handleStart}
            className="group flex h-16 w-16 items-center justify-center rounded-full bg-[#271615] transition-colors hover:bg-[#3a1d19] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Start practice"
            disabled={isStarting || deck.card_count === 0}
          >
            <span className="text-[#ef4444] transition-transform group-hover:scale-110">
              <XIcon />
            </span>
          </button>
          <span className="select-none text-lg font-bold tracking-[0.2em] text-[#ffe3df] md:text-xl">
            1 / {Math.max(deck.card_count, 1)}
          </span>
          <button
            type="button"
            onClick={onBack}
            className="group flex h-16 w-16 items-center justify-center rounded-full bg-[#271615] transition-colors hover:bg-[#3a1d19] cursor-pointer"
            aria-label="Back to all decks"
          >
            <span className="text-[#22c55e] transition-transform group-hover:scale-110">
              <CheckIcon />
            </span>
          </button>
        </div>

        <div className="hidden md:block md:w-1/3" />
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      <hr className="border-[#2d1a17]" />

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white">Choose your card sides</h3>
            <p className="mt-2 text-sm text-gray-400">
              Mix and match fields exactly the way you want to study them.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#ff9e91]">
                Front
              </p>
              {deck.field_definitions.map((field) => (
                <label
                  key={`front-${field.key}`}
                  className="flex items-center gap-3 rounded-2xl border border-[#E84A3A]/14 bg-[#1a1415] px-4 py-3 text-sm text-gray-200 transition-colors hover:border-[#E84A3A]/28"
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

            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#ff9e91]">
                Back
              </p>
              {deck.field_definitions.map((field) => (
                <label
                  key={`back-${field.key}`}
                  className="flex items-center gap-3 rounded-2xl border border-[#E84A3A]/14 bg-[#1a1415] px-4 py-3 text-sm text-gray-200 transition-colors hover:border-[#E84A3A]/28"
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
        </section>

        <section className="space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white">Session settings</h3>
            <p className="mt-2 text-sm text-gray-400">
              Pick your flow, then launch straight into the deck.
            </p>
          </div>

          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => setMode("sequential")}
              className={`rounded-2xl border px-5 py-4 text-left transition-colors ${
                mode === "sequential"
                  ? "border-[#E84A3A] bg-[#2f1715] text-white"
                  : "border-[#E84A3A]/14 bg-[#1a1415] text-gray-300 hover:border-[#E84A3A]/30"
              }`}
            >
              <p className="font-semibold">Start to end</p>
              <p className="mt-1 text-sm text-gray-400">
                Practise the deck in the saved order.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setMode("shuffle")}
              className={`rounded-2xl border px-5 py-4 text-left transition-colors ${
                mode === "shuffle"
                  ? "border-[#E84A3A] bg-[#2f1715] text-white"
                  : "border-[#E84A3A]/14 bg-[#1a1415] text-gray-300 hover:border-[#E84A3A]/30"
              }`}
            >
              <p className="font-semibold">Shuffle</p>
              <p className="mt-1 text-sm text-gray-400">
                Randomize once when the session starts.
              </p>
            </button>
          </div>

          <div className="rounded-2xl border border-[#E84A3A]/14 bg-[#1a1415] p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#ff9e91]">
              Session summary
            </p>
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
        </section>
      </div>

      <div className="flex items-center gap-4 border-t border-[#2d1a17] pt-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#E84A3A]/20 bg-[#2a1714] text-lg font-bold text-[#ffb3aa]">
          FC
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-500">Deck status</span>
          <span className="text-lg font-bold text-white">
            {deck.is_public ? "Shareable with anyone" : "Visible only to you"}
          </span>
          <span className="mt-0.5 text-sm font-semibold text-gray-500">
            Created {new Date(deck.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
