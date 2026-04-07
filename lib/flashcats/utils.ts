import {
  FLASHCATS_FIELD_KEYS,
  FlashcatsCard,
  FlashcatsDeck,
  FlashcatsDeckDraft,
  FlashcatsDeckInput,
  FlashcatsFieldDefinition,
  FlashcatsFieldKey,
  FlashcatsPracticeSettings,
  FlashcatsUserDeckPreference,
} from "@/lib/types/flashcats";

export const FLASHCATS_MAX_DECKS_DEFAULT = 3;
export const FLASHCATS_MAX_FIELDS = 3;
export const FLASHCATS_MAX_CARDS = 100;
export const FLASHCATS_CREATE_DRAFT_STORAGE_KEY = "flashcats:create-draft:v1";

export function createEmptyFlashcatsCard(): FlashcatsCard {
  return {
    id: crypto.randomUUID(),
    field_1: "",
    field_2: "",
    field_3: "",
  };
}

export function buildFieldDefinitionsFromLabels(
  labels: string[]
): FlashcatsFieldDefinition[] {
  const trimmed = FLASHCATS_FIELD_KEYS.map((key, index) => ({
    key,
    label: (labels[index] || "").trim(),
  }));

  const firstBlankIndex = trimmed.findIndex((field) => !field.label);
  if (firstBlankIndex !== -1) {
    const hasLabelAfterBlank = trimmed
      .slice(firstBlankIndex + 1)
      .some((field) => field.label);

    if (hasLabelAfterBlank) {
      throw new Error("Field labels must be filled from left to right with no gaps.");
    }
  }

  const definitions = trimmed.filter((field) => field.label);

  if (definitions.length === 0) {
    throw new Error("Add at least one field label for this deck.");
  }

  if (definitions.length > FLASHCATS_MAX_FIELDS) {
    throw new Error(`A deck can have at most ${FLASHCATS_MAX_FIELDS} fields.`);
  }

  const uniqueLabels = new Set(definitions.map((field) => field.label.toLowerCase()));
  if (uniqueLabels.size !== definitions.length) {
    throw new Error("Field labels must be unique.");
  }

  return definitions;
}

export function normalizeFlashcatsCards(
  cards: FlashcatsCard[],
  fieldDefinitions: FlashcatsFieldDefinition[]
): FlashcatsCard[] {
  const activeKeys = new Set(fieldDefinitions.map((field) => field.key));

  return cards
    .map((card) => {
      const normalized: FlashcatsCard = {
        id: card.id || crypto.randomUUID(),
      };

      for (const key of FLASHCATS_FIELD_KEYS) {
        if (activeKeys.has(key)) {
          normalized[key] = (card[key] || "").trim();
        }
      }

      return normalized;
    })
    .filter((card) =>
      fieldDefinitions.some((field) => (card[field.key] || "").length > 0)
    );
}

export function parseBulkFlashcatsCards(
  bulkInput: string,
  fieldDefinitions: FlashcatsFieldDefinition[]
): FlashcatsCard[] {
  const trimmed = bulkInput.trim();

  if (!trimmed) {
    return [];
  }

  return trimmed
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line, index) => {
      const columns = line.split("\t");

      if (columns.length !== fieldDefinitions.length) {
        throw new Error(
          `Line ${index + 1} must contain exactly ${fieldDefinitions.length} tab-separated values.`
        );
      }

      const card = createEmptyFlashcatsCard();
      fieldDefinitions.forEach((field, fieldIndex) => {
        card[field.key] = columns[fieldIndex].trim();
      });

      return card;
    });
}

export function validateFlashcatsDeckInput(
  input: FlashcatsDeckInput
): FlashcatsDeckInput {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Deck title is required.");
  }

  const fieldDefinitions = input.field_definitions.map((field) => ({
    key: field.key,
    label: field.label.trim(),
  }));

  if (fieldDefinitions.length === 0) {
    throw new Error("Add at least one field label for this deck.");
  }

  const cards = normalizeFlashcatsCards(input.cards, fieldDefinitions);
  if (cards.length > FLASHCATS_MAX_CARDS) {
    throw new Error(`A deck can contain at most ${FLASHCATS_MAX_CARDS} cards.`);
  }

  return {
    title,
    description: input.description.trim(),
    is_public: input.is_public,
    field_definitions: fieldDefinitions,
    cards,
  };
}

