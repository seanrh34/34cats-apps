"use client";

import { Education } from "@/lib/types/resume";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface EducationFormProps {
  data: Education[];
  onChange: (data: Education[]) => void;
}

export function EducationForm({ data, onChange }: EducationFormProps) {
  const addEducation = () => {
    const newEdu: Education = {
      id: crypto.randomUUID(),
      institution: "",
      degree: "",
      field: "",
      location: "",
      startDate: "",
      endDate: "",
      gpa: "",
      honors: [],
    };
    onChange([...data, newEdu]);
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    onChange(
      data.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu))
    );
  };

  const removeEducation = (id: string) => {
    onChange(data.filter((edu) => edu.id !== id));
  };

  return (
    <div className="space-y-6">
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
              <label className="block text-sm font-medium mb-1 text-gray-200">Degree *</label>
              <Input
                value={edu.degree}
                onChange={(e) =>
                  updateEducation(edu.id, "degree", e.target.value)
                }
                placeholder="Bachelor of Science"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">
                Field of Study *
              </label>
              <Input
                value={edu.field}
                onChange={(e) =>
                  updateEducation(edu.id, "field", e.target.value)
                }
                placeholder="Computer Science"
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
                Start Date *
              </label>
              <Input
                type="month"
                value={edu.startDate}
                onChange={(e) =>
                  updateEducation(edu.id, "startDate", e.target.value)
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">
                End Date *
              </label>
              <Input
                type="month"
                value={edu.endDate}
                onChange={(e) =>
                  updateEducation(edu.id, "endDate", e.target.value)
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">GPA</label>
              <Input
                value={edu.gpa || ""}
                onChange={(e) => updateEducation(edu.id, "gpa", e.target.value)}
                placeholder="3.8/4.0"
              />
            </div>
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No education added yet. Click "Add Education" to get started.
        </div>
      )}
    </div>
  );
}
