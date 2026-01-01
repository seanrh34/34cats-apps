"use client";

import { Skill } from "@/lib/types/resume";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SkillsFormProps {
  data: Skill[];
  onChange: (data: Skill[]) => void;
}

export function SkillsForm({ data, onChange }: SkillsFormProps) {
  const addSkillCategory = () => {
    const newSkill: Skill = {
      category: "",
      items: [""],
    };
    onChange([...data, newSkill]);
  };

  const updateCategory = (index: number, category: string) => {
    onChange(
      data.map((skill, i) => (i === index ? { ...skill, category } : skill))
    );
  };

  const updateItems = (index: number, items: string) => {
    onChange(
      data.map((skill, i) =>
        i === index ? { ...skill, items: items.split(",").map((s) => s.trim()) } : skill
      )
    );
  };

  const removeCategory = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Skills</h3>
        <Button onClick={addSkillCategory} variant="outline" size="sm">
          + Add Category
        </Button>
      </div>

      {data.map((skill, index) => (
        <div key={index} className="border border-gray-700 rounded-lg p-4 space-y-4 bg-gray-800/20">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-white">Category {index + 1}</h4>
            <Button
              onClick={() => removeCategory(index)}
              variant="outline"
              size="sm"
            >
              Remove
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">
                Category Name *
              </label>
              <Input
                value={skill.category}
                onChange={(e) => updateCategory(index, e.target.value)}
                placeholder="e.g., Programming Languages, Tools, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">
                Skills (comma-separated) *
              </label>
              <Input
                value={skill.items.join(", ")}
                onChange={(e) => updateItems(index, e.target.value)}
                placeholder="Python, JavaScript, React, Node.js"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Separate skills with commas
              </p>
            </div>
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No skills added yet. Click "Add Category" to get started.
        </div>
      )}
    </div>
  );
}
