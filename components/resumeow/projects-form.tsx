"use client";

import { Project } from "@/lib/types/resume";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface ProjectsFormProps {
  data: Project[];
  onChange: (data: Project[]) => void;
}

export function ProjectsForm({ data, onChange }: ProjectsFormProps) {
  const addProject = () => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: "",
      link: "",
    };
    onChange([...data, newProject]);
  };

  const updateProject = (id: string, field: keyof Project, value: any) => {
    onChange(
      data.map((proj) => (proj.id === id ? { ...proj, [field]: value } : proj))
    );
  };

  const removeProject = (id: string) => {
    onChange(data.filter((proj) => proj.id !== id));
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
        <h3 className="text-lg font-semibold text-white">Relevant Projects</h3>
        <Button onClick={addProject} variant="outline" size="sm">
          + Add Project
        </Button>
      </div>

      {data.map((project, index) => (
        <div key={project.id} className="border border-gray-700 rounded-lg p-4 space-y-4 bg-gray-800/20">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-white">Project {index + 1}</h4>
            <Button
              onClick={() => removeProject(project.id)}
              variant="outline"
              size="sm"
            >
              Remove
            </Button>
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
          </div>
        </div>
      ))}

      {data.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No projects added yet. Click "Add Project" to get started.
        </div>
      )}
    </div>
  );
}
