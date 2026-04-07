export const FLASHCATS_FIELD_KEYS = ["field_1", "field_2", "field_3"] as const;

export type FlashcatsFieldKey = (typeof FLASHCATS_FIELD_KEYS)[number];

export interface FlashcatsFieldDefinition {
  key: FlashcatsFieldKey;
  label: string;
}

export interface FlashcatsCard {
  id: string;
  field_1?: string;
  field_2?: string;
  field_3?: string;
}

export interface FlashcatsDeck {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  field_definitions: FlashcatsFieldDefinition[];
  cards: FlashcatsCard[];
  card_count: number;
  created_at: string;
  updated_at: string;
}

export interface FlashcatsDeckInput {
  title: string;
  description: string;
  is_public: boolean;
  field_definitions: FlashcatsFieldDefinition[];
  cards: FlashcatsCard[];
}

export interface FlashcatsDeckDraft {
  title: string;
  description: string;
  isPublic: boolean;
  fieldLabels: string[];
  cards: FlashcatsCard[];
  bulkInput: string;
  updatedAt: string;
}

export interface FlashcatsUserProfile {
  user_id: string;
  max_decks: number;
  created_at: string;
  updated_at: string;
}

export type FlashcatsPracticeMode = "sequential" | "shuffle";

export interface FlashcatsPracticeSettings {
  frontFields: FlashcatsFieldKey[];
  backFields: FlashcatsFieldKey[];
  mode: FlashcatsPracticeMode;
}

export interface FlashcatsUserDeckPreference {
  user_id: string;
  deck_id: string;
  front_fields: FlashcatsFieldKey[];
  back_fields: FlashcatsFieldKey[];
  updated_at: string;
}
