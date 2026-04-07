import { createClient } from "@/lib/supabase/client";
import {
  FlashcatsDeck,
  FlashcatsDeckInput,
  FlashcatsFieldKey,
  FlashcatsUserDeckPreference,
  FlashcatsUserProfile,
} from "@/lib/types/flashcats";
import { validateFlashcatsDeckInput } from "@/lib/flashcats/utils";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function fetchPublicDecks(): Promise<FlashcatsDeck[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("flashcats_decks")
    .select("*")
    .eq("is_public", true)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(getErrorMessage(error, "Failed to load public decks."));
  }

  return data || [];
}

export async function fetchUserDecks(): Promise<FlashcatsDeck[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to view your decks.");
  }

  const { data, error } = await supabase
    .from("flashcats_decks")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(getErrorMessage(error, "Failed to load your decks."));
  }

  return data || [];
}

export async function fetchAccessibleDeck(
  deckId: string
): Promise<FlashcatsDeck | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase.from("flashcats_decks").select("*").eq("id", deckId);

  if (user) {
    query = query.or(`is_public.eq.true,user_id.eq.${user.id}`);
  } else {
    query = query.eq("is_public", true);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error, "Failed to load that deck."));
  }

  return data;
}

export async function fetchFlashcatsUserProfile(): Promise<FlashcatsUserProfile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("flashcats_users")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error, "Failed to load your FlashCats profile."));
  }

  return data;
}

export async function ensureFlashcatsUserProfile(): Promise<FlashcatsUserProfile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to create decks.");
  }

  const existing = await fetchFlashcatsUserProfile();
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("flashcats_users")
    .insert({ user_id: user.id })
    .select("*")
    .single();

  if (error) {
    throw new Error(getErrorMessage(error, "Failed to create your FlashCats profile."));
  }

  return data;
}

export async function createFlashcatsDeck(
  input: FlashcatsDeckInput
): Promise<FlashcatsDeck> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to create decks.");
  }

  const normalized = validateFlashcatsDeckInput(input);

  const { data, error } = await supabase
    .from("flashcats_decks")
    .insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      title: normalized.title,
      description: normalized.description || null,
      is_public: normalized.is_public,
      field_definitions: normalized.field_definitions,
      cards: normalized.cards,
      card_count: normalized.cards.length,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(getErrorMessage(error, "Failed to create deck."));
  }

  return data;
}

export async function updateFlashcatsDeck(
  deckId: string,
  input: FlashcatsDeckInput
): Promise<FlashcatsDeck> {
  const supabase = createClient();
  const normalized = validateFlashcatsDeckInput(input);

  const { data, error } = await supabase
    .from("flashcats_decks")
    .update({
      title: normalized.title,
      description: normalized.description || null,
      is_public: normalized.is_public,
      field_definitions: normalized.field_definitions,
      cards: normalized.cards,
      card_count: normalized.cards.length,
    })
    .eq("id", deckId)
    .select("*")
    .single();

  if (error) {
    throw new Error(getErrorMessage(error, "Failed to update deck."));
  }

  return data;
}

export async function deleteFlashcatsDeck(deckId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("flashcats_decks")
    .delete()
    .eq("id", deckId);

  if (error) {
    throw new Error(getErrorMessage(error, "Failed to delete deck."));
  }
}

export async function fetchUserDeckPreference(
  deckId: string
): Promise<FlashcatsUserDeckPreference | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("flashcats_user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .eq("deck_id", deckId)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error, "Failed to load saved layout."));
  }

  return data;
}

export async function saveUserDeckPreference(
  deckId: string,
  frontFields: FlashcatsFieldKey[],
  backFields: FlashcatsFieldKey[]
): Promise<FlashcatsUserDeckPreference> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to save deck preferences.");
  }

  if (frontFields.length === 0 || backFields.length === 0) {
    throw new Error("Choose at least one field for both sides of the card.");
  }

  const { data, error } = await supabase
    .from("flashcats_user_preferences")
    .upsert(
      {
        user_id: user.id,
        deck_id: deckId,
        front_fields: frontFields,
        back_fields: backFields,
      },
      { onConflict: "user_id,deck_id" }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(getErrorMessage(error, "Failed to save deck layout."));
  }

  return data;
}
