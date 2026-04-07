"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FlashcatsCard,
  FlashcatsDeck,
  FlashcatsDeckDraft,
  FlashcatsDeckInput,
} from "@/lib/types/flashcats";
import {
  FLASHCATS_CREATE_DRAFT_STORAGE_KEY,
  FLASHCATS_MAX_CARDS,
  buildFieldDefinitionsFromLabels,
  createEmptyFlashcatsDraft,
  createEmptyFlashcatsCard,
  isFlashcatsDraftMeaningful,
  normalizeFlashcatsDraft,
  normalizeFlashcatsCards,
  parseBulkFlashcatsCards,
} from "@/lib/flashcats/utils";

interface FlashcatsDeckEditorProps {
  initialDeck?: FlashcatsDeck | null;
  isSaving: boolean;
  remainingDeckSlots: number | null;
  onSave: (input: FlashcatsDeckInput) => Promise<void>;
  onCancel: () => void;
}

function getInitialLabels(deck?: FlashcatsDeck | null): string[] {
  return [
    deck?.field_definitions.find((field) => field.key === "field_1")?.label || "",
    deck?.field_definitions.find((field) => field.key === "field_2")?.label || "",
    deck?.field_definitions.find((field) => field.key === "field_3")?.label || "",
  ];
}

function getInitialCards(deck?: FlashcatsDeck | null): FlashcatsCard[] {
  if (!deck || deck.cards.length === 0) {
    return [createEmptyFlashcatsCard()];
  }

  return deck.cards.map((card) => ({
    id: card.id,
    field_1: card.field_1 || "",
    field_2: card.field_2 || "",
    field_3: card.field_3 || "",
  }));
}

function getDraftStateFromDeck(deck?: FlashcatsDeck | null): FlashcatsDeckDraft {
  if (!deck) {
    return createEmptyFlashcatsDraft();
  }

  return {
    title: deck.title,
    description: deck.description || "",
    isPublic: deck.is_public,
    fieldLabels: getInitialLabels(deck),
    cards: getInitialCards(deck),
    bulkInput: "",
    updatedAt: new Date().toISOString(),
  };
}

