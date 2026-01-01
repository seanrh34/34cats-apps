"use client";

import { PersonalInfo } from "@/lib/types/resume";
import { Input } from "@/components/ui/input";

interface PersonalInfoFormProps {
  data: PersonalInfo;
  onChange: (data: PersonalInfo) => void;
}

export function PersonalInfoForm({ data, onChange }: PersonalInfoFormProps) {
  const handleChange = (field: keyof PersonalInfo, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Personal Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-200">Full Name *</label>
          <Input
            value={data.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-200">Email *</label>
          <Input
            type="email"
            value={data.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="john@example.com"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-200">Phone *</label>
          <Input
            type="tel"
            value={data.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+1 (555) 123-4567"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-200">Website</label>
          <Input
            value={data.website || ""}
            onChange={(e) => handleChange("website", e.target.value)}
            placeholder="www.example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-200">LinkedIn</label>
          <Input
            value={data.linkedin || ""}
            onChange={(e) => handleChange("linkedin", e.target.value)}
            placeholder="linkedin.com/in/johndoe"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-200">GitHub</label>
          <Input
            value={data.github || ""}
            onChange={(e) => handleChange("github", e.target.value)}
            placeholder="github.com/johndoe"
          />
        </div>
      </div>
    </div>
  );
}
