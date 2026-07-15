export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface Experience {
  id: string;
  position: string;
  dateRange: string;
  company: string;
  location: string;
  description: string[];
}

export interface Education {
  id: string;
  institution: string;
  location: string;
  degree: string;
  gpa?: string;
  dateRange: string;
}

export interface Skill {
  category: string;
  items: string[];
}

export interface Project {
  id: string;
  name: string;
  link?: string;
  linkLabel?: string;
  technologies?: string[];
  description?: string[];
}

export interface CoCurricularActivity {
  id: string;
  position: string;
  dateRange: string;
  organization: string;
  location: string;
  description: string[];
}

export interface CertificationAward {
  id: string;
  name: string;
  description: string;
}

export type ResumeSectionId =
  | "personal"
  | "education"
  | "experience"
  | "cocurricular"
  | "skills"
  | "projects"
  | "certificationsAwards";

export interface ResumeData {
  personalInfo: PersonalInfo;
  education: Education[];
  experience: Experience[];
  coCurricularActivities?: CoCurricularActivity[];
  skills: Skill[];
  projects?: Project[];
  certificationsAwards?: CertificationAward[];
  sectionOrder?: ResumeSectionId[];
}

export interface SavedResume {
  id: string;
  user_id: string;
  title: string;
  resume_data: ResumeData;
  created_at: string;
  updated_at: string;
  resume_revision: number;
}

export interface ResumeProfile {
  id: string;
  user_id: string;
  professional_headline: string;
  target_roles: string[];
  years_experience: number | null;
  location_preferences: string[];
  core_skills: string[];
  education_summary: string;
  domain_focus: string[];
  achievement_notes: string;
  created_at: string;
  updated_at: string;
}

export interface ResumeCitation {
  source_type:
    | "active_resume"
    | "user_profile_docs"
    | "user_resume_history"
    | "job_descriptions"
    | "internal_resume_guides";
  source_label: string;
  document_id?: string;
  chunk_id?: string;
  excerpt?: string;
}

export type ResumeAiToolName =
  | "get_active_resume"
  | "get_user_profile"
  | "get_resume_history"
  | "get_target_job_context"
  | "retrieve_relevant_experience"
  | "review_resume_overall"
  | "check_resume_against_job"
  | "find_weak_bullets"
  | "suggest_missing_content"
  | "detect_repetition_or_wordiness"
  | "validate_factual_consistency"
  | "check_format_constraints"
  | "check_page_fit"
  | "score_ats_alignment"
  | "trim_resume_to_one_page"
  | "rewrite_bullet"
  | "tailor_resume_to_job"
  | "reorder_resume_sections"
  | "apply_resume_patch";

export type ResumeAiProcessPhase =
  | "planning"
  | "context"
  | "reasoning"
  | "apply";

export interface ResumePatchOperation {
  type: "replace_resume_data";
  reason: string;
  summary: string;
  resume_data: ResumeData;
  citations?: ResumeCitation[];
}

export interface ResumeAiToolResult {
  toolName: ResumeAiToolName;
  toolDisplayName: string;
  summary: string;
  citations?: ResumeCitation[];
  data?: Record<string, unknown>;
  patchOperations?: ResumePatchOperation[];
  updatedResume?: SavedResume | null;
  changeSet?: ResumeChangeSet | null;
  diffItems?: ResumeChangeDiffItem[];
  mutatedResume?: boolean;
}

export interface ResumeAiRunMetadata {
  runId: string;
  stepNumber?: number;
  toolName?: ResumeAiToolName | null;
  toolDisplayName?: string | null;
  kind?: "guardrail" | "tool_result" | "planner_note" | "final";
  mutatedResume?: boolean;
  stepLabel?: string | null;
  phase?: ResumeAiProcessPhase | null;
}

export interface ResumeReviewFinding {
  id: string;
  category: "content" | "clarity" | "impact" | "tailoring" | "format";
  severity: "low" | "medium" | "high";
  title: string;
  rationale: string;
  recommendation: string;
  citations: ResumeCitation[];
}

export interface ResumeChangeDiffItem {
  section: string;
  label: string;
  before: string;
  after: string;
}

export interface ResumeChangeSet {
  id: string;
  user_id: string;
  resume_id: string;
  base_resume_revision: number;
  prompt: string;
  summary: string;
  status: "draft" | "applied" | "stale" | "discarded" | "reverted";
  previous_resume_data?: ResumeData | null;
  proposed_resume_data: ResumeData;
  diff_items: ResumeChangeDiffItem[];
  citations: ResumeCitation[];
  created_at: string;
  updated_at: string;
  applied_at?: string | null;
}

export interface ResumeAiGuardrailMetadata {
  blocked: true;
  category: "scope" | "safety";
  code: "out_of_scope" | "explicit_content" | "needs_scope_clarification";
}

export interface ResumeAiMessageMetadata extends Record<string, unknown> {
  guardrail?: ResumeAiGuardrailMetadata;
  orchestration?: ResumeAiRunMetadata;
  changeSet?: ResumeChangeSet;
  diffItems?: ResumeChangeDiffItem[];
  findings?: Array<{
    id: string;
    title: string;
    severity: string;
    recommendation: string;
  }>;
}

export interface ResumeAiMessage {
  id: string;
  user_id: string;
  resume_id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  tool_name?: string | null;
  tool_call_id?: string | null;
  metadata?: ResumeAiMessageMetadata | null;
  created_at: string;
}

export interface ResumeJobDescription {
  id: string;
  user_id: string;
  title: string;
  company: string;
  role: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ResumeAiRateLimitStatus {
  action: string;
  allowed: boolean;
  current_count: number;
  limit_value: number;
  retry_after_seconds: number;
  window_started_at: string;
}

export const DEFAULT_RESUME_DATA: ResumeData = {
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    linkedin: "",
    github: "",
    website: "",
  },
  education: [],
  experience: [],
  coCurricularActivities: [],
  skills: [],
  projects: [],
  certificationsAwards: [],
  sectionOrder: [
    "personal",
    "education",
    "experience",
    "cocurricular",
    "skills",
    "projects",
    "certificationsAwards",
  ],
};

export const DEFAULT_RESUME_PROFILE: Omit<
  ResumeProfile,
  "id" | "user_id" | "created_at" | "updated_at"
> = {
  professional_headline: "",
  target_roles: [],
  years_experience: null,
  location_preferences: [],
  core_skills: [],
  education_summary: "",
  domain_focus: [],
  achievement_notes: "",
};
