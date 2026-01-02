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

  const generateResume = async () => {
    setIsGenerating(true);
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
    { id: "personal", label: "Personal Info" },
    { id: "education", label: "Education" },
    { id: "experience", label: "Experience" },
    { id: "cocurricular", label: "Co-Curricular" },
    { id: "skills", label: "Skills" },
    { id: "projects", label: "Projects" },
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
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowResumeList(!showResumeList)}
                variant="secondary"
                size="sm"
              >
                {showResumeList ? "← Back to Editor" : "📁 My Resumes"}
              </Button>
              <Button
                onClick={handleNewResume}
                variant="outline"
                size="sm"
              >
                + New Resume
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">
                {user.email}
              </span>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
              >
                Sign Out
              </Button>
            </div>
          </div>

          {!showResumeList && (
            <>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Resumeow 📄</h1>
              <div className="flex items-center justify-center gap-4 mb-4">
                <input
                  type="text"
                  value={resumeTitle}
                  onChange={(e) => setResumeTitle(e.target.value)}
                  className="text-xl bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white max-w-md"
                  placeholder="Resume Title"
                />
                <Button
                  onClick={handleSaveResume}
                  disabled={isSaving}
                  variant="primary"
                  size="sm"
                >
                  {isSaving ? "Saving..." : "💾 Save"}
                </Button>
              </div>
              {lastSaved && (
                <p className="text-sm text-gray-400">
                  Last saved: {lastSaved.toLocaleString()}
                </p>
              )}
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Create professional resumes with LaTeX quality. Fill in your details and let us handle the formatting.
              </p>
            </>
          )}
        </div>

        {showResumeList ? (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">Your Saved Resumes</h2>
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
                    className="p-6 bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {resume.title}
                        </h3>
                        <p className="text-sm text-gray-400">
                          Last updated: {new Date(resume.updated_at).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Created: {new Date(resume.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => loadResume(resume)}
                          variant="secondary"
                          size="sm"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteResume(resume.id)}
                          variant="outline"
                          size="sm"
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
          <Card className="p-6 bg-gray-800/30">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6 border-b border-gray-700 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "border-b-2 border-[#E84A3A] text-[#E84A3A]"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

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
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  const currentIndex = tabs.findIndex((t) => t.id === activeTab);
                  if (currentIndex > 0) {
                    setActiveTab(tabs[currentIndex - 1].id);
                  }
                }}
                disabled={activeTab === "personal"}
              >
                ← Previous
              </Button>

              {activeTab === "projects" ? (
                <Button
                  onClick={generateResume}
                  disabled={isGenerating}
                  size="lg"
                >
                  {isGenerating ? "Generating..." : "Generate Resume 🎉"}
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
                    if (currentIndex < tabs.length - 1) {
                      setActiveTab(tabs[currentIndex + 1].id);
                    }
                  }}
                >
                  Next →
                </Button>
              )}
            </div>
          </Card>

          {/* Instructions */}
          <Card className="mt-6 p-6 bg-gray-800/50 border-gray-700">
            <h3 className="font-semibold mb-2 text-white">💡 How to use:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
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
