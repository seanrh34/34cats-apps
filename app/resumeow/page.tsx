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
import Image from "next/image";
import { ScrollToBottomButton } from "@/components/shared/scroll-to-bottom";

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
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

  // Track unsaved changes
  useEffect(() => {
    // Mark as having unsaved changes whenever resumeData or title changes
    setHasUnsavedChanges(true);
  }, [resumeData, resumeTitle]);

  // Warn about unsaved changes when leaving page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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
    setHasUnsavedChanges(false);
  };

  const handleSaveResume = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const saved = await saveResume(resumeData, resumeTitle, currentResumeId);
      setCurrentResumeId(saved.id);
      setLastSaved(new Date(saved.updated_at));
      setHasUnsavedChanges(false);
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
    setHasUnsavedChanges(false);
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

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show landing page if not authenticated
  if (!user) {
    return <ResumeowLandingPage />;
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
          {!showResumeList && (
            <>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 text-white px-2">Resumeow 📄</h1>
              <p className="text-base md:text-lg lg:text-xl text-gray-300 max-w-2xl mx-auto mb-2 px-4">
                Create professional resumes with LaTeX quality. Fill in your details and let us handle the formatting according
                to what recruiters look for.
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
            {/* Resume Management Buttons */}
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <Button
                onClick={() => setShowResumeList(!showResumeList)}
                variant="secondary"
                size="sm"
                className="text-xs sm:text-sm"
              >
                {showResumeList ? "← Back" : "📁 Resumes"}
              </Button>
              <Button
                onClick={handleNewResume}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm"
              >
                + New
              </Button>
            </div>

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
      <ScrollToBottomButton />
    </div>
  );
}

function ResumeowLandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12 md:mb-24">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Resumeow 📄
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
            Create professional resumes with LaTeX quality. Simple forms, beautiful PDFs.
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Fill in your details and I'll handle the formatting according to what recruiters look for.
          </p>
        </div>

        {/* Screenshots Section */}
        <div className="max-w-6xl mx-auto space-y-16 mb-16">
          {/* Intro - Image Left */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="rounded-lg overflow-hidden border border-gray-700 shadow-xl">
              <Image
                src="/landing_pages/resumeow/resumeow_intro.png"
                alt="Resumeow Introduction"
                width={800}
                height={450}
                className="w-full h-auto"
              />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Simple & Intuitive Interface
              </h2>
              <p className="text-lg text-gray-300">
                Start building your professional resume with an easy-to-use interface. No LaTeX knowledge required.
              </p>
            </div>
          </div>

          {/* Fill in Details - Image Right */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 order-2 md:order-1">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Fill In Your Details
              </h2>
              <p className="text-lg text-gray-300">
                Add your experiences, education, projects, and skills with guided forms and helpful examples.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden border border-gray-700 shadow-xl order-1 md:order-2">
              <Image
                src="/landing_pages/resumeow/resumeow_experiences.png"
                alt="Add your experiences"
                width={800}
                height={450}
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* See Sample Output - Image Left */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="rounded-lg overflow-hidden border border-gray-700 shadow-xl">
              <Image
                src="/landing_pages/resumeow/resumeow_sample.png"
                alt="Sample resume output"
                width={800}
                height={450}
                className="w-full h-auto"
              />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                See Sample Output
              </h2>
              <p className="text-lg text-gray-300">
                Preview how your resume will look with professional formatting and clean design.
              </p>
            </div>
          </div>

          {/* Generate PDF - Image Right */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 order-2 md:order-1">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Generate Professional PDFs
              </h2>
              <p className="text-lg text-gray-300">
                Download your resume as a beautifully formatted PDF, compiled with LaTeX for the highest quality.
              </p>
            </div>
            <div className="rounded-lg overflow-hidden border border-gray-700 shadow-xl order-1 md:order-2">
              <Image
                src="/landing_pages/resumeow/resumeow_generate_resume.png"
                alt="Generate resume PDF"
                width={800}
                height={450}
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Save & Manage - Image Left */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="rounded-lg overflow-hidden border border-gray-700 shadow-xl">
              <Image
                src="/landing_pages/resumeow/resumeow_saved.png"
                alt="Saved resumes"
                width={800}
                height={450}
                className="w-full h-auto"
              />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Save & Manage Multiple Resumes
              </h2>
              <p className="text-lg text-gray-300">
                Keep all your resumes in one place. Access them from anywhere, anytime, with cloud sync.
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Why Resumeow?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 bg-gray-800/30 border-gray-700">
              <div className="text-4xl mb-3">📝</div>
              <h3 className="text-xl font-semibold text-white mb-2">Easy to Use</h3>
              <p className="text-gray-400">
                Simple forms with example images to guide you through each section
              </p>
            </Card>
            <Card className="p-6 bg-gray-800/30 border-gray-700">
              <div className="text-4xl mb-3">✨</div>
              <h3 className="text-xl font-semibold text-white mb-2">LaTeX Quality</h3>
              <p className="text-gray-400">
                Professional formatting powered by LaTeX compilation
              </p>
            </Card>
            <Card className="p-6 bg-gray-800/30 border-gray-700">
              <div className="text-4xl mb-3">☁️</div>
              <h3 className="text-xl font-semibold text-white mb-2">Cloud Saved</h3>
              <p className="text-gray-400">
                Access your resumes from anywhere, saved securely in the cloud
              </p>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            onClick={() => router.push("/login")}
            size="lg"
            className="bg-[#E84A3A] text-white hover:bg-[#d43d2d] shadow-lg hover:shadow-xl hover:shadow-[#E84A3A]/20 transform hover:-translate-y-0.5 text-lg px-12 py-6 cursor-pointer"
          >
            Login to Try Now →
          </Button>
          <p className="text-gray-400 mt-4">
            Free to use • No credit card required
          </p>
        </div>
      </div>
      <ScrollToBottomButton />
    </div>
  );
}

