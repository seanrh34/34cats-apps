"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ResumeData, PersonalInfo, Experience, Education, Skill, Project, CoCurricularActivity } from "@/lib/types/resume";
import { PersonalInfoForm } from "@/components/resumeow/personal-info-form";
import { ExperienceForm } from "@/components/resumeow/experience-form";
import { EducationForm } from "@/components/resumeow/education-form";
import { SkillsForm } from "@/components/resumeow/skills-form";
import { ProjectsForm } from "@/components/resumeow/projects-form";
import { CoCurricularForm } from "@/components/resumeow/cocurricular-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  fetchUserResumes, 
  saveResume, 
  deleteResume, 
  SavedResume 
} from "@/lib/services/resume-service";
import { generateLatexResume } from "@/lib/latex/template";

export default function ResumeowPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"personal" | "education" | "experience" | "cocurricular" | "skills" | "projects">("personal");
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [currentResumeId, setCurrentResumeId] = useState<string | undefined>();
  const [resumeTitle, setResumeTitle] = useState("My Resume");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showResumeList, setShowResumeList] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const [resumeData, setResumeData] = useState<ResumeData>({
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
  });

  // Load user's resumes on mount
  useEffect(() => {
    if (user) {
      loadResumes();
    }
  }, [user]);

  // Add beforeunload warning when generating resume
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isGenerating) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    if (isGenerating) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isGenerating]);

  // Check and manage cooldown from localStorage
  useEffect(() => {
    const checkCooldown = () => {
      const cooldownEnd = localStorage.getItem('resumeGenerateCooldown');
      if (cooldownEnd) {
        const remaining = Math.max(0, Math.floor((parseInt(cooldownEnd) - Date.now()) / 1000));
        if (remaining > 0) {
          setCooldownSeconds(remaining);
        } else {
          localStorage.removeItem('resumeGenerateCooldown');
          setCooldownSeconds(0);
        }
      }
    };

    // Check immediately on mount
    checkCooldown();

    // Update countdown every second
    const interval = setInterval(() => {
      const cooldownEnd = localStorage.getItem('resumeGenerateCooldown');
      if (cooldownEnd) {
        const remaining = Math.max(0, Math.floor((parseInt(cooldownEnd) - Date.now()) / 1000));
        setCooldownSeconds(remaining);
        if (remaining === 0) {
          localStorage.removeItem('resumeGenerateCooldown');
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadResumes = async () => {
    try {
      const resumes = await fetchUserResumes();
      setSavedResumes(resumes);
      
      // Load the most recent resume if available
      if (resumes.length > 0 && !currentResumeId) {
        loadResume(resumes[0]);
      }
    } catch (error) {
      console.error("Error loading resumes:", error);
    }
  };

  const loadResume = (resume: SavedResume) => {
    setResumeData(resume.resume_data);
    setResumeTitle(resume.title);
    setCurrentResumeId(resume.id);
    setLastSaved(new Date(resume.updated_at));
    setShowResumeList(false);
  };

  const handleSaveResume = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const saved = await saveResume(resumeData, resumeTitle, currentResumeId);
      setCurrentResumeId(saved.id);
      setLastSaved(new Date(saved.updated_at));
      await loadResumes();
      alert("Resume saved successfully!");
    } catch (error) {
      console.error("Error saving resume:", error);
      alert("Failed to save resume. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewResume = () => {
    setResumeData({
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
    });
    setResumeTitle("New Resume");
    setCurrentResumeId(undefined);
    setLastSaved(null);
    setShowResumeList(false);
  };

  const handleDeleteResume = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;
    
    try {
      await deleteResume(id);
      await loadResumes();
      
      // If deleted current resume, reset to blank
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
    setResumeData({ ...resumeData, personalInfo: data });
  };

  const updateExperience = (data: Experience[]) => {
    setResumeData({ ...resumeData, experience: data });
  };

  const updateEducation = (data: Education[]) => {
    setResumeData({ ...resumeData, education: data });
  };

  const updateCoCurricular = (data: CoCurricularActivity[]) => {
    setResumeData({ ...resumeData, coCurricularActivities: data });
  };

  const updateSkills = (data: Skill[]) => {
    setResumeData({ ...resumeData, skills: data });
  };

  const updateProjects = (data: Project[]) => {
    setResumeData({ ...resumeData, projects: data });
  };

  const copyLatexToClipboard = async () => {
    try {
      const latexCode = generateLatexResume(resumeData);
      await navigator.clipboard.writeText(latexCode);
      alert("LaTeX code copied to clipboard! You can paste it into Overleaf or any LaTeX editor to make custom edits.");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      alert("Failed to copy LaTeX code. Please try again.");
    }
  };

  const generateResume = async () => {
    // Check if still in cooldown
    if (cooldownSeconds > 0) {
      alert(`Please wait ${cooldownSeconds} seconds before generating another resume.`);
      return;
    }

    setIsGenerating(true);
    
    // Set 60-second cooldown in localStorage
    const cooldownEnd = Date.now() + 60000; // 60 seconds
    localStorage.setItem('resumeGenerateCooldown', cooldownEnd.toString());
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

      // Get PDF blob from response
      const pdfBlob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${resumeTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert("Resume PDF downloaded successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert(error instanceof Error ? error.message : "An error occurred while generating the resume");
    } finally {
      setIsGenerating(false);
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

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-lg p-8 shadow-2xl border border-gray-700 text-center">
            <div className="flex flex-col items-center gap-4">
              {/* Spinner */}
              <div className="w-16 h-16 border-4 border-gray-600 border-t-[#E84A3A] rounded-full animate-spin"></div>
              <div>
                <p className="text-white text-xl font-semibold mb-2">Generating your resume...</p>
                <p className="text-gray-400 text-sm">This may take a few seconds</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                onClick={() => setShowResumeList(!showResumeList)}
                variant="secondary"
                size="sm"
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                {showResumeList ? "← Back" : "📁 Resumes"}
              </Button>
              <Button
                onClick={handleNewResume}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none text-xs sm:text-sm"
              >
                + New
              </Button>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
              <span className="text-xs sm:text-sm text-gray-300 truncate max-w-[150px] sm:max-w-none">
                {user.email}
              </span>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
              >
                Sign Out
              </Button>
            </div>
          </div>

          {!showResumeList && (
            <>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 text-white px-2">Resumeow 📄</h1>
              <p className="text-base md:text-lg lg:text-xl text-gray-300 max-w-2xl mx-auto mb-2 px-4">
                Create professional resumes with LaTeX quality. Fill in your details and let us handle the formatting.
              </p>
              {lastSaved && (
                <p className="text-xs md:text-sm text-gray-400 px-2">
                  Last saved: {lastSaved.toLocaleString()}
                </p>
              )}
            </>
          )}
        </div>

        {showResumeList ? (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 px-2">Your Saved Resumes</h2>
            {savedResumes.length === 0 ? (
              <Card className="p-8 bg-gray-800/30 text-center">
                <p className="text-gray-400 mb-4">No saved resumes yet.</p>
                <Button onClick={handleNewResume} variant="primary">
                  Create Your First Resume
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {savedResumes.map((resume) => (
                  <Card
                    key={resume.id}
                    className="p-4 md:p-6 bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div className="flex-1 w-full">
                        <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
                          {resume.title}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-400">
                          Last updated: {new Date(resume.updated_at).toLocaleString()}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500 mt-1">
                          Created: {new Date(resume.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          onClick={() => loadResume(resume)}
                          variant="secondary"
                          size="sm"
                          className="flex-1 sm:flex-none"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteResume(resume.id)}
                          variant="outline"
                          size="sm"
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
          <div className="max-w-5xl mx-auto">
            {/* Resume Title and Save Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mb-4">
              <input
                type="text"
                value={resumeTitle}
                onChange={(e) => setResumeTitle(e.target.value)}
                className="text-base sm:text-lg md:text-xl bg-gray-800/50 border border-gray-700 rounded-lg px-3 sm:px-4 py-2 text-white w-full sm:max-w-md"
                placeholder="Resume Title"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveResume}
                  disabled={isSaving}
                  variant="primary"
                  size="sm"
                  className="flex-1 sm:flex-none"
                >
                  {isSaving ? "Saving..." : "💾 Save"}
                </Button>
                <Button
                  onClick={copyLatexToClipboard}
                  variant="outline"
                  size="sm"
                  title="Copy LaTeX code to clipboard. You can paste it into Overleaf or any LaTeX editor to make custom edits."
                  className="flex-1 sm:flex-none"
                >
                  📋 Copy LaTeX
                </Button>
              </div>
            </div>

          <Card className="p-4 md:p-6 bg-gray-800/30">
            {/* Tab Navigation */}
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 mb-4 md:mb-6 sm:border-b border-gray-700 sm:overflow-x-auto sm:scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2.5 sm:px-2 sm:py-2 text-sm sm:text-xs md:text-sm font-medium whitespace-nowrap transition-colors rounded sm:rounded-none text-left sm:text-center ${
                    activeTab === tab.id
                      ? "bg-[#E84A3A] text-white sm:bg-transparent sm:border-b-2 sm:border-[#E84A3A] sm:text-[#E84A3A]"
                      : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 sm:bg-transparent sm:hover:bg-transparent"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mb-4 text-center">
              * indicates mandatory sections
            </p>

            {/* Form Content */}
            <div className="min-h-[400px]">
              {activeTab === "personal" && (
                <PersonalInfoForm
                  data={resumeData.personalInfo}
                  onChange={updatePersonalInfo}
                />
              )}
              {activeTab === "education" && (
                <EducationForm
                  data={resumeData.education}
                  onChange={updateEducation}
                />
              )}
              {activeTab === "experience" && (
                <ExperienceForm
                  data={resumeData.experience}
                  onChange={updateExperience}
                />
              )}
              {activeTab === "cocurricular" && (
                <CoCurricularForm
                  data={resumeData.coCurricularActivities || []}
                  onChange={updateCoCurricular}
                />
              )}
              {activeTab === "skills" && (
                <SkillsForm data={resumeData.skills} onChange={updateSkills} />
              )}
              {activeTab === "projects" && (
                <ProjectsForm
                  data={resumeData.projects || []}
                  onChange={updateProjects}
                />
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-700">
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
                ← Previous
              </Button>

              {activeTab === "projects" ? (
                <Button
                  onClick={generateResume}
                  disabled={isGenerating || cooldownSeconds > 0}
                  size="lg"
                  className="w-full sm:w-auto text-sm sm:text-base"
                >
                  {isGenerating 
                    ? "Generating..." 
                    : cooldownSeconds > 0 
                      ? `Wait ${cooldownSeconds}s to Generate Again` 
                      : "Generate Resume 🎉"}
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
                  Next →
                </Button>
              )}
            </div>
          </Card>

          {/* Instructions */}
          <Card className="mt-4 md:mt-6 p-4 md:p-6 bg-gray-800/50 border-gray-700">
            <h3 className="text-sm md:text-base font-semibold mb-2 text-white">💡 How to use:</h3>
            <ol className="list-decimal list-inside space-y-1 text-xs md:text-sm text-gray-300">
              <li>Fill in your personal information in each tab</li>
              <li>Add your work experience, education, and skills</li>
              <li>Click "Save" to save your resume to the cloud</li>
              <li>Click "Generate Resume" to download your PDF directly</li>
            </ol>
            <p className="text-xs text-gray-400 mt-3">
              Your resume is compiled with LaTeX to ensure professional formatting and quality.
            </p>
          </Card>
          </div>
        )}
      </div>
    </div>
  );
}
