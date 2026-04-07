"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { ScrollToBottomButton } from "@/components/shared/scroll-to-bottom";
import { useAuth } from "@/contexts/auth-context";
import { FlashcatsDeckEditor } from "@/components/flashcats/deck-editor";
import { FlashcatsDeckList } from "@/components/flashcats/deck-list";
import { FlashcatsPracticeSetup } from "@/components/flashcats/practice-setup";
import { FlashcardPractice } from "@/components/flashcats/flashcard-practice";
import { FlashcatsPracticeComplete } from "@/components/flashcats/practice-complete";
import {
  createFlashcatsDeck,
  deleteFlashcatsDeck,
  ensureFlashcatsUserProfile,
  fetchAccessibleDeck,
  fetchPublicDecks,
  fetchUserDeckPreference,
  fetchUserDecks,
  saveUserDeckPreference,
  updateFlashcatsDeck,
} from "@/lib/services/flashcats-service";
import {
  FlashcatsDeck,
  FlashcatsDeckInput,
  FlashcatsPracticeSettings,
  FlashcatsUserProfile,
} from "@/lib/types/flashcats";
import {
  FLASHCATS_MAX_DECKS_DEFAULT,
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

interface FlashcatsPageCache {
  publicDecks: FlashcatsDeck[];
  userDecks: FlashcatsDeck[];
  userProfile: FlashcatsUserProfile | null;
  isEditorOpen: boolean;
  editingDeck: FlashcatsDeck | null;
  setupDeck: FlashcatsDeck | null;
  setupSettings: FlashcatsPracticeSettings | null;
  practiceState: PracticeSessionState | null;
  completedState: CompletedPracticeState | null;
  isFlipped: boolean;
  updatedAt: string;
}

const FLASHCATS_PAGE_CACHE_STORAGE_KEY = "flashcats:page-cache:v1";

function getMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export default function FlashcatsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [publicDecks, setPublicDecks] = useState<FlashcatsDeck[]>([]);
  const [userDecks, setUserDecks] = useState<FlashcatsDeck[]>([]);
  const [userProfile, setUserProfile] = useState<FlashcatsUserProfile | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [pageNotice, setPageNotice] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<FlashcatsDeck | null>(null);
  const [isSavingDeck, setIsSavingDeck] = useState(false);
  const [setupDeck, setSetupDeck] = useState<FlashcatsDeck | null>(null);
  const [setupSettings, setSetupSettings] = useState<FlashcatsPracticeSettings | null>(
    null
  );
  const [isPreparingPractice, setIsPreparingPractice] = useState(false);
  const [practiceState, setPracticeState] = useState<PracticeSessionState | null>(null);
  const [completedState, setCompletedState] = useState<CompletedPracticeState | null>(
    null
  );
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasRestoredPageCache, setHasRestoredPageCache] = useState(false);

  const readPageCache = (): FlashcatsPageCache | null => {
    if (typeof window === "undefined") {
      return null;
    }

    const rawCache = window.sessionStorage.getItem(FLASHCATS_PAGE_CACHE_STORAGE_KEY);
    if (!rawCache) {
      return null;
    }

    try {
      return JSON.parse(rawCache) as FlashcatsPageCache;
    } catch {
      window.sessionStorage.removeItem(FLASHCATS_PAGE_CACHE_STORAGE_KEY);
      return null;
    }
  };

  useLayoutEffect(() => {
    const cachedState = readPageCache();
    if (!cachedState) {
      setHasRestoredPageCache(true);
      return;
    }

    setPublicDecks(cachedState.publicDecks || []);
    setUserDecks(cachedState.userDecks || []);
    setUserProfile(cachedState.userProfile || null);
    setIsEditorOpen(Boolean(cachedState.isEditorOpen));
    setEditingDeck(cachedState.editingDeck || null);
    setSetupDeck(cachedState.setupDeck || null);
    setSetupSettings(cachedState.setupSettings || null);
    setPracticeState(cachedState.practiceState || null);
    setCompletedState(cachedState.completedState || null);
    setIsFlipped(Boolean(cachedState.isFlipped));
    setIsLoadingData(false);
    setHasRestoredPageCache(true);
  }, []);

  const loadDecks = useCallback(async () => {
    setIsLoadingData(true);
    setPageError(null);

    try {
      const publicDeckPromise = fetchPublicDecks();

      if (user) {
        const [publicData, ownDecks, profile] = await Promise.all([
          publicDeckPromise,
          fetchUserDecks(),
          ensureFlashcatsUserProfile(),
        ]);

        setPublicDecks(publicData);
        setUserDecks(ownDecks);
        setUserProfile(profile);
      } else {
        const publicData = await publicDeckPromise;
        setPublicDecks(publicData);
        setUserDecks([]);
        setUserProfile(null);
      }
    } catch (error) {
      setPageError(getMessage(error, "FlashCats could not load right now."));
    } finally {
      setIsLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    void loadDecks();
  }, [loadDecks]);

  useEffect(() => {
    if (!hasRestoredPageCache || typeof window === "undefined") {
      return;
    }

    const cache: FlashcatsPageCache = {
      publicDecks,
      userDecks,
      userProfile,
      isEditorOpen,
      editingDeck,
      setupDeck,
      setupSettings,
      practiceState,
      completedState,
      isFlipped,
      updatedAt: new Date().toISOString(),
    };

    window.sessionStorage.setItem(
      FLASHCATS_PAGE_CACHE_STORAGE_KEY,
      JSON.stringify(cache)
    );
  }, [
    completedState,
    editingDeck,
    hasRestoredPageCache,
    isEditorOpen,
    isFlipped,
    practiceState,
    publicDecks,
    setupDeck,
    setupSettings,
    userDecks,
    userProfile,
  ]);

  const visiblePublicDecks = useMemo(() => {
    if (!user) {
      return publicDecks;
    }

    return publicDecks.filter((deck) => deck.user_id !== user.id);
  }, [publicDecks, user]);

  const remainingDeckSlots = useMemo(() => {
    if (!userProfile) {
      return null;
    }

    return Math.max(userProfile.max_decks - userDecks.length, 0);
  }, [userDecks.length, userProfile]);

  const beginPractice = useCallback(
    (deck: FlashcatsDeck, settings: FlashcatsPracticeSettings) => {
      const queue =
        settings.mode === "shuffle" ? shuffleFlashcatsCards(deck.cards) : [...deck.cards];

      setPracticeState({
        deck,
        settings,
        queue,
        completedCount: 0,
        totalCount: queue.length,
      });
      setCompletedState(null);
      setSetupDeck(null);
      setSetupSettings(null);
      setIsFlipped(false);
    },
    []
  );

  const handleSaveDeck = async (input: FlashcatsDeckInput) => {
    setIsSavingDeck(true);

    try {
      if (editingDeck) {
        await updateFlashcatsDeck(editingDeck.id, input);
        setPageNotice("Deck updated.");
      } else {
        await createFlashcatsDeck(input);
        setPageNotice("Deck created.");
      }

      setIsEditorOpen(false);
      setEditingDeck(null);
      await loadDecks();
    } finally {
      setIsSavingDeck(false);
    }
  };

  const handleDeleteDeck = async (deck: FlashcatsDeck) => {
    if (!window.confirm(`Delete "${deck.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteFlashcatsDeck(deck.id);
      setPageNotice("Deck deleted.");
      await loadDecks();
    } catch (error) {
      setPageError(getMessage(error, "Failed to delete that deck."));
    }
  };

  const handleStartCreate = () => {
    if (!user) {
      router.push("/login?next=/flashcats");
      return;
    }

    setPageNotice(null);
    setEditingDeck(null);
    setIsEditorOpen(true);
    setSetupDeck(null);
    setSetupSettings(null);
    setPracticeState(null);
    setCompletedState(null);
  };

  const handlePracticeSelect = async (deck: FlashcatsDeck) => {
    setIsPreparingPractice(true);
    setPageError(null);

    try {
      const freshDeck = await fetchAccessibleDeck(deck.id);
      if (!freshDeck) {
        throw new Error("That deck is no longer available.");
      }

      const savedPreference = user
        ? await fetchUserDeckPreference(freshDeck.id)
        : null;

      setSetupDeck(freshDeck);
      setSetupSettings(getDefaultPracticeSettings(freshDeck, savedPreference));
      setPracticeState(null);
      setCompletedState(null);
      setIsEditorOpen(false);
      setEditingDeck(null);
    } catch (error) {
      setPageError(getMessage(error, "Failed to prepare that practice session."));
    } finally {
      setIsPreparingPractice(false);
    }
  };

  const handlePracticeStart = async (settings: FlashcatsPracticeSettings) => {
    if (!setupDeck) {
      return;
    }

    if (user) {
      await saveUserDeckPreference(setupDeck.id, settings.frontFields, settings.backFields);
    }

    beginPractice(setupDeck, settings);
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
    const nextQueue = [...remainingCards, currentCard];

    setPracticeState({
      ...practiceState,
      queue: nextQueue,
    });
    setIsFlipped(false);
  };

  const handleTryAgain = () => {
    if (!completedState) {
      return;
    }

    beginPractice(completedState.deck, completedState.settings);
  };

  const handleResetToDecks = () => {
    setSetupDeck(null);
    setSetupSettings(null);
    setPracticeState(null);
    setCompletedState(null);
    setIsFlipped(false);
  };

  const showBlockingLoader =
    !hasRestoredPageCache &&
    authLoading &&
    isLoadingData &&
    publicDecks.length === 0 &&
    userDecks.length === 0 &&
    !isEditorOpen &&
    !setupDeck &&
    !practiceState &&
    !completedState;

  return (
    <main className="min-h-screen bg-linear-to-b from-[#100d12] via-black to-[#120f14]">
      <div className="container mx-auto max-w-6xl px-4 py-14 md:py-20">
        <PageHeader
          badge={{ text: "Live Beta", variant: "info" }}
          title="FlashCats"
          description="Build custom flashcard decks, practise public ones, and flip through focused sessions with just the fields you want to see."
          className="mb-10"
        />

        {pageNotice && (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {pageNotice}
          </div>
        )}

        {pageError && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {pageError}
          </div>
        )}

        {showBlockingLoader ? (
          <Card className="border-gray-700 bg-gray-950/60 p-8 text-center">
            <p className="text-lg font-semibold text-white">Loading FlashCats...</p>
            <p className="mt-2 text-sm text-gray-400">
              Pulling decks and account settings into place.
            </p>
          </Card>
        ) : completedState ? (
          <FlashcatsPracticeComplete
            deckTitle={completedState.deck.title}
            totalCards={completedState.totalCount}
            onTryAgain={handleTryAgain}
            onSelectDifferentDeck={handleResetToDecks}
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
            onExit={handleResetToDecks}
          />
        ) : setupDeck ? (
          <FlashcatsPracticeSetup
            deck={setupDeck}
            initialSettings={setupSettings || undefined}
            isSignedIn={Boolean(user)}
            onStart={handlePracticeStart}
            onBack={handleResetToDecks}
          />
        ) : (
          <div className="space-y-8">
            {(authLoading || isLoadingData) && (
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
                Refreshing FlashCats in the background...
              </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              <Card className="border-[#E84A3A]/20 bg-linear-to-br from-[#1c1110] via-[#111214] to-[#0f0f10] p-6 shadow-2xl shadow-black/30">
                <p className="text-sm uppercase tracking-[0.3em] text-[#ff9e91]">
                  Quick start
                </p>
                <h2 className="mt-3 text-3xl font-bold text-white">
                  Practise public decks now, then sign in when you want to make your own.
                </h2>
                <p className="mt-4 max-w-2xl text-gray-300">
                  FlashCats keeps v1 intentionally lean: one deck per session, no scorekeeping, and no history to manage.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button onClick={handleStartCreate}>
                    {user ? "Create a deck" : "Login to create decks"}
                  </Button>
                  <Button variant="secondary" onClick={() => window.scrollTo({ top: 720, behavior: "smooth" })}>
                    Browse decks
                  </Button>
                </div>
              </Card>

              <Card className="border-gray-700 bg-gray-950/60 p-6">
                <h3 className="text-xl font-semibold text-white">Deck limits</h3>
                <div className="mt-4 space-y-3 text-sm text-gray-300">
                  <p>Up to 3 decks per user by default.</p>
                  <p>Up to 100 cards per deck.</p>
                  <p>Public decks are visible to everyone.</p>
                  <p>Private decks stay visible only to their owner.</p>
                </div>
                {user && (
                  <p className="mt-4 text-sm text-gray-400">
                    You are using{" "}
                    <span className="font-semibold text-white">
                      {userDecks.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-white">
                      {userProfile?.max_decks || FLASHCATS_MAX_DECKS_DEFAULT}
                    </span>{" "}
                    deck slots.
                  </p>
                )}
              </Card>
            </div>

            {isEditorOpen && (
              <FlashcatsDeckEditor
                initialDeck={editingDeck}
                isSaving={isSavingDeck}
                remainingDeckSlots={remainingDeckSlots}
                onSave={handleSaveDeck}
                onCancel={() => {
                  setIsEditorOpen(false);
                  setEditingDeck(null);
                }}
              />
            )}

            {user ? (
              <div className="space-y-8">
                <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Your decks</h2>
                    <p className="mt-1 text-sm text-gray-400">
                      Create, edit, and practise your own private or public decks.
                    </p>
                  </div>
                  <Button
                    onClick={handleStartCreate}
                    disabled={Boolean(remainingDeckSlots !== null && remainingDeckSlots <= 0)}
                  >
                    Create deck
                  </Button>
                </div>

                <FlashcatsDeckList
                  title="Managed by you"
                  description="These decks belong to your account. Public ones will also appear in the shared library."
                  decks={userDecks}
                  emptyMessage="You have not created any decks yet."
                  onPractice={handlePracticeSelect}
                  onEdit={(deck) => {
                    setEditingDeck(deck);
                    setIsEditorOpen(true);
                    setPageNotice(null);
                  }}
                  onDelete={handleDeleteDeck}
                />
              </div>
            ) : (
              <Card className="border-white/10 bg-white/5 p-6">
                <h2 className="text-2xl font-bold text-white">Want your own decks?</h2>
                <p className="mt-2 max-w-2xl text-sm text-gray-400">
                  Sign in with Google to create private decks, publish public ones, and save your preferred front/back layout per deck.
                </p>
                <div className="mt-5">
                  <Button onClick={() => router.push("/login?next=/flashcats")}>
                    Login to save decks
                  </Button>
                </div>
              </Card>
            )}

            <FlashcatsDeckList
              title="Public deck library"
              description="Available to everyone, even before signing in."
              decks={visiblePublicDecks}
              emptyMessage="No public decks have been published yet."
              onPractice={handlePracticeSelect}
            />

            {isPreparingPractice && (
              <Card className="border-gray-700 bg-gray-950/60 p-5 text-sm text-gray-300">
                Preparing that practice session...
              </Card>
            )}
          </div>
        )}
      </div>
      <ScrollToBottomButton />
    </main>
  );
}
