"use client";

import { useState } from "react";
import { ResumeData, PersonalInfo, Experience, Education, Skill } from "@/lib/types/resume";
import { PersonalInfoForm } from "@/components/resumeow/personal-info-form";
import { ExperienceForm } from "@/components/resumeow/experience-form";
import { EducationForm } from "@/components/resumeow/education-form";
import { SkillsForm } from "@/components/resumeow/skills-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ResumeowPage() {
  const [activeTab, setActiveTab] = useState<"personal" | "experience" | "education" | "skills">("personal");
  const [isGenerating, setIsGenerating] = useState(false);
  const [latexCode, setLatexCode] = useState<string>("");

  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
    },
    experience: [],
    education: [],
    skills: [],
  });

  const updatePersonalInfo = (data: PersonalInfo) => {
    setResumeData({ ...resumeData, personalInfo: data });
  };

  const updateExperience = (data: Experience[]) => {
    setResumeData({ ...resumeData, experience: data });
  };

  const updateEducation = (data: Education[]) => {
    setResumeData({ ...resumeData, education: data });
  };

  const updateSkills = (data: Skill[]) => {
    setResumeData({ ...resumeData, skills: data });
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

      const result = await response.json();

      if (result.success) {
        setLatexCode(result.latex);
        alert("Resume generated! Check the LaTeX output below.");
        // TODO: When PDF compilation is ready, download the PDF instead
      } else {
        alert("Failed to generate resume");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while generating the resume");
    } finally {
      setIsGenerating(false);
    }
  };

  const tabs = [
    { id: "personal", label: "Personal Info" },
    { id: "experience", label: "Experience" },
    { id: "education", label: "Education" },
    { id: "skills", label: "Skills" },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Resumeow 📄</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Create professional resumes with LaTeX quality. Fill in your details and let us handle the formatting.
          </p>
        </div>

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
              {activeTab === "experience" && (
                <ExperienceForm
                  data={resumeData.experience}
                  onChange={updateExperience}
                />
              )}
              {activeTab === "education" && (
                <EducationForm
                  data={resumeData.education}
                  onChange={updateEducation}
                />
              )}
              {activeTab === "skills" && (
                <SkillsForm data={resumeData.skills} onChange={updateSkills} />
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

              {activeTab === "skills" ? (
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

          {/* LaTeX Preview (temporary, until PDF compilation is ready) */}
          {latexCode && (
            <Card className="mt-6 p-6 bg-gray-800/30">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Generated LaTeX Code</h3>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(latexCode);
                    alert("LaTeX code copied to clipboard!");
                  }}
                >
                  Copy to Clipboard
                </Button>
              </div>
              <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-xs border border-gray-700">
                <code className="text-gray-300">{latexCode}</code>
              </pre>
              <p className="text-sm text-gray-400 mt-4">
                Copy this code and paste it into{" "}
                <a
                  href="https://www.overleaf.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E84A3A] hover:underline"
                >
                  Overleaf
                </a>{" "}
                or any LaTeX editor to generate your PDF.
              </p>
            </Card>
          )}

          {/* Instructions */}
          <Card className="mt-6 p-6 bg-gray-800/50 border-gray-700">
            <h3 className="font-semibold mb-2 text-white">💡 How to use:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
              <li>Fill in your personal information in each tab</li>
              <li>Add your work experience, education, and skills</li>
              <li>Click "Generate Resume" to create your LaTeX code</li>
              <li>Copy the code and paste it into Overleaf to get your PDF</li>
            </ol>
            <p className="text-xs text-gray-400 mt-3">
              <strong className="text-[#E84A3A]">Coming soon:</strong> Direct PDF download without needing Overleaf!
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
