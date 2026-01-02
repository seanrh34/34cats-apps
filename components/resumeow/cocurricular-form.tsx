"use client";

import { CoCurricularActivity } from "@/lib/types/resume";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface CoCurricularFormProps {
  data: CoCurricularActivity[];
  onChange: (data: CoCurricularActivity[]) => void;
}

export function CoCurricularForm({ data, onChange }: CoCurricularFormProps) {
  const addActivity = () => {
    const newActivity: CoCurricularActivity = {
      id: crypto.randomUUID(),
      position: "",
      dateRange: "",
      organization: "",
      location: "",
      description: [""],
    };
    onChange([...data, newActivity]);
  };

  const updateActivity = (id: string, field: keyof CoCurricularActivity, value: any) => {
    onChange(
      data.map((activity) => (activity.id === id ? { ...activity, [field]: value } : activity))
    );
  };

  const removeActivity = (id: string) => {
    onChange(data.filter((activity) => activity.id !== id));
  };

  const addBullet = (id: string) => {
    onChange(
      data.map((activity) =>
        activity.id === id ? { ...activity, description: [...activity.description, ""] } : activity
      )
    );
  };

  const updateBullet = (id: string, index: number, value: string) => {
    onChange(
      data.map((activity) =>
        activity.id === id
          ? {
              ...activity,
              description: activity.description.map((d, i) =>
                i === index ? value : d
              ),
            }
          : activity
      )
    );
  };

  const removeBullet = (id: string, index: number) => {
    onChange(
      data.map((activity) =>
        activity.id === id
          ? {
              ...activity,
              description: activity.description.filter((_, i) => i !== index),
            }
          : activity
      )
    );
  };

  const moveActivityUp = (index: number) => {
    if (index === 0) return;
    const newData = [...data];
    [newData[index - 1], newData[index]] = [newData[index], newData[index - 1]];
    onChange(newData);
  };

  const moveActivityDown = (index: number) => {
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
          src="/resumeow/cca_sample.png"
          alt="Co-curricular activities section example"
          width={600}
          height={150}
          className="rounded border border-gray-600"
        />
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Co-Curricular Activities</h3>
        <Button onClick={addActivity} size="sm" className="bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl hover:shadow-green-500/20">
          + Add Activity
        </Button>
      </div>

      {data.map((activity, activityIndex) => (
        <div key={activity.id} className="border border-gray-700 rounded-lg p-4 space-y-4 bg-gray-800/20">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-white">Activity {activityIndex + 1}</h4>
            <div className="flex gap-2">
              <Button
                onClick={() => moveActivityUp(activityIndex)}
                variant="outline"
                size="sm"
                disabled={activityIndex === 0}
                title={activityIndex === 0 ? "Already at the top" : "Move up"}
              >
                ↑
              </Button>
              <Button
                onClick={() => moveActivityDown(activityIndex)}
                variant="outline"
                size="sm"
                disabled={activityIndex === data.length - 1}
                title={activityIndex === data.length - 1 ? "Already at the bottom" : "Move down"}
              >
                ↓
              </Button>
              <Button
                onClick={() => removeActivity(activity.id)}
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Remove
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Position *</label>
              <Input
                value={activity.position}
                onChange={(e) =>
                  updateActivity(activity.id, "position", e.target.value)
                }
                placeholder="Vice President"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Date Range *</label>
              <Input
                value={activity.dateRange}
                onChange={(e) =>
                  updateActivity(activity.id, "dateRange", e.target.value)
                }
                placeholder="Sep 2023 - Aug 2024"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Organization *</label>
              <Input
                value={activity.organization}
                onChange={(e) =>
                  updateActivity(activity.id, "organization", e.target.value)
                }
                placeholder="Student Council"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">Location *</label>
              <Input
                value={activity.location}
                onChange={(e) =>
                  updateActivity(activity.id, "location", e.target.value)
                }
                placeholder="San Francisco, CA"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-200">
                Activities & Achievements
              </label>
              <Button
                onClick={() => addBullet(activity.id)}
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl hover:shadow-green-500/20"
              >
                + Add Bullet
              </Button>
            </div>
            {activity.description.map((bullet, bulletIndex) => (
              <div key={bulletIndex} className="flex gap-2">
                <Input
                  value={bullet}
                  onChange={(e) =>
                    updateBullet(activity.id, bulletIndex, e.target.value)
                  }
                  placeholder="Describe your achievement or activity..."
                  className="flex-1"
                />
                {activity.description.length > 1 && (
                  <Button
                    onClick={() => removeBullet(activity.id, bulletIndex)}
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
          No co-curricular activities added yet. Click "Add Activity" to get started.
        </div>
      )}
    </div>
  );
}
