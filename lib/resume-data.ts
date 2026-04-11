import {
  DEFAULT_RESUME_DATA,
  ResumeData,
  ResumeSectionId,
} from "@/lib/types/resume";

export const DEFAULT_SECTION_ORDER: ResumeSectionId[] = [
  "personal",
  "education",
  "experience",
  "cocurricular",
  "skills",
  "projects",
  "certificationsAwards",
];

const VALID_SECTION_IDS = new Set<ResumeSectionId>(DEFAULT_SECTION_ORDER);

export function normalizeSectionOrder(
  sectionOrder?: unknown
): ResumeSectionId[] {
  const ordered = Array.isArray(sectionOrder)
    ? sectionOrder.filter(
        (value): value is ResumeSectionId =>
          typeof value === "string" && VALID_SECTION_IDS.has(value as ResumeSectionId)
      )
    : [];

  const deduped = ordered.filter(
    (value, index) => ordered.indexOf(value) === index && value !== "personal"
  );

  return [
    "personal",
    ...deduped,
    ...DEFAULT_SECTION_ORDER.filter(
      (sectionId) => sectionId !== "personal" && !deduped.includes(sectionId)
    ),
  ];
}

export function normalizeResumeData(
  resumeData?: Partial<ResumeData> | null
): ResumeData {
  return {
    personalInfo: resumeData?.personalInfo ?? DEFAULT_RESUME_DATA.personalInfo,
    education: resumeData?.education ?? [],
    experience: resumeData?.experience ?? [],
    coCurricularActivities: resumeData?.coCurricularActivities ?? [],
    skills: resumeData?.skills ?? [],
    projects: resumeData?.projects ?? [],
    certificationsAwards: resumeData?.certificationsAwards ?? [],
    sectionOrder: normalizeSectionOrder(resumeData?.sectionOrder),
  };
}

export function reorderResumeSections(
  currentOrder: ResumeSectionId[],
  draggedId: ResumeSectionId,
  targetId: ResumeSectionId
): ResumeSectionId[] {
  if (
    draggedId === targetId ||
    draggedId === "personal" ||
    targetId === "personal"
  ) {
    return normalizeSectionOrder(currentOrder);
  }

  const normalized = normalizeSectionOrder(currentOrder);
  const nextOrder = normalized.filter((sectionId) => sectionId !== draggedId);
  const targetIndex = nextOrder.indexOf(targetId);

  if (targetIndex === -1) {
    return normalized;
  }

  nextOrder.splice(targetIndex, 0, draggedId);
  return normalizeSectionOrder(nextOrder);
}
