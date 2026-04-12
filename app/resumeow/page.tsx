"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import {
  CertificationAward,
  CoCurricularActivity,
  DEFAULT_RESUME_DATA,
  DEFAULT_RESUME_PROFILE,
  Education,
  Experience,
  PersonalInfo,
  Project,
  ResumeAiMessage,
  ResumeAiProcessPhase,
  ResumeChangeSet,
  ResumeJobDescription,
  ResumeProfile,
  ResumeData,
  ResumeSectionId,
  SavedResume,
  Skill,
} from "@/lib/types/resume";
import { CertificationsAwardsForm } from "@/components/resumeow/certifications-awards-form";
import { PersonalInfoForm } from "@/components/resumeow/personal-info-form";
import { ExperienceForm } from "@/components/resumeow/experience-form";
import { EducationForm } from "@/components/resumeow/education-form";
import { SkillsForm } from "@/components/resumeow/skills-form";
import { ProjectsForm } from "@/components/resumeow/projects-form";
import { CoCurricularForm } from "@/components/resumeow/cocurricular-form";
import { ResumeAiSidebar } from "@/components/resumeow/ai-sidebar";
import { JobDescriptionManagerModal } from "@/components/resumeow/job-description-manager-modal";
import { ProfileModal } from "@/components/resumeow/profile-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  deleteResume,
  fetchUserResumes,
  saveResume,
} from "@/lib/services/resume-service";
import {
  deleteJobDescriptionRequest,
  fetchResumeAiState,
  fetchResumeProfile,
  saveJobDescriptionRequest,
  saveResumeProfileRequest,
  streamResumeChat,
  undoChangeSetRequest,
} from "@/lib/services/resume-ai-client";
import { generateLatexResume } from "@/lib/latex/template";
import { ScrollToBottomButton } from "@/components/shared/scroll-to-bottom";
import { normalizeResumeData, reorderResumeSections } from "@/lib/resume-data";

const PROFILE_PROMPT_DISMISSED_KEY = "resumeowProfilePromptDismissed";

type ProcessUpdate = {
  phase: ResumeAiProcessPhase;
  label: string;
};

const TAB_CONFIG: Array<{
  id: ResumeSectionId;
  label: string;
  required: boolean;
}> = [
  { id: "personal", label: "Personal Info *", required: true },
  { id: "education", label: "Education *", required: true },
  { id: "experience", label: "Experience *", required: true },
  { id: "cocurricular", label: "Co-Curricular", required: false },
  { id: "skills", label: "Skills", required: false },
  { id: "projects", label: "Projects", required: false },
  {
    id: "certificationsAwards",
    label: "Certifications & Awards",
    required: false,
  },
];

const TAB_COLOR_CLASSES: Record<
  ResumeSectionId,
  { idle: string; active: string }
> = {
  personal: {
    idle: "border-sky-500/30 bg-sky-500/12 text-sky-100 hover:bg-sky-500/18",
    active: "border-sky-400 bg-sky-500/28 text-white shadow-[0_10px_30px_rgba(14,165,233,0.22)]",
  },
  education: {
    idle:
      "border-emerald-500/30 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/18",
    active:
      "border-emerald-400 bg-emerald-500/28 text-white shadow-[0_10px_30px_rgba(16,185,129,0.22)]",
  },
  experience: {
    idle:
      "border-amber-500/30 bg-amber-500/12 text-amber-100 hover:bg-amber-500/18",
    active:
      "border-amber-400 bg-amber-500/28 text-white shadow-[0_10px_30px_rgba(245,158,11,0.22)]",
  },
  cocurricular: {
    idle:
      "border-fuchsia-500/30 bg-fuchsia-500/12 text-fuchsia-100 hover:bg-fuchsia-500/18",
    active:
      "border-fuchsia-400 bg-fuchsia-500/28 text-white shadow-[0_10px_30px_rgba(217,70,239,0.22)]",
  },
  skills: {
    idle:
      "border-cyan-500/30 bg-cyan-500/12 text-cyan-100 hover:bg-cyan-500/18",
    active:
      "border-cyan-400 bg-cyan-500/28 text-white shadow-[0_10px_30px_rgba(6,182,212,0.22)]",
  },
  projects: {
    idle:
      "border-rose-500/30 bg-rose-500/12 text-rose-100 hover:bg-rose-500/18",
    active:
      "border-rose-400 bg-rose-500/28 text-white shadow-[0_10px_30px_rgba(244,63,94,0.22)]",
  },
  certificationsAwards: {
    idle:
      "border-violet-500/30 bg-violet-500/12 text-violet-100 hover:bg-violet-500/18",
    active:
      "border-violet-400 bg-violet-500/28 text-white shadow-[0_10px_30px_rgba(139,92,246,0.22)]",
  },
};

function isBlank(value: string | undefined | null) {
  return !value?.trim();
}

