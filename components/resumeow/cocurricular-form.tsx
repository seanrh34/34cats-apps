"use client";

import { CoCurricularActivity } from "@/lib/types/resume";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Co-Curricular Activities</h3>
        <Button onClick={addActivity} variant="outline" size="sm">
          + Add Activity
        </Button>
      </div>

      {data.map((activity, activityIndex) => (
        <div key={activity.id} className="border border-gray-700 rounded-lg p-4 space-y-4 bg-gray-800/20">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-white">Activity {activityIndex + 1}</h4>
            <Button
              onClick={() => removeActivity(activity.id)}
              variant="outline"
              size="sm"
            >
              Remove
            </Button>
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
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-200">
                Activities & Achievements
              </label>
              <Button
                onClick={() => addBullet(activity.id)}
                variant="outline"
                size="sm"
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