export function getDefaultPracticeSettings(
  deck: FlashcatsDeck,
  preference?: FlashcatsUserDeckPreference | null
): FlashcatsPracticeSettings {
  const deckFields = deck.field_definitions.map((field) => field.key);
  const frontFields = normalizePreferenceFields(
    preference?.front_fields || [deck.field_definitions[0]?.key],
    deckFields,
    [deck.field_definitions[0]?.key].filter(Boolean) as FlashcatsFieldKey[]
  );
  const backFields = normalizePreferenceFields(
    preference?.back_fields || deckFields,
    deckFields,
    deckFields
  );

  return {
    frontFields,
    backFields,
    mode: "sequential",
  };
}

export function normalizePreferenceFields(
  values: FlashcatsFieldKey[],
  allowedFields: FlashcatsFieldKey[],
  fallback: FlashcatsFieldKey[]
): FlashcatsFieldKey[] {
  const deduped = Array.from(
    new Set(values.filter((value) => allowedFields.includes(value)))
  );

  if (deduped.length > 0) {
    return deduped;
  }

  return fallback;
}

export function shuffleFlashcatsCards(cards: FlashcatsCard[]): FlashcatsCard[] {
  const shuffled = [...cards];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function getFlashcatsFieldLabel(
  deck: FlashcatsDeck,
  key: FlashcatsFieldKey
): string {
  return deck.field_definitions.find((field) => field.key === key)?.label || key;
}

export function createEmptyFlashcatsDraft(): FlashcatsDeckDraft {
  return {
    title: "",
    description: "",
    isPublic: false,
    fieldLabels: ["", "", ""],
    cards: [createEmptyFlashcatsCard()],
    bulkInput: "",
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeFlashcatsDraft(
  value: unknown
): FlashcatsDeckDraft | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const draft = value as Partial<FlashcatsDeckDraft>;
  const rawLabels = Array.isArray(draft.fieldLabels) ? draft.fieldLabels : [];
  const fieldLabels = FLASHCATS_FIELD_KEYS.map((_, index) => {
    const label = rawLabels[index];
    return typeof label === "string" ? label : "";
  });

  const rawCards = Array.isArray(draft.cards) ? draft.cards : [];
  const cards = rawCards
    .filter((card) => card && typeof card === "object")
    .map((card) => {
      const flashcard = card as Partial<FlashcatsCard>;
      return {
        id:
          typeof flashcard.id === "string" && flashcard.id.length > 0
            ? flashcard.id
            : crypto.randomUUID(),
        field_1: typeof flashcard.field_1 === "string" ? flashcard.field_1 : "",
        field_2: typeof flashcard.field_2 === "string" ? flashcard.field_2 : "",
        field_3: typeof flashcard.field_3 === "string" ? flashcard.field_3 : "",
      };
    })
    .slice(0, FLASHCATS_MAX_CARDS);

  return {
    title: typeof draft.title === "string" ? draft.title : "",
    description: typeof draft.description === "string" ? draft.description : "",
    isPublic: Boolean(draft.isPublic),
    fieldLabels,
    cards: cards.length > 0 ? cards : [createEmptyFlashcatsCard()],
    bulkInput: typeof draft.bulkInput === "string" ? draft.bulkInput : "",
    updatedAt:
      typeof draft.updatedAt === "string"
        ? draft.updatedAt
        : new Date().toISOString(),
  };
}

export function isFlashcatsDraftMeaningful(draft: FlashcatsDeckDraft): boolean {
  if (draft.title.trim().length > 0) {
    return true;
  }

  if (draft.description.trim().length > 0) {
    return true;
  }

  if (draft.isPublic) {
    return true;
  }

  if (draft.fieldLabels.some((label) => label.trim().length > 0)) {
    return true;
  }

  if (draft.bulkInput.trim().length > 0) {
    return true;
  }

  return draft.cards.some((card) =>
    FLASHCATS_FIELD_KEYS.some((key) => (card[key] || "").trim().length > 0)
  );
}
