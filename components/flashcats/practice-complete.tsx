import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface FlashcatsPracticeCompleteProps {
  deckTitle: string;
  totalCards: number;
  onTryAgain: () => void;
  onSelectDifferentDeck: () => void;
}

export function FlashcatsPracticeComplete({
  deckTitle,
  totalCards,
  onTryAgain,
  onSelectDifferentDeck,
}: FlashcatsPracticeCompleteProps) {
  return (
    <Card className="border-[#E84A3A]/20 bg-gray-950/70 p-8 text-center shadow-2xl shadow-black/30">
      <p className="text-sm uppercase tracking-[0.3em] text-[#ff9e91]">
        Session complete
      </p>
      <h2 className="mt-4 text-4xl font-bold text-white">Nice work.</h2>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
        You finished all {totalCards} card{totalCards === 1 ? "" : "s"} in{" "}
        {deckTitle}.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button onClick={onTryAgain}>Try again</Button>
        <Button variant="secondary" onClick={onSelectDifferentDeck}>
          Select a different deck
        </Button>
      </div>
    </Card>
  );
}
