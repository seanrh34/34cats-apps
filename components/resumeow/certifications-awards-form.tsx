"use client";

import { CertificationAward } from "@/lib/types/resume";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CertificationsAwardsFormProps {
  data: CertificationAward[];
  onChange: (data: CertificationAward[]) => void;
}

export function CertificationsAwardsForm({
  data,
  onChange,
}: CertificationsAwardsFormProps) {
  const addEntry = () => {
    onChange([
      ...data,
      {
        id: crypto.randomUUID(),
        name: "",
        description: "",
      },
    ]);
  };

  const updateEntry = <K extends keyof CertificationAward>(
    id: string,
    field: K,
    value: CertificationAward[K]
  ) => {
    onChange(
      data.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry))
    );
  };

  const removeEntry = (id: string) => {
    onChange(data.filter((entry) => entry.id !== id));
  };

  const moveEntryUp = (index: number) => {
    if (index === 0) {
      return;
    }

    const next = [...data];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  };

  const moveEntryDown = (index: number) => {
    if (index === data.length - 1) {
      return;
    }

    const next = [...data];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Certifications & Awards
        </h3>
        <Button
          onClick={addEntry}
          size="sm"
          className="bg-green-500 text-white shadow-lg hover:bg-green-600 hover:shadow-xl hover:shadow-green-500/20"
        >
          + Add Entry
        </Button>
      </div>

      {data.map((entry, index) => (
        <div
          key={entry.id}
          className="space-y-4 rounded-lg border border-gray-700 bg-gray-800/20 p-4"
        >
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-white">Entry {index + 1}</h4>
            <div className="flex gap-2">
              <Button
                onClick={() => moveEntryUp(index)}
                variant="outline"
                size="sm"
                disabled={index === 0}
                title={index === 0 ? "Already at the top" : "Move up"}
              >
                ↑
              </Button>
              <Button
                onClick={() => moveEntryDown(index)}
                variant="outline"
                size="sm"
                disabled={index === data.length - 1}
                title={
                  index === data.length - 1 ? "Already at the bottom" : "Move down"
                }
              >
                ↓
              </Button>
              <Button
                onClick={() => removeEntry(entry.id)}
                size="sm"
                className="bg-red-500 text-white hover:bg-red-600"
              >
                Remove
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-200">
                Name *
              </label>
              <Input
                value={entry.name}
                onChange={(event) =>
                  updateEntry(entry.id, "name", event.target.value)
                }
                placeholder="AWS Certified Developer - Associate"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-200">
                Description
              </label>
              <textarea
                value={entry.description}
                onChange={(event) =>
                  updateEntry(entry.id, "description", event.target.value)
                }
                placeholder="Optional context such as issuer, year, rank, or achievement details."
                className="min-h-28 w-full rounded-xl border border-gray-700 bg-gray-800/60 px-3 py-3 text-sm text-white placeholder:text-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#E84A3A]"
              />
            </div>
          </div>
        </div>
      ))}

      {data.length === 0 ? (
        <div className="py-8 text-center text-gray-400">
          No certifications or awards added yet. Click &quot;Add Entry&quot; to
          get started.
        </div>
      ) : null}
    </div>
  );
}
