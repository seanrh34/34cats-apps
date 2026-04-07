import { FlashcatsDeckPageClient } from "@/components/flashcats/deck-page-client";

export default async function FlashcatsDeckPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;

  return <FlashcatsDeckPageClient deckId={deckId} />;
}
