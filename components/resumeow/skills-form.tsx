"use client";

import { Skill } from "@/lib/types/resume";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";

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

  const moveCategoryUp = (index: number) => {
    if (index === 0) return;
    const newData = [...data];
    [newData[index - 1], newData[index]] = [newData[index], newData[index - 1]];
    onChange(newData);
  };

  const moveCategoryDown = (index: number) => {
    if (index === data.length - 1) return;
    const newData = [...data];
    [newData[index], newData[index + 1]] = [newData[index + 1], newData[index]];
    onChange(newData);
  };

  return (
    <div className="space-y-6">
      {/* Sample Image */}
      <div className="mb-6 p-4 bg-gray-800/20 rounded-lg border border-gray-700">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Example:</h4>
        <Image
          src="/resumeow/skills_sample.png"
          alt="Skills section example"
          width={600}
          height={100}
          className="rounded border border-gray-600"
        />
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Skills</h3>
        <Button onClick={addSkillCategory} size="sm" className="bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl hover:shadow-green-500/20">
          + Add Category
        </Button>
      </div>

      {data.map((skill, index) => (
        <div key={index} className="border border-gray-700 rounded-lg p-4 space-y-4 bg-gray-800/20">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-white">Category {index + 1}</h4>
            <div className="flex gap-2">
              <Button
                onClick={() => moveCategoryUp(index)}
                variant="outline"
                size="sm"
                disabled={index === 0}
                title={index === 0 ? "Already at the top" : "Move up"}
              >
                ↑
              </Button>
              <Button
                onClick={() => moveCategoryDown(index)}
                variant="outline"
                size="sm"
                disabled={index === data.length - 1}
                title={index === data.length - 1 ? "Already at the bottom" : "Move down"}
              >
                ↓
              </Button>
              <Button
                onClick={() => removeCategory(index)}
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Remove
              </Button>
            </div>
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
