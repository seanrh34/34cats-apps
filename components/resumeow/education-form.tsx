"use client";

import { Education } from "@/lib/types/resume";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface EducationFormProps {
  data: Education[];
  onChange: (data: Education[]) => void;
}

export function EducationForm({ data, onChange }: EducationFormProps) {
  const addEducation = () => {
    const newEdu: Education = {
      id: crypto.randomUUID(),
      institution: "",
      location: "",
      degree: "",
      gpa: "",
      dateRange: "",
    };
    onChange([...data, newEdu]);
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    onChange(
      data.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu))
    );
  };

  const removeEducation = (id: string) => {
    // Ensure at least 1 education entry remains
    if (data.length <= 1) {
      alert("You must have at least one education entry.");
      return;
    }
    onChange(data.filter((edu) => edu.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Sample Image */}
      <div className="mb-6 p-4 bg-gray-800/20 rounded-lg border border-gray-700">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Example:</h4>
        <Image
          src="/resumeow/education_sample.png"
          alt="Education section example"
          width={600}
          height={150}
          className="rounded border border-gray-600"
        />
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Education</h3>
        <Button onClick={addEducation} variant="outline" size="sm">
          + Add Education
        </Button>
      </div>

      {data.map((edu, eduIndex) => (
        <div key={edu.id} className="border border-gray-700 rounded-lg p-4 space-y-4 bg-gray-800/20">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-white">Education {eduIndex + 1}</h4>
            <Button
              onClick={() => removeEducation(edu.id)}
              variant="outline"
              size="sm"
              disabled={data.length <= 1}
              title={data.length <= 1 ? "You need to have at least 1 education entry" : ""}
            >
              Remove
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">
                Institution *
              </label>
              <Input
                value={edu.institution}
                onChange={(e) =>
                  updateEducation(edu.id, "institution", e.target.value)
                }
                placeholder="University Name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Location *</label>
              <Input
                value={edu.location}
                onChange={(e) =>
                  updateEducation(edu.id, "location", e.target.value)
                }
                placeholder="Boston, MA"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">
                Degree *
              </label>
              <Input
                value={edu.degree}
                onChange={(e) =>
                  updateEducation(edu.id, "degree", e.target.value)
                }
                placeholder="Bachelor of Science in Computer Science"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">
                Date Range *
              </label>
              <Input
                value={edu.dateRange}
                onChange={(e) =>
                  updateEducation(edu.id, "dateRange", e.target.value)
                }
                placeholder="Aug 2020 - May 2024"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">GPA or Other Info (optional)</label>
              <Input
                value={edu.gpa || ""}
                onChange={(e) => updateEducation(edu.id, "gpa", e.target.value)}
                placeholder="Cumulative GPA: 4.90/5.00"
              />
            </div>
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No education added yet. Click &quot;Add Education&quot; to get started.
        </div>
      )}
    </div>
  );
}
