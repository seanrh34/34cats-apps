"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollToBottomButton } from "@/components/shared/scroll-to-bottom";
import { FlashcatsPracticeComplete } from "@/components/flashcats/practice-complete";
import { FlashcardPractice } from "@/components/flashcats/flashcard-practice";
import { FlashcatsPracticeSetup } from "@/components/flashcats/practice-setup";
import { useAuth } from "@/contexts/auth-context";
import {
  fetchAccessibleDeck,
  fetchUserDeckPreference,
  saveUserDeckPreference,
} from "@/lib/services/flashcats-service";
import {
  FlashcatsDeck,
  FlashcatsPracticeSettings,
} from "@/lib/types/flashcats";
import {
  getDefaultPracticeSettings,
  shuffleFlashcatsCards,
} from "@/lib/flashcats/utils";

interface PracticeSessionState {
  deck: FlashcatsDeck;
  settings: FlashcatsPracticeSettings;
  queue: FlashcatsDeck["cards"];
  completedCount: number;
  totalCount: number;
}

interface CompletedPracticeState {
  deck: FlashcatsDeck;
  settings: FlashcatsPracticeSettings;
  totalCount: number;
}

interface FlashcatsDeckPageCache {
  deck: FlashcatsDeck | null;
  setupSettings: FlashcatsPracticeSettings | null;
  practiceState: PracticeSessionState | null;
  completedState: CompletedPracticeState | null;
  isFlipped: boolean;
}

interface FlashcatsDeckPageClientProps {
  deckId: string;
}

function getMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function getDeckPageCacheKey(deckId: string) {
  return `flashcats:deck-page:${deckId}:v1`;
}

