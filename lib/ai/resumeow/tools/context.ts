import { retrieveSupportingContext } from "@/lib/ai/resumeow/evidence";
import { OrchestratorToolDefinition } from "@/lib/ai/resumeow/orchestrator/types";
import {
  getJobDescriptionById,
  listUserResumes,
} from "@/lib/services/resume-server-service";
import { buildWorkingResume } from "@/lib/ai/resumeow/tools/shared";

export const contextToolDefinitions: Array<
  OrchestratorToolDefinition<Record<string, unknown>>
> = [
  {
    name: "get_active_resume",
    displayName: "Get Active Resume",
    description:
      "Load the active resume structure, section order, and entry ids before reviewing or editing.",
    category: "context",
    mutating: false,
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    buildStepLabel: () => "Reviewing the active resume structure...",
    async execute({ state }) {
      const workingResume = buildWorkingResume(
        state.baseResume,
        state.workingResumeData
      );

      const resumeData = workingResume.resume_data;

      return {
        toolName: "get_active_resume",
        toolDisplayName: "Get Active Resume",
        summary: "Loaded the active resume structure and current working draft.",
        data: {
          title: workingResume.title,
          revision: workingResume.resume_revision,
          sectionOrder: resumeData.sectionOrder ?? [],
          education: resumeData.education.map((entry) => ({
            id: entry.id,
            degree: entry.degree,
            institution: entry.institution,
          })),
          experience: resumeData.experience.map((entry) => ({
            id: entry.id,
            position: entry.position,
            company: entry.company,
            bulletCount: entry.description.length,
          })),
          skills: resumeData.skills.map((entry) => entry.category),
          projects: (resumeData.projects ?? []).map((entry) => ({
            id: entry.id,
            name: entry.name,
          })),
          coCurricularActivities: (resumeData.coCurricularActivities ?? []).map(
            (entry) => ({
              id: entry.id,
              position: entry.position,
              organization: entry.organization,
            })
          ),
          certificationsAwards: (resumeData.certificationsAwards ?? []).map(
            (entry) => ({
              id: entry.id,
              name: entry.name,
            })
          ),
        },
        mutatedResume: false,
      };
    },
  },
  {
    name: "get_user_profile",
    displayName: "Get User Profile",
    description:
      "Load the saved Resumeow AI profile to ground tailoring and review decisions.",
    category: "context",
    mutating: false,
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    buildStepLabel: () => "Reviewing the saved AI profile...",
    async execute({ state }) {
      return {
        toolName: "get_user_profile",
        toolDisplayName: "Get User Profile",
        summary: state.profile
          ? "Loaded the saved AI profile."
          : "No saved AI profile is available for this user.",
        data: {
          profile: state.profile,
        },
        mutatedResume: false,
      };
    },
  },
  {
    name: "get_resume_history",
    displayName: "Get Resume History",
    description:
      "Load the user's other saved resumes so the orchestrator can reuse grounded prior experience and positioning.",
    category: "context",
    mutating: false,
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of prior resumes to load.",
        },
      },
      additionalProperties: false,
    },
    buildStepLabel: () => "Checking prior saved resumes for relevant context...",
    async execute({ supabase, userId, state }, args: { limit?: number }) {
      const resumes = await listUserResumes(supabase, userId);
      const filtered = resumes
        .filter((resume) => resume.id !== state.baseResume.id)
        .slice(0, Math.max(1, Math.min(args.limit ?? 3, 5)))
        .map((resume) => ({
          id: resume.id,
          title: resume.title,
          updatedAt: resume.updated_at,
          sectionOrder: resume.resume_data.sectionOrder ?? [],
        }));

      return {
        toolName: "get_resume_history",
        toolDisplayName: "Get Resume History",
        summary:
          filtered.length > 0
            ? `Loaded ${filtered.length} prior saved resume${filtered.length === 1 ? "" : "s"} for grounded context.`
            : "No other saved resumes were found for this user.",
        data: {
          resumes: filtered,
        },
        mutatedResume: false,
      };
    },
  },
  {
    name: "get_target_job_context",
    displayName: "Get Target Job Context",
    description:
      "Load the currently selected job description automatically when one is selected.",
    category: "context",
    mutating: false,
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    buildStepLabel: () => "Reviewing the selected job context...",
    async execute({ supabase, userId, state }) {
      const selectedJobDescription =
        state.selectedJobDescriptionId
          ? state.selectedJobDescription ??
            (await getJobDescriptionById(
              supabase,
              userId,
              state.selectedJobDescriptionId
            ))
          : null;

      state.selectedJobDescription = selectedJobDescription;

      return {
        toolName: "get_target_job_context",
        toolDisplayName: "Get Target Job Context",
        summary: selectedJobDescription
          ? `Loaded the selected job description: ${selectedJobDescription.title}.`
          : "No job description is currently selected.",
        data: {
          selectedJobDescription,
        },
        mutatedResume: false,
      };
    },
  },
  {
    name: "retrieve_relevant_experience",
    displayName: "Retrieve Relevant Experience",
    description:
      "Load profile context, prior resume evidence, and the selected job description for the current task.",
    category: "context",
    mutating: false,
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    buildStepLabel: () => "Finding the strongest relevant experience and evidence...",
    async execute({ supabase, userId, state }) {
      const { sources, selectedJobDescription } = await retrieveSupportingContext(
        supabase,
        {
          userId,
          activeResume: buildWorkingResume(state.baseResume, state.workingResumeData),
          profile: state.profile,
          selectedJobDescriptionId: state.selectedJobDescriptionId,
          includeResumeHistory: true,
        }
      );

      state.selectedJobDescription = selectedJobDescription;

      const relevantSources = sources
        .filter((source) => source.namespace !== "active_resume")
        .slice(0, 6)
        .map((source) => ({
          citationId: source.citationId,
          sourceLabel: source.sourceLabel,
          namespace: source.namespace,
          excerpt: source.content.slice(0, 280),
        }));

      return {
        toolName: "retrieve_relevant_experience",
        toolDisplayName: "Retrieve Relevant Experience",
        summary:
          relevantSources.length > 0
            ? `Retrieved ${relevantSources.length} relevant evidence snippet${relevantSources.length === 1 ? "" : "s"} for this request.`
            : "No additional semantic evidence was retrieved beyond the active resume and saved profile.",
        data: {
          relevantSources,
          selectedJobDescription,
        },
        mutatedResume: false,
      };
    },
  },
];
