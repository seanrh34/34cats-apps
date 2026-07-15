import type {
  CertificationAward,
  CoCurricularActivity,
  Education,
  Experience,
  PersonalInfo,
  Project,
  ResumeChangeDiffItem,
  ResumeData,
  ResumeReviewFinding,
  ResumeProfile,
  SavedResume,
  Skill,
} from "@/lib/types/resume";
import { normalizeResumeData } from "@/lib/resume-data";

export const AI_LINE_BREAK_TOKEN = "[[RESUMEOW_LINE_BREAK]]";

const FIELD_ORDER_LANGUAGE_PATTERNS = [
  /\breorder(?:ed|ing)?\b.*\b(field|fields|subfield|subfields|header|headers|contact|contacts|contact links?)\b/i,
  /\b(field|fields|subfield|subfields|header|headers|contact|contacts|contact links?)\b.*\breorder(?:ed|ing)?\b/i,
  /\bfor a cleaner header\b/i,
  /\bfields reordered for consistency\b/i,
  /\breordered fields for consistency\b/i,
] as const;

export function splitCommaSeparated(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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

export function normalizeAiMessageContent(content: string) {
  return content
    .replace(/<br\s*\/?>/gi, AI_LINE_BREAK_TOKEN)
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function serializeResumeData(
  title: string,
  resumeData: ResumeData,
  revision?: number
) {
  return JSON.stringify({
    title,
    revision,
    resumeData,
  });
}

export function serializeProfile(profile: ResumeProfile) {
  return JSON.stringify({
    professionalHeadline: profile.professional_headline,
    targetRoles: profile.target_roles,
    yearsExperience: profile.years_experience,
    locationPreferences: profile.location_preferences,
    coreSkills: profile.core_skills,
    educationSummary: profile.education_summary,
    domainFocus: profile.domain_focus,
    achievementNotes: profile.achievement_notes,
  });
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
  const normalizedResumeData = normalizeResumeData(resume.resume_data);
  const lines = [
    `Title: ${resume.title}`,
    `Section order: ${(normalizedResumeData.sectionOrder ?? []).join(", ") || "N/A"}`,
    `Full name: ${normalizedResumeData.personalInfo.fullName || "N/A"}`,
    `Email: ${normalizedResumeData.personalInfo.email || "N/A"}`,
    `Phone: ${normalizedResumeData.personalInfo.phone || "N/A"}`,
  ];

  normalizedResumeData.education.forEach((entry, index) => {
    lines.push(
      `Education ${index + 1}: ${entry.degree} at ${entry.institution} (${entry.dateRange})`
    );
  });

  normalizedResumeData.experience.forEach((entry, index) => {
    lines.push(
      `Experience ${index + 1}: ${entry.position} at ${entry.company} (${entry.dateRange})`
    );
    entry.description.forEach((bullet, bulletIndex) => {
      if (bullet.trim()) {
        lines.push(`- Experience ${index + 1} bullet ${bulletIndex + 1}: ${bullet}`);
      }
    });
  });

  normalizedResumeData.skills.forEach((entry) => {
    lines.push(`Skills ${entry.category}: ${entry.items.join(", ")}`);
  });

  normalizedResumeData.projects?.forEach((entry, index) => {
    lines.push(
      `Project ${index + 1}: ${entry.name} (${entry.link || "no link"})`
    );
    if (entry.linkLabel?.trim()) {
      lines.push(`- Project ${index + 1} link label: ${entry.linkLabel}`);
    }
    if ((entry.technologies ?? []).length > 0) {
      lines.push(
        `- Project ${index + 1} technologies: ${(entry.technologies ?? []).join(", ")}`
      );
    }
    (entry.description ?? []).forEach((bullet, bulletIndex) => {
      if (bullet.trim()) {
        lines.push(`- Project ${index + 1} bullet ${bulletIndex + 1}: ${bullet}`);
      }
    });
  });

  normalizedResumeData.coCurricularActivities?.forEach((entry, index) => {
    lines.push(
      `Activity ${index + 1}: ${entry.position} at ${entry.organization} (${entry.dateRange})`
    );
  });

  normalizedResumeData.certificationsAwards?.forEach((entry, index) => {
    lines.push(
      `Certification or award ${index + 1}: ${entry.name} (${entry.description || "no description"})`
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

  return JSON.stringify(canonicalizeForDiff(value));
}

function canonicalizeForDiff(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeForDiff(item));
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        const nestedValue = (value as Record<string, unknown>)[key];
        if (nestedValue !== undefined) {
          accumulator[key] = canonicalizeForDiff(nestedValue);
        }
        return accumulator;
      }, {});
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return value;
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

export function includesForbiddenFieldOrderLanguage(text: string) {
  return FIELD_ORDER_LANGUAGE_PATTERNS.some((pattern) => pattern.test(text));
}

function humanizeSectionLabel(section: string) {
  if (section === "Section order") {
    return "section order";
  }

  return section.toLowerCase();
}

export function buildSafeChangeSummary(diffItems: ResumeChangeDiffItem[]) {
  if (diffItems.length === 0) {
    return "No safe, material changes were applied to the current resume.";
  }

  const nonOrderSections = diffItems
    .filter((item) => item.section !== "Section order")
    .map((item) => item.section);
  const uniqueNonOrderSections = [...new Set(nonOrderSections)];
  const changedSectionList = uniqueNonOrderSections
    .slice(0, 3)
    .map(humanizeSectionLabel);
  const changedSectionText =
    changedSectionList.length === 0
      ? ""
      : changedSectionList.length === 1
        ? changedSectionList[0]
        : `${changedSectionList.slice(0, -1).join(", ")} and ${
            changedSectionList[changedSectionList.length - 1]
          }`;
  const sectionOrderChanged = diffItems.some(
    (item) => item.section === "Section order"
  );

  if (changedSectionText && sectionOrderChanged) {
    return `Updated ${changedSectionText} and adjusted the resume section order for a stronger flow.`;
  }

  if (changedSectionText) {
    return `Updated ${changedSectionText} while keeping the resume grounded in the existing evidence.`;
  }

  if (sectionOrderChanged) {
    return "Adjusted the order of the resume sections to improve the overall flow while keeping the section contents the same.";
  }

  return "Applied grounded updates to the current resume.";
}

function compactDiffValue(value: string) {
  const normalized = value
    .replace(/\s+/g, " ")
    .replace(/\\"/g, '"')
    .trim();

  if (!normalized || normalized === "(empty)") {
    return "(empty)";
  }

  if (normalized.length <= 140) {
    return normalized;
  }

  return `${normalized.slice(0, 137)}...`;
}

function joinWithAnd(values: string[]) {
  if (values.length === 0) {
    return "";
  }

  if (values.length === 1) {
    return values[0];
  }

  if (values.length === 2) {
    return `${values[0]} and ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

function sentenceCase(value: string) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function normalizeTextValue(value?: string | null) {
  return value?.trim() ?? "";
}

function normalizeStringArray(values?: string[] | null) {
  return (values ?? []).map((value) => value.trim());
}

function arraysMatch(valuesA: string[], valuesB: string[]) {
  if (valuesA.length !== valuesB.length) {
    return false;
  }

  return valuesA.every((value, index) => value === valuesB[index]);
}

function parseDiffValue<T>(value: string, fallback: T): T {
  if (!value || value === "(empty)") {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function humanizeSectionOrderValue(value: string) {
  const sectionLabels: Record<string, string> = {
    personal: "Personal Info",
    education: "Education",
    experience: "Experience",
    cocurricular: "Co-curricular Activities",
    skills: "Skills",
    projects: "Projects",
    certificationsAwards: "Certifications & Awards",
  };

  try {
    const parsed = JSON.parse(value) as string[];
    if (Array.isArray(parsed)) {
      return parsed
        .map((sectionId) => sectionLabels[sectionId] ?? sectionId)
        .join(" -> ");
    }
  } catch {
    return compactDiffValue(value);
  }

  return compactDiffValue(value);
}

type EditTableRow = {
  section: string;
  change: string;
};

function buildEntryTitle(parts: Array<string | undefined>) {
  return parts.map((part) => normalizeTextValue(part)).filter(Boolean).join(" ");
}

function buildEntrySectionLabel(base: string, entryTitle: string) {
  return entryTitle ? `${base} - ${entryTitle}` : base;
}

function getChangedPersonalInfoFields(
  before: PersonalInfo,
  after: PersonalInfo
) {
  const fieldLabels: Array<[keyof PersonalInfo, string]> = [
    ["fullName", "full name"],
    ["email", "email"],
    ["phone", "phone number"],
    ["linkedin", "LinkedIn link"],
    ["github", "GitHub link"],
    ["website", "website"],
  ];

  return fieldLabels
    .filter(([field]) => normalizeTextValue(before[field]) !== normalizeTextValue(after[field]))
    .map(([, label]) => label);
}

function describePersonalInfoDiff(diffItem: ResumeChangeDiffItem): EditTableRow[] {
  const before = parseDiffValue<PersonalInfo>(diffItem.before, {
    fullName: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    website: "",
  });
  const after = parseDiffValue<PersonalInfo>(diffItem.after, before);
  const changedFields = getChangedPersonalInfoFields(before, after);

  if (changedFields.length === 0) {
    return [];
  }

  return [
    {
      section: "Personal Info",
      change: `Updated ${joinWithAnd(changedFields)}.`,
    },
  ];
}

function getChangedScalarFields<T extends object>(
  before: T,
  after: T,
  fields: Array<[keyof T, string]>
) {
  return fields
    .filter(([field]) => normalizeTextValue(String(before[field] ?? "")) !== normalizeTextValue(String(after[field] ?? "")))
    .map(([, label]) => label);
}

function describeEducationDiff(diffItem: ResumeChangeDiffItem): EditTableRow[] {
  const beforeEntries = parseDiffValue<Education[]>(diffItem.before, []);
  const afterEntries = parseDiffValue<Education[]>(diffItem.after, []);
  const beforeMap = new Map(beforeEntries.map((entry) => [entry.id, entry]));
  const rows: EditTableRow[] = [];

  for (const entry of afterEntries) {
    const previous = beforeMap.get(entry.id);
    const section = buildEntrySectionLabel(
      "Education",
      entry.institution || entry.degree || "Entry"
    );

    if (!previous) {
      rows.push({
        section,
        change: "Added this education entry.",
      });
      continue;
    }

    const changedFields = getChangedScalarFields(previous, entry, [
      ["institution", "institution"],
      ["location", "location"],
      ["degree", "degree"],
      ["gpa", "GPA"],
      ["dateRange", "date range"],
    ]);

    if (changedFields.length > 0) {
      rows.push({
        section,
        change: `Updated ${joinWithAnd(changedFields)}.`,
      });
    }
  }

  for (const entry of beforeEntries) {
    if (!afterEntries.some((candidate) => candidate.id === entry.id)) {
      rows.push({
        section: buildEntrySectionLabel(
          "Education",
          entry.institution || entry.degree || "Entry"
        ),
        change: "Removed this education entry.",
      });
    }
  }

  return rows;
}

function describeExperienceStyleChange(
  descriptionChanged: boolean,
  detailsChanged: string[],
  added: boolean,
  removed: boolean
) {
  if (added) {
    return "Added this experience entry.";
  }

  if (removed) {
    return "Removed this experience entry.";
  }

  const lines: string[] = [];
  if (detailsChanged.length > 0) {
    lines.push(`Updated ${joinWithAnd(detailsChanged)}.`);
  }

  if (descriptionChanged) {
    lines.push(
      "Rewrote the bullet points to improve role relevance, clarity, and impact."
    );
  }

  return lines.length > 0 ? lines.join("\n") : "Updated this experience entry.";
}

function describeExperienceDiff(diffItem: ResumeChangeDiffItem): EditTableRow[] {
  const beforeEntries = parseDiffValue<Experience[]>(diffItem.before, []);
  const afterEntries = parseDiffValue<Experience[]>(diffItem.after, []);
  const beforeMap = new Map(beforeEntries.map((entry) => [entry.id, entry]));
  const rows: EditTableRow[] = [];

  for (const entry of afterEntries) {
    const previous = beforeMap.get(entry.id);
    const section = buildEntrySectionLabel(
      "Experience",
      buildEntryTitle([entry.position, entry.company ? `(${entry.company})` : ""])
    );

    if (!previous) {
      rows.push({
        section,
        change: describeExperienceStyleChange(false, [], true, false),
      });
      continue;
    }

    const changedFields = getChangedScalarFields(previous, entry, [
      ["position", "position"],
      ["company", "company"],
      ["location", "location"],
      ["dateRange", "date range"],
    ]);
    const descriptionChanged = !arraysMatch(
      normalizeStringArray(previous.description),
      normalizeStringArray(entry.description)
    );

    if (changedFields.length > 0 || descriptionChanged) {
      rows.push({
        section,
        change: describeExperienceStyleChange(
          descriptionChanged,
          changedFields,
          false,
          false
        ),
      });
    }
  }

  for (const entry of beforeEntries) {
    if (!afterEntries.some((candidate) => candidate.id === entry.id)) {
      rows.push({
        section: buildEntrySectionLabel(
          "Experience",
          buildEntryTitle([entry.position, entry.company ? `(${entry.company})` : ""])
        ),
        change: describeExperienceStyleChange(false, [], false, true),
      });
    }
  }

  return rows;
}

function describeCoCurricularDiff(diffItem: ResumeChangeDiffItem): EditTableRow[] {
  const beforeEntries = parseDiffValue<CoCurricularActivity[]>(diffItem.before, []);
  const afterEntries = parseDiffValue<CoCurricularActivity[]>(diffItem.after, []);
  const beforeMap = new Map(beforeEntries.map((entry) => [entry.id, entry]));
  const rows: EditTableRow[] = [];

  for (const entry of afterEntries) {
    const previous = beforeMap.get(entry.id);
    const section = buildEntrySectionLabel(
      "Co-curricular Activities",
      buildEntryTitle([
        entry.position,
        entry.organization ? `(${entry.organization})` : "",
      ])
    );

    if (!previous) {
      rows.push({
        section,
        change: "Added this co-curricular entry.",
      });
      continue;
    }

    const changedFields = getChangedScalarFields(previous, entry, [
      ["position", "position"],
      ["organization", "organization"],
      ["location", "location"],
      ["dateRange", "date range"],
    ]);
    const descriptionChanged = !arraysMatch(
      normalizeStringArray(previous.description),
      normalizeStringArray(entry.description)
    );
    const lines: string[] = [];

    if (changedFields.length > 0) {
      lines.push(`Updated ${joinWithAnd(changedFields)}.`);
    }

    if (descriptionChanged) {
      lines.push(
        "Rewrote the bullet points to highlight leadership, initiative, and impact more clearly."
      );
    }

    if (lines.length > 0) {
      rows.push({
        section,
        change: lines.join("\n"),
      });
    }
  }

  for (const entry of beforeEntries) {
    if (!afterEntries.some((candidate) => candidate.id === entry.id)) {
      rows.push({
        section: buildEntrySectionLabel(
          "Co-curricular Activities",
          buildEntryTitle([
            entry.position,
            entry.organization ? `(${entry.organization})` : "",
          ])
        ),
        change: "Removed this co-curricular entry.",
      });
    }
  }

  return rows;
}

function describeSkillsDiff(diffItem: ResumeChangeDiffItem): EditTableRow[] {
  const beforeEntries = parseDiffValue<Skill[]>(diffItem.before, []);
  const afterEntries = parseDiffValue<Skill[]>(diffItem.after, []);
  const beforeMap = new Map(beforeEntries.map((entry) => [entry.category, entry]));
  const rows: EditTableRow[] = [];

  for (const entry of afterEntries) {
    const previous = beforeMap.get(entry.category);
    const section = buildEntrySectionLabel("Skills", entry.category || "Category");

    if (!previous) {
      rows.push({
        section,
        change: "Added this skill category.",
      });
      continue;
    }

    const categoryChanged =
      normalizeTextValue(previous.category) !== normalizeTextValue(entry.category);
    const itemsChanged = !arraysMatch(
      normalizeStringArray(previous.items),
      normalizeStringArray(entry.items)
    );
    const lines: string[] = [];

    if (categoryChanged) {
      lines.push("Updated the skill category name.");
    }

    if (itemsChanged) {
      lines.push("Updated the skills listed in this category.");
    }

    if (lines.length > 0) {
      rows.push({
        section,
        change: lines.join("\n"),
      });
    }
  }

  for (const entry of beforeEntries) {
    if (!afterEntries.some((candidate) => candidate.category === entry.category)) {
      rows.push({
        section: buildEntrySectionLabel("Skills", entry.category || "Category"),
        change: "Removed this skill category.",
      });
    }
  }

  return rows;
}

function describeProjectsDiff(diffItem: ResumeChangeDiffItem): EditTableRow[] {
  const beforeEntries = parseDiffValue<Project[]>(diffItem.before, []);
  const afterEntries = parseDiffValue<Project[]>(diffItem.after, []);
  const beforeMap = new Map(beforeEntries.map((entry) => [entry.id, entry]));
  const rows: EditTableRow[] = [];

  for (const entry of afterEntries) {
    const previous = beforeMap.get(entry.id);
    const section = buildEntrySectionLabel("Projects", entry.name || "Project");

    if (!previous) {
      rows.push({
        section,
        change: "Added this project entry.",
      });
      continue;
    }

    const changedFields = getChangedScalarFields(previous, entry, [
      ["name", "project name"],
      ["link", "project link"],
      ["linkLabel", "project link label"],
    ]);
    const technologiesChanged = !arraysMatch(
      normalizeStringArray(previous.technologies ?? []),
      normalizeStringArray(entry.technologies ?? [])
    );
    const bulletsChanged = !arraysMatch(
      normalizeStringArray(previous.description ?? []),
      normalizeStringArray(entry.description ?? [])
    );
    const lines: string[] = [];

    if (changedFields.length > 0) {
      lines.push(`Updated ${joinWithAnd(changedFields)}.`);
    }

    if (technologiesChanged) {
      lines.push("Updated the technologies listed for this project.");
    }

    if (bulletsChanged) {
      lines.push("Updated the project bullet points.");
    }

    if (lines.length > 0) {
      rows.push({
        section,
        change: lines.join("\n"),
      });
    }
  }

  for (const entry of beforeEntries) {
    if (!afterEntries.some((candidate) => candidate.id === entry.id)) {
      rows.push({
        section: buildEntrySectionLabel("Projects", entry.name || "Project"),
        change: "Removed this project entry.",
      });
    }
  }

  return rows;
}

function describeCertificationsAwardsDiff(
  diffItem: ResumeChangeDiffItem
): EditTableRow[] {
  const beforeEntries = parseDiffValue<CertificationAward[]>(diffItem.before, []);
  const afterEntries = parseDiffValue<CertificationAward[]>(diffItem.after, []);
  const beforeMap = new Map(beforeEntries.map((entry) => [entry.id, entry]));
  const rows: EditTableRow[] = [];

  for (const entry of afterEntries) {
    const previous = beforeMap.get(entry.id);
    const section = buildEntrySectionLabel(
      "Certifications & Awards",
      entry.name || "Entry"
    );

    if (!previous) {
      rows.push({
        section,
        change: "Added this certification or award entry.",
      });
      continue;
    }

    const changedFields = getChangedScalarFields(previous, entry, [
      ["name", "name"],
      ["description", "description"],
    ]);

    if (changedFields.length > 0) {
      rows.push({
        section,
        change: `Updated ${joinWithAnd(changedFields)}.`,
      });
    }
  }

  for (const entry of beforeEntries) {
    if (!afterEntries.some((candidate) => candidate.id === entry.id)) {
      rows.push({
        section: buildEntrySectionLabel(
          "Certifications & Awards",
          entry.name || "Entry"
        ),
        change: "Removed this certification or award entry.",
      });
    }
  }

  return rows;
}

function describeSectionOrderDiff(diffItem: ResumeChangeDiffItem): EditTableRow[] {
  return [
    {
      section: "Section Order",
      change: `Reordered sections to: ${humanizeSectionOrderValue(diffItem.after)}`,
    },
  ];
}

function describeDiffRows(diffItem: ResumeChangeDiffItem): EditTableRow[] {
  if (diffItem.section === "Section order") {
    return describeSectionOrderDiff(diffItem);
  }

  if (diffItem.section === "Personal info") {
    return describePersonalInfoDiff(diffItem);
  }

  if (diffItem.section === "Education") {
    return describeEducationDiff(diffItem);
  }

  if (diffItem.section === "Experience") {
    return describeExperienceDiff(diffItem);
  }

  if (diffItem.section === "Co-curricular activities") {
    return describeCoCurricularDiff(diffItem);
  }

  if (diffItem.section === "Skills") {
    return describeSkillsDiff(diffItem);
  }

  if (diffItem.section === "Projects") {
    return describeProjectsDiff(diffItem);
  }

  if (diffItem.section === "Certifications & awards") {
    return describeCertificationsAwardsDiff(diffItem);
  }

  if (diffItem.before === "(empty)" && diffItem.after !== "(empty)") {
    return [
      {
        section: sentenceCase(diffItem.section),
        change: `Added content: ${compactDiffValue(diffItem.after)}`,
      },
    ];
  }

  if (diffItem.before !== "(empty)" && diffItem.after === "(empty)") {
    return [
      {
        section: sentenceCase(diffItem.section),
        change: "Removed previous content.",
      },
    ];
  }

  return [
    {
      section: sentenceCase(diffItem.section),
      change: `Updated content from ${compactDiffValue(
        diffItem.before
      )} to ${compactDiffValue(diffItem.after)}`,
    },
  ];
}

export function buildEditAssistantMessage(payload: {
  summary: string;
  diffItems: ResumeChangeDiffItem[];
}) {
  const safeSummary = sanitizeChangeSummary(payload.summary, payload.diffItems);

  if (payload.diffItems.length === 0) {
    return normalizeAiMessageContent(
      `${safeSummary}\n\nNo material changes were applied to the active resume.`
    );
  }

  const rows = payload.diffItems
    .flatMap((diffItem) => describeDiffRows(diffItem))
    .map((row) => {
      const section = row.section.replace(/\*/g, "\\*");
      const change = row.change.replace(/\n/g, "<br />");
      return `- **${section}**: ${change}`;
    })
    .join("\n");

  return normalizeAiMessageContent(
    `${safeSummary}

## Summary of Changes

${rows}

The active resume has been updated. You can undo this AI change if needed.`
  );
}

export function buildNoMaterialChangeAssistantMessage(payload: {
  latestUserMessage: string;
  summary?: string | null;
}) {
  const normalizedRequest = payload.latestUserMessage.toLowerCase();
  const isEditLikeRequest =
    /\b(edit|rewrite|revise|update|fix|improve|tailor|optimi[sz]e|implement|apply|change)\b/.test(
      normalizedRequest
    );

  const contextualSummary = normalizeAiMessageContent(payload.summary ?? "");

  if (!isEditLikeRequest && contextualSummary) {
    return contextualSummary;
  }

  return normalizeAiMessageContent(
    `${contextualSummary || "I reviewed your request against the active resume and the available evidence."}

I did not apply any material changes because the current resume already appears adequately aligned with this request based on the information available to me.

If you want, I can still take a more aggressive pass by focusing on a specific section, role, or bullet set.`
  );
}

export function sanitizeChangeSummary(
  summary: string,
  diffItems: ResumeChangeDiffItem[]
) {
  const normalizedSummary = normalizeAiMessageContent(summary);

  if (!normalizedSummary) {
    return buildSafeChangeSummary(diffItems);
  }

  if (includesForbiddenFieldOrderLanguage(normalizedSummary)) {
    return buildSafeChangeSummary(diffItems);
  }

  return normalizedSummary;
}

export function sanitizeReviewOutput(payload: {
  summary: string;
  findings: ResumeReviewFinding[];
}) {
  const findings = payload.findings
    .map((finding) => ({
      ...finding,
      title: normalizeAiMessageContent(finding.title),
      rationale: normalizeAiMessageContent(finding.rationale),
      recommendation: normalizeAiMessageContent(finding.recommendation),
    }))
    .filter((finding) => {
      const combinedText = `${finding.title}\n${finding.rationale}\n${finding.recommendation}`;
      return !includesForbiddenFieldOrderLanguage(combinedText);
    });

  let summary = normalizeAiMessageContent(payload.summary);
  if (includesForbiddenFieldOrderLanguage(summary)) {
    summary =
      findings.length > 0
        ? "Focus on content, impact, tailoring, and section order improvements rather than field arrangement within sections."
        : "No field-order changes are needed. Resumeow keeps field arrangement fixed within each section.";
  }

  return {
    summary,
    findings,
  };
}

export function diffResumeData(
  before: ResumeData,
  after: ResumeData
): ResumeChangeDiffItem[] {
  const normalizedBefore = normalizeResumeData(before);
  const normalizedAfter = normalizeResumeData(after);
  const diffs: ResumeChangeDiffItem[] = [];

  collectDiffs(
    "Personal info",
    normalizedBefore.personalInfo,
    normalizedAfter.personalInfo,
    diffs
  );
  collectDiffs("Education", normalizedBefore.education, normalizedAfter.education, diffs);
  collectDiffs("Experience", normalizedBefore.experience, normalizedAfter.experience, diffs);
  collectDiffs(
    "Co-curricular activities",
    normalizedBefore.coCurricularActivities ?? [],
    normalizedAfter.coCurricularActivities ?? [],
    diffs
  );
  collectDiffs("Skills", normalizedBefore.skills, normalizedAfter.skills, diffs);
  collectDiffs("Projects", normalizedBefore.projects ?? [], normalizedAfter.projects ?? [], diffs);
  collectDiffs(
    "Certifications & awards",
    normalizedBefore.certificationsAwards ?? [],
    normalizedAfter.certificationsAwards ?? [],
    diffs
  );
  collectDiffs(
    "Section order",
    normalizedBefore.sectionOrder ?? [],
    normalizedAfter.sectionOrder ?? [],
    diffs
  );

  return diffs;
}

export function sseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}
