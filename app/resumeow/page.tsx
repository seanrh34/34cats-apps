"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import {
  CoCurricularActivity,
  DEFAULT_RESUME_DATA,
  DEFAULT_RESUME_PROFILE,
  Education,
  Experience,
  PersonalInfo,
  Project,
  ResumeAiMessage,
  ResumeChangeSet,
  ResumeJobDescription,
  ResumeProfile,
  ResumeData,
  SavedResume,
  Skill,
} from "@/lib/types/resume";
import { PersonalInfoForm } from "@/components/resumeow/personal-info-form";
import { ExperienceForm } from "@/components/resumeow/experience-form";
import { EducationForm } from "@/components/resumeow/education-form";
import { SkillsForm } from "@/components/resumeow/skills-form";
import { ProjectsForm } from "@/components/resumeow/projects-form";
import { CoCurricularForm } from "@/components/resumeow/cocurricular-form";
import { ResumeAiSidebar } from "@/components/resumeow/ai-sidebar";
import { ProfileModal } from "@/components/resumeow/profile-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  deleteResume,
  fetchUserResumes,
  saveResume,
} from "@/lib/services/resume-service";
import {
  fetchResumeAiState,
  fetchResumeProfile,
  saveJobDescriptionRequest,
  saveResumeProfileRequest,
  streamResumeChat,
  undoChangeSetRequest,
} from "@/lib/services/resume-ai-client";
import { generateLatexResume } from "@/lib/latex/template";
import { ScrollToBottomButton } from "@/components/shared/scroll-to-bottom";

const PROFILE_PROMPT_DISMISSED_KEY = "resumeowProfilePromptDismissed";

