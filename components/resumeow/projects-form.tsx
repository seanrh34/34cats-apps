"use client";

import { useState } from "react";
import { Project } from "@/lib/types/resume";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ProjectsFormProps {
  data: Project[];
  onChange: (data: Project[]) => void;
}

export function ProjectsForm({ data, onChange }: ProjectsFormProps) {
  const [technologyDrafts, setTechnologyDrafts] = useState<Record<string, string>>(
    {}
  );

  const addProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: "",
      link: "",
      linkLabel: "",
      technologies: [],
      description: [""],
    };
    onChange([...data, newProject]);
  };

  const updateProject = <K extends keyof Project>(
    id: string,
    field: K,
    value: Project[K]
  ) => {
    onChange(
      data.map((proj) => (proj.id === id ? { ...proj, [field]: value } : proj))
    );
  };

  const removeProject = (id: string) => {
    onChange(data.filter((proj) => proj.id !== id));
  };

  const updateProjectTechnologies = (id: string, value: string) => {
    setTechnologyDrafts((current) => ({
      ...current,
      [id]: value,
    }));
  };

  const commitProjectTechnologies = (id: string) => {
    const rawValue = technologyDrafts[id] ?? "";

    onChange(
      data.map((proj) =>
        proj.id === id
          ? {
              ...proj,
              technologies: rawValue
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            }
          : proj
      )
    );
  };

  const addBullet = (id: string) => {
    onChange(
      data.map((proj) =>
        proj.id === id
          ? {
              ...proj,
              description: [...(proj.description ?? []), ""],
            }
          : proj
      )
    );
  };

  const updateBullet = (id: string, bulletIndex: number, value: string) => {
    onChange(
      data.map((proj) =>
        proj.id === id
          ? {
              ...proj,
              description: (proj.description ?? []).map((bullet, index) =>
                index === bulletIndex ? value : bullet
              ),
            }
          : proj
      )
    );
  };

  const removeBullet = (id: string, bulletIndex: number) => {
    onChange(
      data.map((proj) =>
        proj.id === id
          ? {
              ...proj,
              description: (proj.description ?? []).filter(
                (_, index) => index !== bulletIndex
              ),
            }
          : proj
      )
    );
  };

  const moveBullet = (id: string, bulletIndex: number, direction: -1 | 1) => {
    onChange(
      data.map((proj) => {
        if (proj.id !== id) {
          return proj;
        }

        const bullets = [...(proj.description ?? [])];
        const targetIndex = bulletIndex + direction;
        if (targetIndex < 0 || targetIndex >= bullets.length) {
          return proj;
        }

        [bullets[bulletIndex], bullets[targetIndex]] = [
          bullets[targetIndex],
          bullets[bulletIndex],
        ];

        return {
          ...proj,
          description: bullets,
        };
      })
    );
  };

  const moveProjectUp = (index: number) => {
    if (index === 0) return;
    const newData = [...data];
    [newData[index - 1], newData[index]] = [newData[index], newData[index - 1]];
    onChange(newData);
  };

  const moveProjectDown = (index: number) => {
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
          src="/resumeow/projects_sample.png"
          alt="Projects section example"
          width={600}
          height={100}
          className="rounded border border-gray-600"
        />
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Projects</h3>
        <Button onClick={addProject} size="sm" variant="secondary">
          + Add Project
        </Button>
      </div>

      {data.map((project, index) => (
        <div key={project.id} className="border border-gray-700 rounded-lg p-4 space-y-4 bg-gray-800/20">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-white">Project {index + 1}</h4>
            <div className="flex gap-2">
              <Button
                onClick={() => moveProjectUp(index)}
                variant="outline"
                size="sm"
                disabled={index === 0}
                title={index === 0 ? "Already at the top" : "Move up"}
              >
                ↑
              </Button>
              <Button
                onClick={() => moveProjectDown(index)}
                variant="outline"
                size="sm"
                disabled={index === data.length - 1}
                title={index === data.length - 1 ? "Already at the bottom" : "Move down"}
              >
                ↓
              </Button>
              <Button
                onClick={() => removeProject(project.id)}
                size="sm"
                variant="ghost" className="text-red-300 hover:bg-red-500/10 hover:text-red-200"
              >
                Remove
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">
                Project Name *
              </label>
              <Input
                value={project.name}
                onChange={(e) =>
                  updateProject(project.id, "name", e.target.value)
                }
                placeholder="My Awesome Project"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">
                Link (optional)
              </label>
              <Input
                value={project.link || ""}
                onChange={(e) =>
                  updateProject(project.id, "link", e.target.value)
                }
                placeholder="https://github.com/username/project"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">
                Link Label (optional)
              </label>
              <Input
                value={project.linkLabel || ""}
                onChange={(e) =>
                  updateProject(project.id, "linkLabel", e.target.value)
                }
                placeholder="GitHub Repo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-200">
                Technologies (optional)
              </label>
              <Input
                value={
                  technologyDrafts[project.id] ??
                  (project.technologies ?? []).join(", ")
                }
                onChange={(e) =>
                  updateProjectTechnologies(project.id, e.target.value)
                }
                onBlur={() => commitProjectTechnologies(project.id)}
                placeholder="React, Next.js, Tailwind, Supabase"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-200">
                Project Bullets
              </label>
              <Button
                onClick={() => addBullet(project.id)}
                size="sm"
                variant="secondary"
              >
                + Add Bullet
              </Button>
            </div>

            {(project.description ?? []).map((bullet, bulletIndex, bullets) => (
              <div
                key={`${project.id}-bullet-${bulletIndex}`}
                className="rounded-lg border border-gray-700 bg-gray-900/30 p-3 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-200">
                    Bullet {bulletIndex + 1}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => moveBullet(project.id, bulletIndex, -1)}
                      variant="outline"
                      size="sm"
                      disabled={bulletIndex === 0}
                      title={bulletIndex === 0 ? "Already at the top" : "Move up"}
                    >
                      ↑
                    </Button>
                    <Button
                      onClick={() => moveBullet(project.id, bulletIndex, 1)}
                      variant="outline"
                      size="sm"
                      disabled={bulletIndex === bullets.length - 1}
                      title={
                        bulletIndex === bullets.length - 1
                          ? "Already at the bottom"
                          : "Move down"
                      }
                    >
                      ↓
                    </Button>
                    <Button
                      onClick={() => removeBullet(project.id, bulletIndex)}
                      size="sm"
                      variant="ghost" className="text-red-300 hover:bg-red-500/10 hover:text-red-200"
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                <textarea
                  value={bullet}
                  onChange={(e) =>
                    updateBullet(project.id, bulletIndex, e.target.value)
                  }
                  rows={3}
                  className="w-full rounded-md border border-gray-700 bg-gray-950/60 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-gray-500 focus:outline-none"
                  placeholder="Describe what you built, how you built it, or the impact it had."
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No projects added yet. Click &quot;Add Project&quot; to get started.
        </div>
      )}
    </div>
  );
}
