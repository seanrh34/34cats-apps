import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FlashcatsDeck } from "@/lib/types/flashcats";

interface FlashcatsDeckListProps {
  title: string;
  description: string;
  decks: FlashcatsDeck[];
  emptyMessage: string;
  onPractice: (deck: FlashcatsDeck) => void;
  onEdit?: (deck: FlashcatsDeck) => void;
  onDelete?: (deck: FlashcatsDeck) => void;
}

export function FlashcatsDeckList({
  title,
  description,
  decks,
  emptyMessage,
  onPractice,
  onEdit,
  onDelete,
}: FlashcatsDeckListProps) {
  return (
    <section>
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="mt-2 text-sm text-gray-400">{description}</p>
      </div>

      {decks.length === 0 ? (
        <Card className="border-dashed border-gray-700 bg-gray-900/40">
          <p className="text-sm text-gray-400">{emptyMessage}</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {decks.map((deck) => (
            <Card
              key={deck.id}
              className="border-gray-700 bg-gray-900/50 p-5 shadow-lg shadow-black/20"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold text-white">{deck.title}</h3>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${
                        deck.is_public
                          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                          : "border-amber-400/20 bg-amber-400/10 text-amber-300"
                      }`}
                    >
                      {deck.is_public ? "Public" : "Private"}
                    </span>
                  </div>

                  <p className="max-w-2xl text-sm text-gray-300">
                    {deck.description || "No description yet."}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {deck.field_definitions.map((field) => (
                      <span
                        key={field.key}
                        className="rounded-full border border-[#E84A3A]/20 bg-[#E84A3A]/10 px-3 py-1 text-xs font-medium text-[#ffb3aa]"
                      >
                        {field.label}
                      </span>
                    ))}
                  </div>

                  <p className="text-sm text-gray-400">
                    {deck.card_count} {deck.card_count === 1 ? "card" : "cards"} available
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => onPractice(deck)}
                    disabled={deck.card_count === 0}
                    size="sm"
                  >
                    Practise
                  </Button>
                  {onEdit && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onEdit(deck)}
                    >
                      Edit
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(deck)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