export default function ResumeowPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "personal" | "education" | "experience" | "cocurricular" | "skills" | "projects"
  >("personal");
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [currentResumeId, setCurrentResumeId] = useState<string | undefined>();
  const [resumeTitle, setResumeTitle] = useState("My Resume");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showResumeList, setShowResumeList] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData>(DEFAULT_RESUME_DATA);
  const [profile, setProfile] = useState<ResumeProfile | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [isSavingJobDescription, setIsSavingJobDescription] = useState(false);
  const [applyingChangeSetId, setApplyingChangeSetId] = useState<string | null>(
    null
  );
  const [consumedUndoChangeSetIds, setConsumedUndoChangeSetIds] = useState<string[]>(
    []
  );

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

  const loadResumes = useCallback(async () => {
    try {
      const resumes = await fetchUserResumes();
      setSavedResumes(resumes);

      if (resumes.length > 0 && !currentResumeId) {
        loadResume(resumes[0]);
      }
    } catch (error) {
      console.error("Error loading resumes:", error);
    }
  }, [currentResumeId]);

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

  const loadResume = (resume: SavedResume) => {
    if (isStreaming) {
      return;
    }

    setResumeData(resume.resume_data);
    setResumeTitle(resume.title);
    setCurrentResumeId(resume.id);
    setLastSaved(new Date(resume.updated_at));
    setShowResumeList(false);
    setHasUnsavedChanges(false);
    setRateLimitMessage(null);
    setIsAiDrawerOpen(false);
    setConsumedUndoChangeSetIds([]);
  };

  const handleSaveResume = async () => {
    if (!user) return;
    if (isStreaming) {
      return;
    }

    setIsSaving(true);
    try {
      const saved = await saveResume(resumeData, resumeTitle, currentResumeId);
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

    setResumeData(DEFAULT_RESUME_DATA);
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

  const copyLatexToClipboard = async () => {
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
      alert("Failed to save job description. Please try again.");
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
      setResumeData(response.resume.resume_data);
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
          onToolStart: (payload) => {
            const toolName = payload.toolName;
            if (toolName === "review_resume") {
              setActiveProcessLabel("Reviewing the current resume against your request and retrieved context...");
              return;
            }

            if (toolName === "propose_resume_changes") {
              setActiveProcessLabel("Updating the current resume using your prompt and grounded context...");
              return;
            }

            setActiveProcessLabel("Working on your request...");
          },
          onToolResult: (payload) => {
            const updatedResume = payload.updatedResume as SavedResume | undefined;
            if (updatedResume) {
              setResumeData(updatedResume.resume_data);
              setResumeTitle(updatedResume.title);
              setCurrentResumeId(updatedResume.id);
              setLastSaved(new Date(updatedResume.updated_at));
              setHasUnsavedChanges(false);
              void loadResumes();
            }
            setActiveProcessLabel("Preparing the final response...");
          },
          onAssistantDone: ({ message }) => {
            setMessages((current) => {
              const withoutTempAssistantNoise = current.filter(
                (entry) => !entry.id.startsWith("temp-assistant-")
              );
              return [...withoutTempAssistantNoise, message];
            });
            setActiveProcessLabel(null);
          },
          onError: (payload) => {
            setActiveProcessLabel(null);
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

  const tabs = [
    { id: "personal", label: "Personal Info *", required: true },
    { id: "education", label: "Education *", required: true },
    { id: "experience", label: "Experience *", required: true },
    { id: "cocurricular", label: "Co-Curricular", required: false },
    { id: "skills", label: "Skills", required: false },
    { id: "projects", label: "Projects", required: false },
  ] as const;

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
  const visibleMessages = messages.filter(
    (message) =>
      !(
        message.role === "tool" &&
        message.tool_name === "propose_resume_changes"
      )
  );
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
                      variant="primary"
                      size="sm"
                      className="flex-1 sm:flex-none"
                    >
                      {isSaving ? "Saving..." : "Save"}
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
                    <div className="mb-4 flex flex-col gap-1 sm:mb-6 sm:flex-row sm:gap-2 sm:overflow-x-auto sm:border-b sm:border-gray-700 sm:scrollbar-hide">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        disabled={isAiRunLocked}
                        className={`rounded px-3 py-2.5 text-left text-sm font-medium whitespace-nowrap transition-colors sm:rounded-none sm:px-2 sm:py-2 sm:text-center md:text-sm ${activeTab === tab.id
                            ? "bg-[#E84A3A] text-white sm:border-b-2 sm:border-[#E84A3A] sm:bg-transparent sm:text-[#E84A3A]"
                            : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white sm:bg-transparent sm:hover:bg-transparent"
                          }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                    </div>
                    <p className="mb-4 text-center text-xs text-gray-400 sm:text-sm">
                      * indicates mandatory sections
                    </p>

                    <div className="min-h-[400px]">
                      {activeTab === "personal" ? (
                        <PersonalInfoForm
                          data={resumeData.personalInfo}
                          onChange={updatePersonalInfo}
                        />
                      ) : null}
                      {activeTab === "education" ? (
                        <EducationForm
                          data={resumeData.education}
                          onChange={updateEducation}
                        />
                      ) : null}
                      {activeTab === "experience" ? (
                        <ExperienceForm
                          data={resumeData.experience}
                          onChange={updateExperience}
                        />
                      ) : null}
                      {activeTab === "cocurricular" ? (
                        <CoCurricularForm
                          data={resumeData.coCurricularActivities || []}
                          onChange={updateCoCurricular}
                        />
                      ) : null}
                      {activeTab === "skills" ? (
                        <SkillsForm data={resumeData.skills} onChange={updateSkills} />
                      ) : null}
                      {activeTab === "projects" ? (
                        <ProjectsForm
                          data={resumeData.projects || []}
                          onChange={updateProjects}
                        />
                      ) : null}
                    </div>

                    <div className="mt-6 flex flex-col gap-3 border-t border-gray-700 pt-4 sm:flex-row sm:items-center sm:justify-between md:mt-8 md:pt-6">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const currentIndex = tabs.findIndex((t) => t.id === activeTab);
                          if (currentIndex > 0) {
                            setActiveTab(tabs[currentIndex - 1].id);
                          }
                        }}
                        disabled={activeTab === "personal"}
                        className="w-full sm:w-auto"
                      >
                        Previous
                      </Button>

                      {activeTab === "projects" ? (
                        <Button
                          onClick={generateResume}
                          disabled={isGenerating || cooldownSeconds > 0}
                          size="lg"
                          className="w-full sm:w-auto"
                        >
                          {isGenerating
                            ? "Generating..."
                            : cooldownSeconds > 0
                              ? `Wait ${cooldownSeconds}s`
                              : "Generate Resume"}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            const currentIndex = tabs.findIndex((t) => t.id === activeTab);
                            if (currentIndex < tabs.length - 1) {
                              setActiveTab(tabs[currentIndex + 1].id);
                            }
                          }}
                          className="w-full sm:w-auto"
                        >
                          Next
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="border-gray-700 bg-gray-800/50 p-4 md:p-6">
                  <h3 className="mb-2 text-sm font-semibold text-white md:text-base">
                    How to use
                  </h3>
                  <ol className="list-decimal space-y-1 pl-5 text-xs text-gray-300 md:text-sm">
                    <li>Fill in your personal information in each tab</li>
                    <li>Add work experience, education, skills, and projects</li>
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
                jobDescriptions={jobDescriptions}
                selectedJobDescriptionId={selectedJobDescriptionId}
                onSelectedJobDescriptionChange={(value) => {
                  if (isAiRunLocked) {
                    return;
                  }
                  setSelectedJobDescriptionId(value);
                }}
                onSaveJobDescription={handleSaveJobDescription}
                isSavingJobDescription={isSavingJobDescription}
                rateLimitMessage={rateLimitMessage}
                activeProcessLabel={activeProcessLabel}
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
