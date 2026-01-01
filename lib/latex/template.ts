import { ResumeData } from "@/lib/types/resume";

/**
 * Generates a LaTeX resume from structured resume data
 * Following the Jake Gutierrez resume template format
 */
export function generateLatexResume(data: ResumeData): string {
  const { personalInfo, education, experience, coCurricularActivities, skills, projects } = data;

  // Helper to escape LaTeX special characters
  const escapeLatex = (text: string): string => {
    return text
      .replace(/\\/g, "\\textbackslash{}")
      .replace(/[&%$#_{}]/g, (char) => `\\${char}`)
      .replace(/~/g, "\\textasciitilde{}")
      .replace(/\^/g, "\\textasciicircum{}");
  };

  // Build contact line
  const contactParts = [
    personalInfo.phone,
    personalInfo.email ? `\\href{mailto:${escapeLatex(personalInfo.email)}}{\\underline{${escapeLatex(personalInfo.email)}}}` : null,
    personalInfo.linkedin ? `\\href{https://${escapeLatex(personalInfo.linkedin)}}{\\underline{${escapeLatex(personalInfo.linkedin)}}}` : null,
    personalInfo.website ? `\\href{https://${escapeLatex(personalInfo.website)}}{\\underline{${escapeLatex(personalInfo.website)}}}` : null,
    personalInfo.github ? `\\href{https://${escapeLatex(personalInfo.github)}}{\\underline{${escapeLatex(personalInfo.github)}}}` : null,
  ].filter(Boolean);

  return `\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

% Ensure that generate pdf is machine readable/ATS parsable
\\pdfgentounicode=1

% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubItem}[1]{\\resumeItem{#1}\\vspace{-4pt}}

\\renewcommand\\labelitemii{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

%----------HEADING----------
\\begin{center}
    \\textbf{\\Huge \\scshape ${escapeLatex(personalInfo.fullName)}} \\\\ \\vspace{1pt}
    \\small ${contactParts.join(' $|$ ')}
\\end{center}

${education.length > 0 ? `
%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
${education.map(edu => `    \\resumeSubheading
      {${escapeLatex(edu.institution)}}{${escapeLatex(edu.location)}}
      {${escapeLatex(edu.degree)}${edu.gpa ? ` (${escapeLatex(edu.gpa)})` : ''}}{${escapeLatex(edu.dateRange)}}`).join('\n')}
  \\resumeSubHeadingListEnd
` : ''}

${experience.length > 0 ? `
%-----------EXPERIENCE-----------
\\section{Experience}
    \\resumeSubHeadingListStart
${experience.map(exp => `
    \\resumeSubheading
    {${escapeLatex(exp.position)}}{${escapeLatex(exp.dateRange)}}
    {${escapeLatex(exp.company)}}{${escapeLatex(exp.location)}}
${exp.description.filter(d => d.trim()).length > 0 ? `        \\resumeItemListStart
${exp.description.filter(d => d.trim()).map(desc => `        \\resumeItem{${escapeLatex(desc)}}`).join('\n')}
        \\resumeItemListEnd` : ''}`).join('\n')}

    \\resumeSubHeadingListEnd
` : ''}

${coCurricularActivities && coCurricularActivities.length > 0 ? `
%-----------Co-Curricular Activities-----------
\\section{Co-Curricular Activities}
    \\resumeSubHeadingListStart
${coCurricularActivities.map(activity => `
    \\resumeSubheading
    {${escapeLatex(activity.position)}}{${escapeLatex(activity.dateRange)}}
    {${escapeLatex(activity.organization)}}{${escapeLatex(activity.location)}}
${activity.description.filter(d => d.trim()).length > 0 ? `        \\resumeItemListStart
${activity.description.filter(d => d.trim()).map(desc => `        \\resumeItem{${escapeLatex(desc)}}`).join('\n')}
        \\resumeItemListEnd` : ''}`).join('\n')}

    \\resumeSubHeadingListEnd
` : ''}

${skills.length > 0 ? `
%-----------SKILLS-----------
\\section{Skills}
\\begin{itemize}[leftmargin=0.15in, label={}]
  \\item \\small{
${skills.map(skill => `    \\textbf{${escapeLatex(skill.category)}}{: ${skill.items.map(item => escapeLatex(item)).join(', ')}} \\\\`).join('\n')}
  }
\\end{itemize}
` : ''}

${projects && projects.length > 0 ? `
%-----------Relevant Links and Past Works-----------
\\section{Relevant Projects}
\\begin{itemize}[leftmargin=0.15in, label={}]
  \\item \\small{
${projects.map(proj => `    \\textbf{${escapeLatex(proj.name)}}{: }${proj.link ? `\\href{${escapeLatex(proj.link)}}{${escapeLatex(proj.link)}}` : ''} \\\\`).join('\n')}
  }
\\end{itemize}
` : ''}

\\end{document}`;
}
