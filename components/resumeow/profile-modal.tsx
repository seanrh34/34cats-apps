"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_RESUME_PROFILE,
  ResumeProfile,
} from "@/lib/types/resume";
import { splitCommaSeparated } from "@/lib/ai/resumeow/utils";

interface ProfileModalProps {
  open: boolean;
  profile: ResumeProfile | null;
  onClose: () => void;
  onSave: (
    payload: Omit<ResumeProfile, "id" | "user_id" | "created_at" | "updated_at">
  ) => Promise<void>;
  isSaving: boolean;
}

interface ProfileFormState {
  professional_headline: string;
  target_roles: string;
  years_experience: string;
  location_preferences: string;
  core_skills: string;
  education_summary: string;
  domain_focus: string;
  achievement_notes: string;
}

function buildInitialFormState(profile: ResumeProfile | null): ProfileFormState {
  return {
    professional_headline: profile?.professional_headline ?? "",
    target_roles: profile?.target_roles.join(", ") ?? "",
    years_experience:
      profile?.years_experience === null || profile?.years_experience === undefined
        ? ""
        : String(profile.years_experience),
    location_preferences: profile?.location_preferences.join(", ") ?? "",
    core_skills: profile?.core_skills.join(", ") ?? "",
    education_summary: profile?.education_summary ?? "",
    domain_focus: profile?.domain_focus.join(", ") ?? "",
    achievement_notes: profile?.achievement_notes ?? "",
  };
}

export function ProfileModal({
  open,
  profile,
  onClose,
  onSave,
  isSaving,
}: ProfileModalProps) {
  const [form, setForm] = useState<ProfileFormState>(buildInitialFormState(profile));

  if (!open) {
    return null;
  }

  const updateField = (
    field: keyof ProfileFormState,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    await onSave({
      professional_headline: form.professional_headline.trim(),
      target_roles: splitCommaSeparated(form.target_roles),
      years_experience: form.years_experience
        ? Number(form.years_experience)
        : DEFAULT_RESUME_PROFILE.years_experience,
      location_preferences: splitCommaSeparated(form.location_preferences),
      core_skills: splitCommaSeparated(form.core_skills),
      education_summary: form.education_summary.trim(),
      domain_focus: splitCommaSeparated(form.domain_focus),
      achievement_notes: form.achievement_notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-gray-700 bg-gray-900/95 p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">AI Profile</h2>
            <p className="mt-2 text-sm text-gray-400">
              This helps Resumeow tailor reviews and edits using grounded context.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Professional Headline"
            value={form.professional_headline}
            onChange={(event) =>
              updateField("professional_headline", event.target.value)
            }
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Product-minded software engineer"
          />
          <Input
            label="Years of Experience"
            type="number"
            value={form.years_experience}
            onChange={(event) =>
              updateField("years_experience", event.target.value)
            }
            placeholder="3"
          />
          <Input
            label="Target Roles"
            value={form.target_roles}
            onChange={(event) =>
              updateField("target_roles", event.target.value)
            }
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Frontend Engineer, Product Engineer"
          />
          <Input
            label="Location Preferences"
            value={form.location_preferences}
            onChange={(event) =>
              updateField("location_preferences", event.target.value)
            }
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Singapore, Remote"
          />
          <Input
            label="Core Skills"
            value={form.core_skills}
            onChange={(event) =>
              updateField("core_skills", event.target.value)
            }
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="React, TypeScript, Next.js"
          />
          <Input
            label="Domain Focus"
            value={form.domain_focus}
            onChange={(event) =>
              updateField("domain_focus", event.target.value)
            }
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="SaaS, AI tools, Growth"
          />
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-200">
              Education Summary
            </label>
            <textarea
              value={form.education_summary}
              onChange={(event) =>
                updateField("education_summary", event.target.value)
              }
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              className="min-h-24 w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#E84A3A]"
              placeholder="BSc in Computer Science, National University of Singapore"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-200">
              Achievement Notes
            </label>
            <textarea
              value={form.achievement_notes}
              onChange={(event) =>
                updateField("achievement_notes", event.target.value)
              }
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              className="min-h-32 w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#E84A3A]"
              placeholder="List notable wins, metrics, leadership scope, or context you want the AI to remember."
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Not Now
          </Button>
          <Button onClick={handleSubmit} isLoading={isSaving}>
            Save Profile
          </Button>
        </div>
      </Card>
    </div>
  );
}
