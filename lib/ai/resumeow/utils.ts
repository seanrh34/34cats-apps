import {
  ResumeChangeDiffItem,
  ResumeData,
  ResumeProfile,
  SavedResume,
} from "@/lib/types/resume";

export function splitCommaSeparated(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toVectorString(embedding: number[]) {
  return `[${embedding.join(",")}]`;
}

export function extractJsonFromText(text: string) {
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error("Empty JSON payload");
  }

  const fencedMatch = trimmed.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

export function serializeResumeData(
  title: string,
  resumeData: ResumeData,
  revision?: number
) {
  return JSON.stringify(
    {
      title,
      revision,
      resumeData,
    },
    null,
    2
  );
}

export function serializeProfile(profile: ResumeProfile) {
  return JSON.stringify(
    {
      professionalHeadline: profile.professional_headline,
      targetRoles: profile.target_roles,
      yearsExperience: profile.years_experience,
      locationPreferences: profile.location_preferences,
      coreSkills: profile.core_skills,
      educationSummary: profile.education_summary,
      domainFocus: profile.domain_focus,
      achievementNotes: profile.achievement_notes,
    },
    null,
    2
  );
}

export function serializeSavedResume(resume: SavedResume) {
  return serializeResumeData(
    resume.title,
    resume.resume_data,
    resume.resume_revision
  );
}

export function buildProfileDocument(profile: ResumeProfile) {
  return [
    `Professional headline: ${profile.professional_headline || "N/A"}`,
    `Target roles: ${profile.target_roles.join(", ") || "N/A"}`,
    `Years of experience: ${profile.years_experience ?? "N/A"}`,
    `Location preferences: ${profile.location_preferences.join(", ") || "N/A"}`,
    `Core skills: ${profile.core_skills.join(", ") || "N/A"}`,
    `Education summary: ${profile.education_summary || "N/A"}`,
    `Domain focus: ${profile.domain_focus.join(", ") || "N/A"}`,
    `Achievement notes: ${profile.achievement_notes || "N/A"}`,
  ].join("\n");
}

export function flattenResumeForText(resume: SavedResume) {
  const lines = [
    `Title: ${resume.title}`,
    `Full name: ${resume.resume_data.personalInfo.fullName || "N/A"}`,
    `Email: ${resume.resume_data.personalInfo.email || "N/A"}`,
    `Phone: ${resume.resume_data.personalInfo.phone || "N/A"}`,
  ];

  resume.resume_data.education.forEach((entry, index) => {
    lines.push(
      `Education ${index + 1}: ${entry.degree} at ${entry.institution} (${entry.dateRange})`
    );
  });

  resume.resume_data.experience.forEach((entry, index) => {
    lines.push(
      `Experience ${index + 1}: ${entry.position} at ${entry.company} (${entry.dateRange})`
    );
    entry.description.forEach((bullet, bulletIndex) => {
      if (bullet.trim()) {
        lines.push(`- Experience ${index + 1} bullet ${bulletIndex + 1}: ${bullet}`);
      }
    });
  });

  resume.resume_data.skills.forEach((entry) => {
    lines.push(`Skills ${entry.category}: ${entry.items.join(", ")}`);
  });

  resume.resume_data.projects?.forEach((entry, index) => {
    lines.push(`Project ${index + 1}: ${entry.name} (${entry.link || "no link"})`);
  });

  resume.resume_data.coCurricularActivities?.forEach((entry, index) => {
    lines.push(
      `Activity ${index + 1}: ${entry.position} at ${entry.organization} (${entry.dateRange})`
    );
  });

  return lines.join("\n");
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return JSON.stringify(value);
}

function collectDiffs(
  section: string,
  beforeValue: unknown,
  afterValue: unknown,
  diffs: ResumeChangeDiffItem[]
) {
  const beforeString = formatValue(beforeValue);
  const afterString = formatValue(afterValue);

  if (beforeString !== afterString) {
    diffs.push({
      section,
      label: section,
      before: beforeString || "(empty)",
      after: afterString || "(empty)",
    });
  }
}

export function diffResumeData(
  before: ResumeData,
  after: ResumeData
): ResumeChangeDiffItem[] {
  const diffs: ResumeChangeDiffItem[] = [];

  collectDiffs(
    "Personal info",
    before.personalInfo,
    after.personalInfo,
    diffs
  );
  collectDiffs("Education", before.education, after.education, diffs);
  collectDiffs("Experience", before.experience, after.experience, diffs);
  collectDiffs(
    "Co-curricular activities",
    before.coCurricularActivities ?? [],
    after.coCurricularActivities ?? [],
    diffs
  );
  collectDiffs("Skills", before.skills, after.skills, diffs);
  collectDiffs("Projects", before.projects ?? [], after.projects ?? [], diffs);

  return diffs;
}

export function sseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}