function validateResumeForOutput(resumeData: ResumeData) {
  const issues: string[] = [];
  const normalizedResumeData = normalizeResumeData(resumeData);

  if (isBlank(normalizedResumeData.personalInfo.fullName)) {
    issues.push("Personal information: Full Name is required.");
  }

  if (isBlank(normalizedResumeData.personalInfo.email)) {
    issues.push("Personal information: Email is required.");
  }

  if (isBlank(normalizedResumeData.personalInfo.phone)) {
    issues.push("Personal information: Phone is required.");
  }

  if (normalizedResumeData.education.length === 0) {
    issues.push("Education: add at least one education entry.");
  }

  normalizedResumeData.education.forEach((entry, index) => {
    const missingFields = [
      isBlank(entry.institution) ? "Institution" : null,
      isBlank(entry.location) ? "Location" : null,
      isBlank(entry.degree) ? "Degree" : null,
      isBlank(entry.dateRange) ? "Date Range" : null,
    ].filter(Boolean);

    if (missingFields.length > 0) {
      issues.push(
        `Education entry ${index + 1}: fill in ${missingFields.join(", ")}.`
      );
    }
  });

  if (normalizedResumeData.experience.length === 0) {
    issues.push("Experience: add at least one experience entry.");
  }

  normalizedResumeData.experience.forEach((entry, index) => {
    const missingFields = [
      isBlank(entry.position) ? "Position" : null,
      isBlank(entry.dateRange) ? "Date Range" : null,
      isBlank(entry.company) ? "Company" : null,
      isBlank(entry.location) ? "Location" : null,
    ].filter(Boolean);

    if (missingFields.length > 0) {
      issues.push(
        `Experience entry ${index + 1}: fill in ${missingFields.join(", ")}.`
      );
    }

    entry.description.forEach((bullet, bulletIndex) => {
      if (isBlank(bullet)) {
        issues.push(
          `Experience entry ${index + 1}: remove or fill bullet ${bulletIndex + 1}.`
        );
      }
    });
  });

  (normalizedResumeData.coCurricularActivities ?? []).forEach((entry, index) => {
    const hasAnyContent =
      !isBlank(entry.position) ||
      !isBlank(entry.dateRange) ||
      !isBlank(entry.organization) ||
      !isBlank(entry.location) ||
      entry.description.some((bullet) => !isBlank(bullet));

    if (!hasAnyContent) {
      issues.push(
        `Co-curricular activity ${index + 1}: fill it in or delete the empty entry.`
      );
      return;
    }

    const missingFields = [
      isBlank(entry.position) ? "Position" : null,
      isBlank(entry.dateRange) ? "Date Range" : null,
      isBlank(entry.organization) ? "Organization" : null,
      isBlank(entry.location) ? "Location" : null,
    ].filter(Boolean);

    if (missingFields.length > 0) {
      issues.push(
        `Co-curricular activity ${index + 1}: fill in ${missingFields.join(", ")} or delete the entry.`
      );
    }

    entry.description.forEach((bullet, bulletIndex) => {
      if (isBlank(bullet)) {
        issues.push(
          `Co-curricular activity ${index + 1}: remove or fill bullet ${bulletIndex + 1}.`
        );
      }
    });
  });

  normalizedResumeData.skills.forEach((entry, index) => {
    const hasAnyContent =
      !isBlank(entry.category) || entry.items.some((item) => !isBlank(item));

    if (!hasAnyContent) {
      issues.push(
        `Skills category ${index + 1}: fill it in or delete the empty entry.`
      );
      return;
    }

    if (isBlank(entry.category)) {
      issues.push(`Skills category ${index + 1}: Category Name is required.`);
    }

    if (entry.items.length === 0 || entry.items.every((item) => isBlank(item))) {
      issues.push(`Skills category ${index + 1}: add at least one skill item.`);
    }

    entry.items.forEach((item, itemIndex) => {
      if (isBlank(item)) {
        issues.push(
          `Skills category ${index + 1}: remove or fill skill item ${itemIndex + 1}.`
        );
      }
    });
  });

  (normalizedResumeData.projects ?? []).forEach((entry, index) => {
    const hasAnyContent =
      !isBlank(entry.name) ||
      !isBlank(entry.link) ||
      !isBlank(entry.linkLabel) ||
      (entry.technologies ?? []).some((technology) => !isBlank(technology)) ||
      (entry.description ?? []).some((bullet) => !isBlank(bullet));

    if (!hasAnyContent) {
      issues.push(`Project ${index + 1}: fill it in or delete the empty entry.`);
      return;
    }

    if (isBlank(entry.name)) {
      issues.push(`Project ${index + 1}: Project Name is required.`);
    }

    if (!isBlank(entry.linkLabel) && isBlank(entry.link)) {
      issues.push(`Project ${index + 1}: Link URL is required when Link Label is filled.`);
    }

    (entry.description ?? []).forEach((bullet, bulletIndex) => {
      if (isBlank(bullet)) {
        issues.push(
          `Project ${index + 1}: remove or fill bullet ${bulletIndex + 1}.`
        );
      }
    });
  });

  (normalizedResumeData.certificationsAwards ?? []).forEach((entry, index) => {
    const hasAnyContent =
      !isBlank(entry.name) || !isBlank(entry.description);

    if (!hasAnyContent) {
      issues.push(
        `Certification or award ${index + 1}: fill it in or delete the empty entry.`
      );
      return;
    }

    if (isBlank(entry.name) || isBlank(entry.description)) {
      issues.push(
        `Certification or award ${index + 1}: both Name and Description are required.`
      );
    }
  });

  return issues;
}