export function FlashcatsDeckEditor({
  initialDeck,
  isSaving,
  remainingDeckSlots,
  onSave,
  onCancel,
}: FlashcatsDeckEditorProps) {
  const [title, setTitle] = useState(initialDeck?.title || "");
  const [description, setDescription] = useState(initialDeck?.description || "");
  const [isPublic, setIsPublic] = useState(initialDeck?.is_public ?? false);
  const [fieldLabels, setFieldLabels] = useState<string[]>(getInitialLabels(initialDeck));
  const [cards, setCards] = useState<FlashcatsCard[]>(getInitialCards(initialDeck));
  const [bulkInput, setBulkInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [hasDraftSaved, setHasDraftSaved] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  const loadSavedDraft = (): FlashcatsDeckDraft | null => {
    if (typeof window === "undefined") {
      return null;
    }

    const rawDraft = window.localStorage.getItem(FLASHCATS_CREATE_DRAFT_STORAGE_KEY);
    if (!rawDraft) {
      return null;
    }

    try {
      return normalizeFlashcatsDraft(JSON.parse(rawDraft));
    } catch {
      window.localStorage.removeItem(FLASHCATS_CREATE_DRAFT_STORAGE_KEY);
      return null;
    }
  };

  useEffect(() => {
    const fallbackState = getDraftStateFromDeck(initialDeck);

    setTitle(fallbackState.title);
    setDescription(fallbackState.description);
    setIsPublic(fallbackState.isPublic);
    setFieldLabels(fallbackState.fieldLabels);
    setCards(fallbackState.cards);
    setBulkInput(fallbackState.bulkInput);
    setErrorMessage(null);
    setDraftRestored(false);

    if (initialDeck) {
      setHasLoadedDraft(false);
      setHasDraftSaved(false);
      return;
    }

    const savedDraft = loadSavedDraft();

    if (savedDraft) {
      setTitle(savedDraft.title);
      setDescription(savedDraft.description);
      setIsPublic(savedDraft.isPublic);
      setFieldLabels(savedDraft.fieldLabels);
      setCards(savedDraft.cards);
      setBulkInput(savedDraft.bulkInput);
      setHasDraftSaved(true);
      setDraftRestored(true);
    } else {
      setHasDraftSaved(false);
    }

    setHasLoadedDraft(true);
  }, [initialDeck]);

  useEffect(() => {
    if (initialDeck || !hasLoadedDraft || typeof window === "undefined") {
      return;
    }

    const draft: FlashcatsDeckDraft = {
      title,
      description,
      isPublic,
      fieldLabels,
      cards,
      bulkInput,
      updatedAt: new Date().toISOString(),
    };

    if (isFlashcatsDraftMeaningful(draft)) {
      window.localStorage.setItem(
        FLASHCATS_CREATE_DRAFT_STORAGE_KEY,
        JSON.stringify(draft)
      );
      setHasDraftSaved(true);
      return;
    }

    window.localStorage.removeItem(FLASHCATS_CREATE_DRAFT_STORAGE_KEY);
    setHasDraftSaved(false);
  }, [
    bulkInput,
    cards,
    description,
    fieldLabels,
    hasLoadedDraft,
    initialDeck,
    isPublic,
    title,
  ]);

  const activeFieldDefinitions = useMemo(() => {
    try {
      return buildFieldDefinitionsFromLabels(fieldLabels);
    } catch {
      return [];
    }
  }, [fieldLabels]);

  const normalizedCards = useMemo(() => {
    if (activeFieldDefinitions.length === 0) {
      return [];
    }

    return normalizeFlashcatsCards(cards, activeFieldDefinitions);
  }, [activeFieldDefinitions, cards]);

  const updateFieldLabel = (index: number, value: string) => {
    setFieldLabels((current) =>
      current.map((label, currentIndex) => (currentIndex === index ? value : label))
    );
  };

  const updateCardValue = (
    cardId: string,
    fieldKey: "field_1" | "field_2" | "field_3",
    value: string
  ) => {
    setCards((current) =>
      current.map((card) => (card.id === cardId ? { ...card, [fieldKey]: value } : card))
    );
  };

  const addCard = () => {
    if (cards.length >= FLASHCATS_MAX_CARDS) {
      setErrorMessage(`A deck can contain at most ${FLASHCATS_MAX_CARDS} cards.`);
      return;
    }

    setCards((current) => [...current, createEmptyFlashcatsCard()]);
  };

  const removeCard = (cardId: string) => {
    setCards((current) => {
      const remaining = current.filter((card) => card.id !== cardId);
      return remaining.length > 0 ? remaining : [createEmptyFlashcatsCard()];
    });
  };

  const importBulkCards = () => {
    try {
      const fieldDefinitions = buildFieldDefinitionsFromLabels(fieldLabels);
      const parsedCards = parseBulkFlashcatsCards(bulkInput, fieldDefinitions);
      const nextCards = [...cards, ...parsedCards];

      if (nextCards.length > FLASHCATS_MAX_CARDS) {
        throw new Error(`A deck can contain at most ${FLASHCATS_MAX_CARDS} cards.`);
      }

      setCards(nextCards);
      setBulkInput("");
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Bulk import failed.");
    }
  };

  const handleSave = async () => {
    try {
      const fieldDefinitions = buildFieldDefinitionsFromLabels(fieldLabels);

      setErrorMessage(null);
      await onSave({
        title,
        description,
        is_public: isPublic,
        field_definitions: fieldDefinitions,
        cards,
      });

      if (isCreateMode && typeof window !== "undefined") {
        window.localStorage.removeItem(FLASHCATS_CREATE_DRAFT_STORAGE_KEY);
        setHasDraftSaved(false);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save deck.");
    }
  };

  const handleDiscardDraft = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(FLASHCATS_CREATE_DRAFT_STORAGE_KEY);
    }

    const emptyDraft = createEmptyFlashcatsDraft();
    setTitle(emptyDraft.title);
    setDescription(emptyDraft.description);
    setIsPublic(emptyDraft.isPublic);
    setFieldLabels(emptyDraft.fieldLabels);
    setCards(emptyDraft.cards);
    setBulkInput(emptyDraft.bulkInput);
    setErrorMessage(null);
    setHasDraftSaved(false);
    setDraftRestored(false);
  };

  const isCreateMode = !initialDeck;

  return (
    <Card className="border-[#E84A3A]/20 bg-gray-950/70 p-6 shadow-2xl shadow-black/30">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {isCreateMode ? "Create a new deck" : `Editing ${initialDeck.title}`}
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Define up to 3 shared fields, then add up to 100 cards.
          </p>
          {isCreateMode && (
            <p className="mt-2 text-xs text-gray-500">
              Drafts save automatically in this browser and restore after refresh.
            </p>
          )}
        </div>
        {isCreateMode && (
          <div className="flex flex-col items-start gap-2 sm:items-end">
            {remainingDeckSlots !== null && (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                {remainingDeckSlots} deck slot{remainingDeckSlots === 1 ? "" : "s"} left
              </span>
            )}
            {hasDraftSaved && (
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="text-xs font-medium text-gray-400 transition-colors hover:text-white"
              >
                Discard local draft
              </button>
            )}
          </div>
        )}
      </div>

      {isCreateMode && draftRestored && (
        <div className="mb-6 rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">
          Your saved draft was restored from this browser.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Deck title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Chinese Characters 101"
        />
        <div className="rounded-xl border border-gray-700 bg-gray-900/60 px-4 py-3">
          <p className="text-sm font-medium text-gray-200">Visibility</p>
          <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) => setIsPublic(event.target.checked)}
              className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-[#E84A3A] focus:ring-[#E84A3A]"
            />
            Make this deck public so everyone can practise it
          </label>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-gray-200">
          Description
        </label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#E84A3A]"
          placeholder="What should people learn from this deck?"
        />
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-white">Deck fields</h3>
        <p className="mt-1 text-sm text-gray-400">
          Fill these from left to right. Example: Hanzi, Pinyin, English.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Input
            label="Field 1"
            value={fieldLabels[0]}
            onChange={(event) => updateFieldLabel(0, event.target.value)}
            placeholder="Hanzi"
          />
          <Input
            label="Field 2"
            value={fieldLabels[1]}
            onChange={(event) => updateFieldLabel(1, event.target.value)}
            placeholder="Pinyin"
          />
          <Input
            label="Field 3"
            value={fieldLabels[2]}
            onChange={(event) => updateFieldLabel(2, event.target.value)}
            placeholder="English"
          />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Cards</h3>
            <p className="mt-1 text-sm text-gray-400">
              {normalizedCards.length} saved card
              {normalizedCards.length === 1 ? "" : "s"} ready for this deck
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={addCard}>
            Add card
          </Button>
        </div>

        {activeFieldDefinitions.length === 0 ? (
          <Card className="mt-4 border-dashed border-gray-700 bg-gray-900/40 p-4">
            <p className="text-sm text-gray-400">
              Add at least one field label before entering cards.
            </p>
          </Card>
        ) : (
          <div className="mt-4 space-y-3">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className="rounded-xl border border-gray-700 bg-gray-900/50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-200">Card {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeCard(card.id)}
                    className="text-xs font-medium text-gray-400 transition-colors hover:text-white"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {activeFieldDefinitions.map((field) => (
                    <Input
                      key={`${card.id}-${field.key}`}
                      label={field.label}
                      value={card[field.key] || ""}
                      onChange={(event) =>
                        updateCardValue(card.id, field.key, event.target.value)
                      }
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-white">Bulk paste import</h3>
        <p className="mt-1 text-sm text-gray-400">
          Paste one card per line using tabs between columns, in the same order as your field labels.
        </p>
        <textarea
          value={bulkInput}
          onChange={(event) => setBulkInput(event.target.value)}
          rows={6}
          className="mt-4 w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 font-mono text-sm text-white placeholder:text-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#E84A3A]"
          placeholder={"hanzi\tpinyin\tmeaning\n你好\tni hao\thello"}
        />
        <div className="mt-3 flex justify-end">
          <Button variant="secondary" size="sm" onClick={importBulkCards}>
            Import pasted cards
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} isLoading={isSaving}>
          {isCreateMode ? "Create deck" : "Save changes"}
        </Button>
      </div>
    </Card>
  );
}