export function FlashcatsDeckPageClient({
  deckId,
}: FlashcatsDeckPageClientProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [deck, setDeck] = useState<FlashcatsDeck | null>(null);
  const [setupSettings, setSetupSettings] = useState<FlashcatsPracticeSettings | null>(
    null
  );
  const [practiceState, setPracticeState] = useState<PracticeSessionState | null>(null);
  const [completedState, setCompletedState] = useState<CompletedPracticeState | null>(
    null
  );
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoadingDeck, setIsLoadingDeck] = useState(true);
  const [isPreparingDeck, setIsPreparingDeck] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [hasRestoredPageCache, setHasRestoredPageCache] = useState(false);

  useLayoutEffect(() => {
    if (typeof window === "undefined") {
      setHasRestoredPageCache(true);
      return;
    }

    const rawCache = window.sessionStorage.getItem(getDeckPageCacheKey(deckId));
    if (!rawCache) {
      setHasRestoredPageCache(true);
      return;
    }

    let cache: FlashcatsDeckPageCache | null = null;

    try {
      cache = JSON.parse(rawCache) as FlashcatsDeckPageCache;
    } catch {
      window.sessionStorage.removeItem(getDeckPageCacheKey(deckId));
    }

    if (!cache) {
      setHasRestoredPageCache(true);
      return;
    }

    setDeck(cache.deck || null);
    setSetupSettings(cache.setupSettings || null);
    setPracticeState(cache.practiceState || null);
    setCompletedState(cache.completedState || null);
    setIsFlipped(Boolean(cache.isFlipped));
    setIsLoadingDeck(false);
    setHasRestoredPageCache(true);
  }, [deckId]);

  const loadDeck = useCallback(async () => {
    setIsPreparingDeck(true);
    setPageError(null);

    try {
      const freshDeck = await fetchAccessibleDeck(deckId);
      if (!freshDeck) {
        throw new Error("That deck is not available or does not exist.");
      }

      const preference = user
        ? await fetchUserDeckPreference(freshDeck.id)
        : null;

      setDeck(freshDeck);
      setSetupSettings(getDefaultPracticeSettings(freshDeck, preference));
    } catch (error) {
      setPageError(getMessage(error, "Failed to load this FlashCats deck."));
      setDeck(null);
    } finally {
      setIsPreparingDeck(false);
      setIsLoadingDeck(false);
    }
  }, [deckId, user]);

  useEffect(() => {
    void loadDeck();
  }, [loadDeck]);

  useEffect(() => {
    if (!hasRestoredPageCache || typeof window === "undefined") {
      return;
    }

    const cache: FlashcatsDeckPageCache = {
      deck,
      setupSettings,
      practiceState,
      completedState,
      isFlipped,
    };

    window.sessionStorage.setItem(
      getDeckPageCacheKey(deckId),
      JSON.stringify(cache)
    );
  }, [
    completedState,
    deck,
    deckId,
    hasRestoredPageCache,
    isFlipped,
    practiceState,
    setupSettings,
  ]);

  const beginPractice = useCallback(
    (activeDeck: FlashcatsDeck, settings: FlashcatsPracticeSettings) => {
      const queue =
        settings.mode === "shuffle"
          ? shuffleFlashcatsCards(activeDeck.cards)
          : [...activeDeck.cards];

      setPracticeState({
        deck: activeDeck,
        settings,
        queue,
        completedCount: 0,
        totalCount: queue.length,
      });
      setCompletedState(null);
      setIsFlipped(false);
    },
    []
  );

  const handlePracticeStart = async (settings: FlashcatsPracticeSettings) => {
    if (!deck) {
      return;
    }

    if (user) {
      await saveUserDeckPreference(deck.id, settings.frontFields, settings.backFields);
    }

    setSetupSettings(settings);
    beginPractice(deck, settings);
  };

  const handleSkip = () => {
    if (!practiceState) {
      return;
    }

    const nextQueue = practiceState.queue.slice(1);
    const nextCompletedCount = practiceState.completedCount + 1;

    if (nextQueue.length === 0) {
      setPracticeState(null);
      setCompletedState({
        deck: practiceState.deck,
        settings: practiceState.settings,
        totalCount: practiceState.totalCount,
      });
      setIsFlipped(false);
      return;
    }

    setPracticeState({
      ...practiceState,
      queue: nextQueue,
      completedCount: nextCompletedCount,
    });
    setIsFlipped(false);
  };

  const handleSaveForLater = () => {
    if (!practiceState || practiceState.queue.length === 0) {
      return;
    }

    const [currentCard, ...remainingCards] = practiceState.queue;
    setPracticeState({
      ...practiceState,
      queue: [...remainingCards, currentCard],
    });
    setIsFlipped(false);
  };

  const handleReturnToSetup = () => {
    setPracticeState(null);
    setCompletedState(null);
    setIsFlipped(false);
  };

  const handleTryAgain = () => {
    if (!completedState) {
      return;
    }

    beginPractice(completedState.deck, completedState.settings);
  };

  const showBlockingLoader =
    !hasRestoredPageCache && authLoading && isLoadingDeck && !deck && !practiceState;
  const showOuterHeader = Boolean(pageError || !deck || completedState || practiceState);

  return (
    <main className="min-h-screen bg-linear-to-b from-[#100d12] via-black to-[#120f14]">
      <div className="container mx-auto max-w-5xl px-4 py-14 md:py-20">
        {showBlockingLoader ? (
          <Card className="border-gray-700 bg-gray-950/60 p-8 text-center">
            <p className="text-lg font-semibold text-white">Loading deck...</p>
            <p className="mt-2 text-sm text-gray-400">
              Pulling this FlashCats deck into place.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {showOuterHeader && (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-[#ff9e91]">
                    FlashCats deck
                  </p>
                  <h1 className="mt-2 text-4xl font-bold text-white">
                    {deck?.title || "Deck not found"}
                  </h1>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="ghost" onClick={() => router.push("/flashcats")}>
                    Back to all decks
                  </Button>
                  {deck && (
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        await navigator.clipboard.writeText(window.location.href);
                      }}
                    >
                      Copy deck link
                    </Button>
                  )}
                </div>
              </div>
            )}

            {(authLoading || isPreparingDeck) && (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
                Refreshing this deck in the background...
              </div>
            )}

            {pageError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {pageError}
              </div>
            )}

            {!pageError && !deck ? (
              <Card className="border-gray-700 bg-gray-950/60 p-8 text-center">
                <p className="text-lg font-semibold text-white">
                  This deck is unavailable.
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  It may be private, deleted, or the link may be incorrect.
                </p>
                <div className="mt-6">
                  <Button onClick={() => router.push("/flashcats")}>
                    Browse decks
                  </Button>
                </div>
              </Card>
            ) : completedState ? (
              <FlashcatsPracticeComplete
                deckTitle={completedState.deck.title}
                totalCards={completedState.totalCount}
                onTryAgain={handleTryAgain}
                onSelectDifferentDeck={() => router.push("/flashcats")}
              />
            ) : practiceState ? (
              <FlashcardPractice
                deck={practiceState.deck}
                currentCard={practiceState.queue[0]}
                settings={practiceState.settings}
                isFlipped={isFlipped}
                remainingCount={practiceState.queue.length}
                completedCount={practiceState.completedCount}
                totalCount={practiceState.totalCount}
                onFlip={() => setIsFlipped((current) => !current)}
                onSkip={handleSkip}
                onSaveForLater={handleSaveForLater}
                onExit={handleReturnToSetup}
                exitLabel="Back to setup"
              />
            ) : (
              deck && (
                <FlashcatsPracticeSetup
                  deck={deck}
                  initialSettings={setupSettings || getDefaultPracticeSettings(deck)}
                  isSignedIn={Boolean(user)}
                  onStart={handlePracticeStart}
                  onBack={() => router.push("/flashcats")}
                  onShare={async () => {
                    await navigator.clipboard.writeText(window.location.href);
                  }}
                />
              )
            )}
          </div>
        )}
      </div>
      <ScrollToBottomButton />
    </main>
  );
}