export default function ResumeowPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<ResumeSectionId>("personal");
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [currentResumeId, setCurrentResumeId] = useState<string | undefined>();
  const [resumeTitle, setResumeTitle] = useState("My Resume");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showResumeList, setShowResumeList] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData>(
    normalizeResumeData(DEFAULT_RESUME_DATA)
  );
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isJobDescriptionManagerOpen, setIsJobDescriptionManagerOpen] = useState(false);
  const [hasDismissedProfilePrompt, setHasDismissedProfilePrompt] =
    useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [messages, setMessages] = useState<ResumeAiMessage[]>([]);
  const [changeSets, setChangeSets] = useState<ResumeChangeSet[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<ResumeJobDescription[]>(
    []
  );
  const [selectedJobDescriptionId, setSelectedJobDescriptionId] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const [chatErrorMessage, setChatErrorMessage] = useState<string | null>(null);
  const [activeProcessLabel, setActiveProcessLabel] = useState<string | null>(null);
  const [processUpdates, setProcessUpdates] = useState<ProcessUpdate[]>([]);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isSavingJobDescription, setIsSavingJobDescription] = useState(false);
  const [applyingChangeSetId, setApplyingChangeSetId] = useState<string | null>(
    null
  );
  const [consumedUndoChangeSetIds, setConsumedUndoChangeSetIds] = useState<string[]>(
    []
  );
  const [draggedTabId, setDraggedTabId] = useState<ResumeSectionId | null>(null);
  const hasAutoSelectedInitialResumeRef = useRef(false);

  const appendProcessUpdate = useCallback((update: ProcessUpdate) => {
    setProcessUpdates((current) => {
      const previous = current[current.length - 1];
      if (
        previous &&
        previous.label === update.label &&
        previous.phase === update.phase
      ) {
        return current;
      }

      return [...current, update].slice(-6);
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setHasDismissedProfilePrompt(
      window.localStorage.getItem(PROFILE_PROMPT_DISMISSED_KEY) === "1"
    );
  }, []);

  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [resumeData, resumeTitle]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isGenerating) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    if (isGenerating) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isGenerating]);

  useEffect(() => {
    const checkCooldown = () => {
      const cooldownEnd = localStorage.getItem("resumeGenerateCooldown");
      if (cooldownEnd) {
        const remaining = Math.max(
          0,
          Math.floor((parseInt(cooldownEnd, 10) - Date.now()) / 1000)
        );
        if (remaining > 0) {
          setCooldownSeconds(remaining);
        } else {
          localStorage.removeItem("resumeGenerateCooldown");
          setCooldownSeconds(0);
        }
      }
    };

    checkCooldown();

    const interval = setInterval(() => {
      const cooldownEnd = localStorage.getItem("resumeGenerateCooldown");
      if (cooldownEnd) {
        const remaining = Math.max(
          0,
          Math.floor((parseInt(cooldownEnd, 10) - Date.now()) / 1000)
        );
        setCooldownSeconds(remaining);
        if (remaining === 0) {
          localStorage.removeItem("resumeGenerateCooldown");
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const payload = await fetchResumeProfile();
      setProfile(payload.profile);
    } catch (error) {
      console.error("Failed to load profile", error);
    }
  }, []);

  const loadResume = useCallback((resume: SavedResume) => {
    if (isStreaming) {
      return;
    }

    setResumeData(normalizeResumeData(resume.resume_data));
    setResumeTitle(resume.title);
    setCurrentResumeId(resume.id);
    setLastSaved(new Date(resume.updated_at));
    setShowResumeList(false);
    setHasUnsavedChanges(false);
    setRateLimitMessage(null);
    setIsAiDrawerOpen(false);
    setConsumedUndoChangeSetIds([]);
  }, [isStreaming]);

  const loadResumes = useCallback(async () => {
    try {
      const resumes = await fetchUserResumes();
      setSavedResumes(resumes);

      if (
        !hasAutoSelectedInitialResumeRef.current &&
        resumes.length > 0 &&
        !currentResumeId
      ) {
        hasAutoSelectedInitialResumeRef.current = true;
        loadResume(resumes[0]);
        return;
      }

      hasAutoSelectedInitialResumeRef.current = true;
    } catch (error) {
      console.error("Error loading resumes:", error);
    }
  }, [currentResumeId, loadResume]);

  const loadAiState = useCallback(async (resumeId: string) => {
    try {
      const payload = await fetchResumeAiState(resumeId);
      setMessages(payload.messages);
      setChangeSets(payload.changeSets);
      setJobDescriptions(payload.jobDescriptions);
    } catch (error) {
      console.error("Failed to load AI state", error);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      hasAutoSelectedInitialResumeRef.current = false;
      setProfile(null);
      setMessages([]);
      setChangeSets([]);
      setJobDescriptions([]);
      return;
    }

    void loadResumes();
    void loadProfile();
  }, [user, loadProfile, loadResumes]);

  useEffect(() => {
    if (!user || !currentResumeId) {
      setMessages([]);
      setChangeSets([]);
      return;
    }

    void loadAiState(currentResumeId);
  }, [user, currentResumeId, loadAiState]);

  const handleSaveResume = async () => {
    if (!user) return;
    if (isStreaming) {
      return;
    }

    setIsSaving(true);
    try {
      const saved = await saveResume(
        normalizeResumeData(resumeData),
        resumeTitle,
        currentResumeId
      );
      setCurrentResumeId(saved.id);
      setLastSaved(new Date(saved.updated_at));
      setHasUnsavedChanges(false);
      await loadResumes();
      await loadAiState(saved.id);
      alert("Resume saved successfully!");
    } catch (error) {
      console.error("Error saving resume:", error);
      alert("Failed to save resume. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewResume = () => {
    if (isStreaming) {
      return;
    }

    setResumeData(normalizeResumeData(DEFAULT_RESUME_DATA));
    setResumeTitle("New Resume");
    setCurrentResumeId(undefined);
    setLastSaved(null);
    setShowResumeList(false);
    setHasUnsavedChanges(false);
    setMessages([]);
    setChangeSets([]);
    setConsumedUndoChangeSetIds([]);
    setStreamingText("");
    setRateLimitMessage(null);
  };

  const handleDeleteResume = async (id: string) => {
    if (isStreaming) {
      return;
    }

    if (!confirm("Are you sure you want to delete this resume?")) return;

    try {
      await deleteResume(id);
      await loadResumes();

      if (id === currentResumeId) {
        handleNewResume();
      }
      alert("Resume deleted successfully!");
    } catch (error) {
      console.error("Error deleting resume:", error);
      alert("Failed to delete resume. Please try again.");
    }
  };

  const updatePersonalInfo = (data: PersonalInfo) => {
    if (isStreaming) {
      return;
    }

    setResumeData({ ...resumeData, personalInfo: data });
  };

  const updateExperience = (data: Experience[]) => {
    if (isStreaming) {
      return;
    }

    setResumeData({ ...resumeData, experience: data });
  };

  const updateEducation = (data: Education[]) => {
    if (isStreaming) {
      return;
    }

    setResumeData({ ...resumeData, education: data });
  };

  const updateCoCurricular = (data: CoCurricularActivity[]) => {
    if (isStreaming) {
      return;
    }

    setResumeData({ ...resumeData, coCurricularActivities: data });
  };

  const updateSkills = (data: Skill[]) => {
    if (isStreaming) {
      return;
    }

    setResumeData({ ...resumeData, skills: data });
  };

  const updateProjects = (data: Project[]) => {
    if (isStreaming) {
      return;
    }

    setResumeData({ ...resumeData, projects: data });
  };

  const updateCertificationsAwards = (data: CertificationAward[]) => {
    if (isStreaming) {
      return;
    }

    setResumeData({ ...resumeData, certificationsAwards: data });
  };

  const copyLatexToClipboard = async () => {
    const validationIssues = validateResumeForOutput(resumeData);
    if (validationIssues.length > 0) {
      alert(
        `Please complete the resume before copying LaTeX:\n\n${validationIssues.join("\n")}`
      );
      return;
    }

    try {
      const latexCode = generateLatexResume(resumeData);
      await navigator.clipboard.writeText(latexCode);
      alert(
        "LaTeX code copied to clipboard! You can paste it into Overleaf or any LaTeX editor to make custom edits."
      );
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      alert("Failed to copy LaTeX code. Please try again.");
    }
  };

  const generateResume = async () => {
    const validationIssues = validateResumeForOutput(resumeData);
    if (validationIssues.length > 0) {
      alert(
        `Please complete the resume before generating it:\n\n${validationIssues.join("\n")}`
      );
      return;
    }

    if (cooldownSeconds > 0) {
      alert(
        `Please wait ${cooldownSeconds} seconds before generating another resume.`
      );
      return;
    }

    setIsGenerating(true);
    const cooldownEnd = Date.now() + 60000;
    localStorage.setItem("resumeGenerateCooldown", cooldownEnd.toString());
    setCooldownSeconds(60);

    try {
      const response = await fetch("/api/compile-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resumeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate resume");
      }

      const pdfBlob = await response.blob();
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${resumeTitle.replace(/[^a-z0-9]/gi, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert("Resume PDF downloaded successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "An error occurred while generating the resume"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveProfile = async (
    payload: Omit<ResumeProfile, "id" | "user_id" | "created_at" | "updated_at">
  ) => {
    if (isStreaming) {
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await saveResumeProfileRequest({
        ...DEFAULT_RESUME_PROFILE,
        ...payload,
      });
      setProfile(response.profile);
      setIsProfileModalOpen(false);
      window.localStorage.removeItem(PROFILE_PROMPT_DISMISSED_KEY);
      setHasDismissedProfilePrompt(false);
    } catch (error) {
      console.error("Failed to save profile", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const dismissProfilePrompt = () => {
    if (isStreaming) {
      return;
    }

    window.localStorage.setItem(PROFILE_PROMPT_DISMISSED_KEY, "1");
    setHasDismissedProfilePrompt(true);
    setIsProfileModalOpen(false);
  };

  const handleSaveJobDescription = async (payload: {
    id?: string;
    title: string;
    company: string;
    role: string;
    content: string;
  }) => {
    if (isStreaming) {
      return;
    }

    if (!payload.content.trim()) {
      return;
    }

    setIsSavingJobDescription(true);
    try {
      const response = await saveJobDescriptionRequest(payload);
      setSelectedJobDescriptionId(response.jobDescription.id);
      if (currentResumeId) {
        await loadAiState(currentResumeId);
      }
    } catch (error) {
      console.error("Failed to save job description", error);
      throw error;
    } finally {
      setIsSavingJobDescription(false);
    }
  };

  const handleDeleteJobDescription = async (jobDescriptionId: string) => {
    if (isStreaming) {
      return;
    }

    setIsSavingJobDescription(true);
    try {
      await deleteJobDescriptionRequest(jobDescriptionId);
      if (selectedJobDescriptionId === jobDescriptionId) {
        setSelectedJobDescriptionId("");
      }
      if (currentResumeId) {
        await loadAiState(currentResumeId);
      }
    } catch (error) {
      console.error("Failed to delete job description", error);
      alert("Failed to delete job description. Please try again.");
    } finally {
      setIsSavingJobDescription(false);
    }
  };

  const handleUndoChangeSet = async (changeSetId: string) => {
    if (isStreaming) {
      return;
    }
    if (consumedUndoChangeSetIds.includes(changeSetId)) {
      return;
    }

    setConsumedUndoChangeSetIds((current) =>
      current.includes(changeSetId) ? current : [...current, changeSetId]
    );
    setApplyingChangeSetId(changeSetId);
    try {
      const response = await undoChangeSetRequest(changeSetId);
      setResumeData(normalizeResumeData(response.resume.resume_data));
      setResumeTitle(response.resume.title);
      setCurrentResumeId(response.resume.id);
      setLastSaved(new Date(response.resume.updated_at));
      setHasUnsavedChanges(false);
      await loadResumes();
      await loadAiState(response.resume.id);
      alert("AI changes undone.");
    } catch (error) {
      console.error("Failed to undo AI change set", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to undo AI changes."
      );
      if (currentResumeId) {
        await loadAiState(currentResumeId);
      }
    } finally {
      setApplyingChangeSetId(null);
    }
  };

  const handleSendMessage = async (actionHint?: "review" | "edit" | null) => {
    if (!currentResumeId) {
      alert("Save this resume first to start an AI conversation.");
      return;
    }

    const fallbackPrompt =
      actionHint === "review"
        ? "Review my resume and tell me the highest-impact improvements."
        : actionHint === "edit"
          ? "Make changes to improve this resume while staying truthful."
          : "";

    const outgoingText = chatInput.trim() || fallbackPrompt;
    if (!outgoingText) {
      return;
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const interactionStartedAt = new Date().toISOString();
    setRateLimitMessage(null);
    setChatErrorMessage(null);
    setActiveProcessLabel(null);
    setProcessUpdates([]);
    setIsStreaming(true);
    setStreamingText("");
    setIsAiDrawerOpen(true);
    setChatInput("");
    setMessages((current) => [
      ...current,
      {
        id: `temp-user-${Date.now()}`,
        user_id: user?.id ?? "temp",
        resume_id: currentResumeId,
        role: "user",
        content: outgoingText,
        created_at: interactionStartedAt,
      },
    ]);

    try {
      await streamResumeChat(
        {
          resumeId: currentResumeId,
          actionHint: actionHint ?? null,
          jobDescriptionId: selectedJobDescriptionId || null,
          messages: [
            ...messages
              .filter((message) => message.role === "user" || message.role === "assistant")
              .map((message) => ({
                role: message.role,
                content: message.content,
              })),
            {
              role: "user",
              content: outgoingText,
            },
          ],
        },
        {
          onToken: (token) => {
            setActiveProcessLabel(null);
            setStreamingText((current) => current + token);
          },
          onPlannerNote: (payload) => {
            const label =
              typeof payload.label === "string" ? payload.label.trim() : "";
            if (!label) {
              return;
            }

            const phase =
              payload.phase === "context" ||
              payload.phase === "reasoning" ||
              payload.phase === "apply"
                ? payload.phase
                : "planning";

            setActiveProcessLabel(label);
            appendProcessUpdate({
              phase,
              label,
            });
          },
          onToolStart: (payload) => {
            const stepLabel =
              typeof payload.stepLabel === "string" ? payload.stepLabel : null;
            const nextLabel = stepLabel || "Working on your request...";
            const phase =
              payload.phase === "context" ||
              payload.phase === "reasoning" ||
              payload.phase === "apply"
                ? payload.phase
                : "reasoning";
            setActiveProcessLabel(nextLabel);
            appendProcessUpdate({
              phase,
              label: nextLabel,
            });
          },
          onToolResult: (payload) => {
            const updatedResume = payload.updatedResume as SavedResume | undefined;
            if (updatedResume) {
              setResumeData(normalizeResumeData(updatedResume.resume_data));
              setResumeTitle(updatedResume.title);
              setCurrentResumeId(updatedResume.id);
              setLastSaved(new Date(updatedResume.updated_at));
              setHasUnsavedChanges(false);
              void loadResumes();
            }
            const nextLabel =
              typeof payload.stepLabel === "string"
                ? `${payload.stepLabel.replace(/\.\.\.$/, "")} done. Preparing the final response...`
                : "Preparing the final response...";
            const phase =
              payload.phase === "context" ||
              payload.phase === "reasoning" ||
              payload.phase === "apply"
                ? payload.phase
                : "reasoning";
            setActiveProcessLabel(nextLabel);
            appendProcessUpdate({
              phase,
              label: nextLabel,
            });
          },
          onAssistantDone: ({ message }) => {
            setMessages((current) => {
              const withoutTempAssistantNoise = current.filter(
                (entry) => !entry.id.startsWith("temp-assistant-")
              );
              return [...withoutTempAssistantNoise, message];
            });
            setActiveProcessLabel(null);
            setProcessUpdates([]);
          },
          onError: (payload) => {
            setActiveProcessLabel(null);
            setProcessUpdates([]);
            setChatErrorMessage(payload.message);
            if (payload.rateLimit) {
              const rateLimit = payload.rateLimit as {
                retry_after_seconds?: number;
              };
              setRateLimitMessage(
                `Rate limit reached. Try again in ${rateLimit.retry_after_seconds ?? 0} seconds.`
              );
            } else {
              setRateLimitMessage(payload.message);
            }
          },
        }
      );
    } catch (error) {
      console.error("Failed to send chat message", error);
      setActiveProcessLabel(null);
      setProcessUpdates([]);
      const retryAfter =
        typeof error === "object" &&
          error !== null &&
          "rateLimit" in error &&
          typeof (error as { rateLimit?: { retry_after_seconds?: number } }).rateLimit
            ?.retry_after_seconds === "number"
          ? (error as { rateLimit?: { retry_after_seconds?: number } }).rateLimit!
            .retry_after_seconds
          : null;
      setRateLimitMessage(
        retryAfter
          ? `Rate limit reached. Try again in ${retryAfter} seconds.`
          : error instanceof Error
            ? error.message
            : "Failed to send message."
      );
      setChatErrorMessage(
        error instanceof Error ? error.message : "Failed to send message."
      );
    } finally {
      setStreamingText("");
      setIsStreaming(false);
      await loadAiState(currentResumeId);
    }
  };

  const tabs = (resumeData.sectionOrder ?? [])
    .map((sectionId) => TAB_CONFIG.find((tab) => tab.id === sectionId))
    .filter((tab): tab is (typeof TAB_CONFIG)[number] => Boolean(tab));
  const activeTabIndex = tabs.findIndex((tab) => tab.id === activeTab);

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab("personal");
    }
  }, [activeTab, tabs]);

  const handleTabDrop = (targetTabId: ResumeSectionId) => {
    if (
      isAiRunLocked ||
      !draggedTabId ||
      draggedTabId === targetTabId ||
      draggedTabId === "personal" ||
      targetTabId === "personal"
    ) {
      setDraggedTabId(null);
      return;
    }

    setResumeData((current) => ({
      ...current,
      sectionOrder: reorderResumeSections(
        current.sectionOrder ?? [],
        draggedTabId,
        targetTabId
      ),
    }));
    setDraggedTabId(null);
  };

  const renderActiveTab = () => {
    if (activeTab === "personal") {
      return (
        <PersonalInfoForm
          data={resumeData.personalInfo}
          onChange={updatePersonalInfo}
        />
      );
    }

    if (activeTab === "education") {
      return (
        <EducationForm
          data={resumeData.education}
          onChange={updateEducation}
        />
      );
    }

    if (activeTab === "experience") {
      return (
        <ExperienceForm
          data={resumeData.experience}
          onChange={updateExperience}
        />
      );
    }

    if (activeTab === "cocurricular") {
      return (
        <CoCurricularForm
          data={resumeData.coCurricularActivities || []}
          onChange={updateCoCurricular}
        />
      );
    }

    if (activeTab === "skills") {
      return <SkillsForm data={resumeData.skills} onChange={updateSkills} />;
    }

    if (activeTab === "projects") {
      return (
        <ProjectsForm
          data={resumeData.projects || []}
          onChange={updateProjects}
        />
      );
    }

    return (
      <CertificationsAwardsForm
        data={resumeData.certificationsAwards || []}
        onChange={updateCertificationsAwards}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <div className="text-xl text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <ResumeowLandingPage />;
  }

  const showProfilePrompt = !profile && !hasDismissedProfilePrompt;
  const isAiRunLocked = isStreaming;
  const visibleMessages = messages;
  const visibleChangeSets = changeSets;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {isGenerating ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-8 text-center shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-gray-600 border-t-[#E84A3A]"></div>
              <div>
                <p className="mb-2 text-xl font-semibold text-white">
                  Generating your resume...
                </p>
                <p className="text-sm text-gray-400">This may take a few seconds</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {applyingChangeSetId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-8 text-center shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-600 border-t-[#E84A3A]"></div>
              <div>
                <p className="mb-2 text-lg font-semibold text-white">
                  Undoing AI changes...
                </p>
                <p className="text-sm text-gray-400">
                  Please wait while we restore your previous resume state.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ProfileModal
        key={`${profile?.updated_at ?? "new"}:${isProfileModalOpen || showProfilePrompt ? "open" : "closed"
          }`}
        open={isProfileModalOpen || showProfilePrompt}
        profile={profile}
        onClose={showProfilePrompt ? dismissProfilePrompt : () => setIsProfileModalOpen(false)}
        onSave={handleSaveProfile}
        isSaving={isSavingProfile}
        isLocked={isAiRunLocked}
      />
      <JobDescriptionManagerModal
        open={isJobDescriptionManagerOpen}
        onClose={() => setIsJobDescriptionManagerOpen(false)}
        isLocked={isAiRunLocked}
        jobDescriptions={jobDescriptions}
        onSaveJobDescription={handleSaveJobDescription}
        onDeleteJobDescription={handleDeleteJobDescription}
        isSavingJobDescription={isSavingJobDescription}
      />

      <div className="container mx-auto px-4 py-12">
        {!showResumeList ? (
          <div className="mb-6 text-center md:mb-8">
            <h1 className="mb-3 px-2 text-3xl font-bold text-white md:mb-4 md:text-4xl lg:text-5xl">
              Resumeow
            </h1>
            <p className="mx-auto mb-2 max-w-3xl px-4 text-base text-gray-300 md:text-lg lg:text-xl">
              Create professional resumes with LaTeX quality, then use AI to
              review and draft grounded improvements before you generate the final PDF.
            </p>
            {lastSaved ? (
              <p className="px-2 text-xs text-gray-400 md:text-sm">
                Last saved: {lastSaved.toLocaleString()}
              </p>
            ) : null}
          </div>
        ) : null}

        {showResumeList ? (
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-4 px-2 text-xl font-bold text-white md:mb-6 md:text-2xl">
              Your Saved Resumes
            </h2>
            {savedResumes.length === 0 ? (
              <Card className="bg-gray-800/30 p-8 text-center">
                <p className="mb-4 text-gray-400">No saved resumes yet.</p>
                <Button onClick={handleNewResume} variant="primary">
                  Create Your First Resume
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {savedResumes.map((resume) => (
                  <Card
                    key={resume.id}
                    className="bg-gray-800/30 p-4 transition-colors hover:bg-gray-800/50 md:p-6"
                  >
                    <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
                      <div className="w-full flex-1">
                        <h3 className="mb-2 text-lg font-semibold text-white md:text-xl">
                          {resume.title}
                        </h3>
                        <p className="text-xs text-gray-400 md:text-sm">
                          Last updated: {new Date(resume.updated_at).toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 md:text-sm">
                          Revision {resume.resume_revision} • Created{" "}
                          {new Date(resume.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex w-full gap-2 sm:w-auto">
                        <Button
                          onClick={() => loadResume(resume)}
                          variant="secondary"
                          size="sm"
                          disabled={isAiRunLocked}
                          className="flex-1 sm:flex-none"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteResume(resume.id)}
                          variant="outline"
                          size="sm"
                          disabled={isAiRunLocked}
                          className="flex-1 sm:flex-none"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
              <div className="min-w-0 space-y-4 md:space-y-6">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Button
                    onClick={() => setShowResumeList(!showResumeList)}
                    variant="secondary"
                    size="sm"
                    disabled={isAiRunLocked}
                    className="text-xs sm:text-sm"
                  >
                    {showResumeList ? "Back" : "Resumes"}
                  </Button>
                  <Button
                    onClick={handleNewResume}
                    variant="outline"
                    size="sm"
                    disabled={isAiRunLocked}
                    className="text-xs sm:text-sm"
                  >
                    + New
                  </Button>
                  <Button
                    onClick={() => setIsAiDrawerOpen(true)}
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-xs sm:text-sm lg:hidden"
                  >
                    Open AI
                  </Button>
                </div>

                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <input
                    type="text"
                    value={resumeTitle}
                    onChange={(e) => {
                      if (isAiRunLocked) {
                        return;
                      }
                      setResumeTitle(e.target.value);
                    }}
                    disabled={isAiRunLocked}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-base text-white sm:max-w-md sm:text-lg md:text-xl"
                    placeholder="Resume Title"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveResume}
                      disabled={isSaving || isAiRunLocked}
                      size="sm"
                      className="flex-1 bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/20 sm:flex-none"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      onClick={generateResume}
                      disabled={isGenerating || cooldownSeconds > 0}
                      size="sm"
                      className="flex-1 sm:flex-none"
                    >
                      {isGenerating
                        ? "Generating..."
                        : cooldownSeconds > 0
                          ? `Wait ${cooldownSeconds}s`
                          : "Generate Resume"}
                    </Button>
                    <Button
                      onClick={copyLatexToClipboard}
                      variant="outline"
                      size="sm"
                      title="Copy LaTeX code to clipboard"
                      className="flex-1 sm:flex-none"
                    >
                      Copy LaTeX
                    </Button>
                  </div>
                </div>

                <Card className="relative overflow-hidden bg-gray-800/30 p-4 md:p-6">
                  {isAiRunLocked ? (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 px-6 backdrop-blur-[1px]">
                      <div className="max-w-sm rounded-xl border border-gray-700 bg-gray-900/90 px-4 py-3 text-center">
                        <p className="text-sm font-semibold text-white">
                          Resume editor temporarily locked
                        </p>
                        <p className="mt-1 text-xs text-gray-300">
                          AI is reading context and applying updates. Editing will unlock automatically once this run completes.
                        </p>
                      </div>
                    </div>
                  ) : null}
                  <div className={isAiRunLocked ? "pointer-events-none select-none opacity-80" : ""}>
                    <h3 className="mb-2 text-left text-lg font-semibold text-white">
                      Tabs Ordering
                    </h3>
                    <div className="mb-4 flex flex-col gap-1 sm:mb-4 sm:flex-row sm:gap-2 sm:overflow-x-auto sm:scrollbar-hide">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        draggable={!isAiRunLocked && tab.id !== "personal"}
                        onDragStart={(event) => {
                          if (tab.id === "personal") {
                            return;
                          }
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", tab.id);
                          event.dataTransfer.setDragImage(
                            event.currentTarget,
                            event.currentTarget.clientWidth / 2,
                            event.currentTarget.clientHeight / 2
                          );
                          setDraggedTabId(tab.id);
                        }}
                        onDragOver={(event) => {
                          if (
                            isAiRunLocked ||
                            !draggedTabId ||
                            tab.id === "personal" ||
                            draggedTabId === tab.id
                          ) {
                            return;
                          }
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          handleTabDrop(tab.id);
                        }}
                        onDragEnd={() => setDraggedTabId(null)}
                        disabled={isAiRunLocked}
                        className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium whitespace-nowrap transition-all sm:px-3 sm:py-2 md:text-sm ${tab.id !== "personal" && !isAiRunLocked ? "cursor-grab active:cursor-grabbing" : ""} ${draggedTabId === tab.id ? "scale-[1.02] shadow-2xl ring-2 ring-white/15" : ""} ${activeTab === tab.id
                            ? TAB_COLOR_CLASSES[tab.id].active
                            : TAB_COLOR_CLASSES[tab.id].idle
                          }`}
                        title={
                          tab.id === "personal"
                            ? "Personal Info stays first"
                            : isAiRunLocked
                              ? undefined
                              : "Drag to reorder"
                        }
                      >
                        {tab.label}
                      </button>
                    ))}
                    </div>
                    <p className="mb-2 text-left text-xs text-gray-400 sm:text-sm">
                      * indicates mandatory sections
                    </p>
                    <p className="text-left text-xs text-gray-500 sm:text-sm">
                      Drag the tabs above left or right to change the order of
                      the generated resume.
                    </p>
                    <div className="mb-4 mt-4 border-b border-gray-700" />

                    <div className="min-h-[400px]">
                      {renderActiveTab()}
                    </div>

                    <div className="mt-6 flex flex-col gap-3 border-t border-gray-700 pt-4 sm:flex-row sm:items-center sm:justify-between md:mt-8 md:pt-6">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (activeTabIndex > 0) {
                            setActiveTab(tabs[activeTabIndex - 1].id);
                          }
                        }}
                        disabled={activeTabIndex <= 0}
                        className="w-full sm:w-auto"
                      >
                        Previous
                      </Button>

                      {activeTabIndex < tabs.length - 1 ? (
                        <Button
                          onClick={() => {
                            if (activeTabIndex < tabs.length - 1) {
                              setActiveTab(tabs[activeTabIndex + 1].id);
                            }
                          }}
                          className="w-full sm:w-auto"
                        >
                          Next
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </Card>

                <Card className="border-gray-700 bg-gray-800/50 p-4 md:p-6">
                  <h3 className="mb-2 text-sm font-semibold text-white md:text-base">
                    How to use
                  </h3>
                  <ol className="list-decimal space-y-1 pl-5 text-xs text-gray-300 md:text-sm">
                    <li>Fill in your personal information in each tab</li>
                    <li>Add work experience, education, skills, projects, and certifications as needed</li>
                    <li>Save your resume to unlock the persistent AI assistant</li>
                    <li>Chat naturally with the AI to review, tailor, or rewrite the active resume</li>
                    <li>Generate your final PDF when you are ready</li>
                  </ol>
                  <p className="mt-3 text-xs text-gray-400">
                    Resumeow still compiles your final output with LaTeX for
                    professional formatting and quality.
                  </p>
                </Card>
              </div>

              <ResumeAiSidebar
                isOpen={isAiDrawerOpen}
                onClose={() => setIsAiDrawerOpen(false)}
                isStreaming={isStreaming}
                chatDisabled={!currentResumeId}
                chatDisabledReason={
                  !currentResumeId
                    ? "Save this resume first to start a persistent AI thread."
                    : undefined
                }
                chatInput={chatInput}
                onChatInputChange={setChatInput}
                onSendMessage={handleSendMessage}
                messages={visibleMessages}
                streamingText={streamingText}
                changeSets={visibleChangeSets}
                onUndoChangeSet={handleUndoChangeSet}
                applyingChangeSetId={applyingChangeSetId}
                consumedUndoChangeSetIds={consumedUndoChangeSetIds}
                profile={profile}
                onOpenProfile={() => {
                  if (isAiRunLocked) {
                    return;
                  }
                  setIsProfileModalOpen(true);
                }}
                onOpenJobDescriptionManager={() => {
                  if (isAiRunLocked) {
                    return;
                  }
                  setIsJobDescriptionManagerOpen(true);
                }}
                jobDescriptions={jobDescriptions}
                selectedJobDescriptionId={selectedJobDescriptionId}
                onSelectedJobDescriptionChange={(value) => {
                  if (isAiRunLocked) {
                    return;
                  }
                  setSelectedJobDescriptionId(value);
                }}
                rateLimitMessage={rateLimitMessage}
                activeProcessLabel={activeProcessLabel}
                processUpdates={processUpdates}
                errorMessage={chatErrorMessage}
                isLocked={isAiRunLocked}
              />
            </div>
          </div>
        )}
      </div>
      <ScrollToBottomButton />
    </div>
  );
}

function ResumeowLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="mb-12 text-center md:mb-24">
          <h1 className="mb-6 text-4xl font-bold text-white md:text-6xl">
            Resumeow
          </h1>
          <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-300 md:text-2xl">
            Create professional resumes with LaTeX quality and get grounded AI help to review and improve them.
          </p>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            Fill in your details, save multiple resume versions, and use the AI sidebar to review or draft improvements before you generate the final PDF.
          </p>
        </div>

        <div className="mx-auto mb-16 max-w-6xl space-y-16">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="overflow-hidden rounded-lg border border-gray-700 shadow-xl">
              <Image
                src="/landing_pages/resumeow/resumeow_intro.png"
                alt="Resumeow Introduction"
                width={800}
                height={450}
                className="h-auto w-full"
              />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                Structured editor, smarter assistance
              </h2>
              <p className="text-lg text-gray-300">
                Build your resume with the guided editor, then chat with the AI to review content, tailor drafts, and keep changes approval-based.
              </p>
            </div>
          </div>

          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="order-2 space-y-4 md:order-1">
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                Resume reviews grounded in your own data
              </h2>
              <p className="text-lg text-gray-300">
                Resumeow uses your saved profile, past resumes, selected job descriptions, and internal guidance to keep reviews and edit drafts factual.
              </p>
            </div>
            <div className="order-1 overflow-hidden rounded-lg border border-gray-700 shadow-xl md:order-2">
              <Image
                src="/landing_pages/resumeow/resumeow_experiences.png"
                alt="Add your experiences"
                width={800}
                height={450}
                className="h-auto w-full"
              />
            </div>
          </div>

          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="overflow-hidden rounded-lg border border-gray-700 shadow-xl">
              <Image
                src="/landing_pages/resumeow/resumeow_sample.png"
                alt="Sample resume output"
                width={800}
                height={450}
                className="h-auto w-full"
              />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                Keep the PDF quality
              </h2>
              <p className="text-lg text-gray-300">
                The AI helps with reasoning and drafting, but your final resume still goes through the same LaTeX PDF pipeline.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button
            onClick={() => window.location.assign("/login")}
            size="lg"
            className="cursor-pointer px-12 py-6 text-lg"
          >
            Login to Try Now
          </Button>
          <p className="mt-4 text-gray-400">
            Free to use • No credit card required
          </p>
        </div>
      </div>
      <ScrollToBottomButton />
    </div>
  );
}
