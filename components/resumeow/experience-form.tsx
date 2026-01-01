"use client";

import { Experience } from "@/lib/types/resume";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ExperienceFormProps {
  data: Experience[];
  onChange: (data: Experience[]) => void;
}

export function ExperienceForm({ data, onChange }: ExperienceFormProps) {
  const addExperience = () => {
    const newExp: Experience = {
      id: crypto.randomUUID(),
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
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
            >
              Remove
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Start Date *</label>
              <Input
                type="month"
                value={exp.startDate}
                onChange={(e) =>
                  updateExperience(exp.id, "startDate", e.target.value)
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">End Date</label>
              <Input
                type="month"
                value={exp.endDate}
                onChange={(e) =>
                  updateExperience(exp.id, "endDate", e.target.value)
                }
                disabled={exp.current}
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exp.current}
                  onChange={(e) =>
                    updateExperience(exp.id, "current", e.target.checked)
                  }
                  className="rounded bg-gray-800 border-gray-600"
                />
                <span className="text-sm text-gray-200">Currently working here</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
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
