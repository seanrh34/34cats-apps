"use client";

import { Experience } from "@/lib/types/resume";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ExperienceFormProps {
  data: Experience[];
  onChange: (data: Experience[]) => void;
}

export function ExperienceForm({ data, onChange }: ExperienceFormProps) {
  const addExperience = () => {
    const newExp: Experience = {
      id: crypto.randomUUID(),
      position: "",
      dateRange: "",
      company: "",
      location: "",
      description: [""],
    };
    onChange([...data, newExp]);
  };

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    onChange(
      data.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp))
    );
  };

  const removeExperience = (id: string) => {
    // Ensure at least 1 experience entry remains
    if (data.length <= 1) {
      alert("You must have at least one experience entry.");
      return;
    }
    onChange(data.filter((exp) => exp.id !== id));
  };

  const addBullet = (id: string) => {
    onChange(
      data.map((exp) =>
        exp.id === id ? { ...exp, description: [...exp.description, ""] } : exp
      )
    );
  };

  const updateBullet = (id: string, index: number, value: string) => {
    onChange(
      data.map((exp) =>
        exp.id === id
          ? {
              ...exp,
              description: exp.description.map((d, i) =>
                i === index ? value : d
              ),
            }
          : exp
      )
    );
  };

  const removeBullet = (id: string, index: number) => {
    onChange(
      data.map((exp) =>
        exp.id === id
          ? {
              ...exp,
              description: exp.description.filter((_, i) => i !== index),
            }
          : exp
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Sample Image */}
      <div className="mb-6 p-4 bg-gray-800/20 rounded-lg border border-gray-700">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Example:</h4>
        <Image
          src="/resumeow/experience_sample.png"
          alt="Experience section example"
          width={600}
          height={150}
          className="rounded border border-gray-600"
        />
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Work Experience</h3>
        <Button onClick={addExperience} variant="outline" size="sm">
          + Add Experience
        </Button>
      </div>

      {data.map((exp, expIndex) => (
        <div key={exp.id} className="border border-gray-700 rounded-lg p-4 space-y-4 bg-gray-800/20">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-white">Experience {expIndex + 1}</h4>
            <Button
              onClick={() => removeExperience(exp.id)}
              variant="outline"
              size="sm"
              disabled={data.length <= 1}
              title={data.length <= 1 ? "You need to have at least 1 experience entry" : ""}
            >
              Remove
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Position *</label>
              <Input
                value={exp.position}
                onChange={(e) =>
                  updateExperience(exp.id, "position", e.target.value)
                }
                placeholder="Software Engineer"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Date Range *</label>
              <Input
                value={exp.dateRange}
                onChange={(e) =>
                  updateExperience(exp.id, "dateRange", e.target.value)
                }
                placeholder="Aug 2023 - Present"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Company *</label>
              <Input
                value={exp.company}
                onChange={(e) =>
                  updateExperience(exp.id, "company", e.target.value)
                }
                placeholder="Company Name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Location *</label>
              <Input
                value={exp.location}
                onChange={(e) =>
                  updateExperience(exp.id, "location", e.target.value)
                }
                placeholder="San Francisco, CA"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-200">
                Responsibilities & Achievements
              </label>
              <Button
                onClick={() => addBullet(exp.id)}
                variant="outline"
                size="sm"
              >
                + Add Bullet
              </Button>
            </div>
            {exp.description.map((bullet, bulletIndex) => (
              <div key={bulletIndex} className="flex gap-2">
                <Input
                  value={bullet}
                  onChange={(e) =>
                    updateBullet(exp.id, bulletIndex, e.target.value)
                  }
                  placeholder="Describe your achievement or responsibility..."
                  className="flex-1"
                />
                {exp.description.length > 1 && (
                  <Button
                    onClick={() => removeBullet(exp.id, bulletIndex)}
                    variant="outline"
                    size="sm"
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No experience added yet. Click "Add Experience" to get started.
        </div>
      )}
    </div>
  );
}
