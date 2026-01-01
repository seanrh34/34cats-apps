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
}

export interface CoCurricularActivity {
  id: string;
  position: string;
  dateRange: string;
  organization: string;
  location: string;
  description: string[];
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  education: Education[];
  experience: Experience[];
  coCurricularActivities?: CoCurricularActivity[];
  skills: Skill[];
  projects?: Project[];
}
