import { ResumeData } from "@/lib/types/resume";

/**
 * Generates a LaTeX resume from structured resume data
 */
export function generateLatexResume(data: ResumeData): string {
  const { personalInfo, summary, experience, education, skills, projects } = data;

  // Helper to escape LaTeX special characters
  const escapeLatex = (text: string): string => {
    return text
      .replace(/\\/g, "\\textbackslash{}")
      .replace(/[&%$#_{}]/g, (char) => `\\${char}`)
      .replace(/~/g, "\\textasciitilde{}")
      .replace(/\^/g, "\\textasciicircum{}");
  };

  // Format date range
  const formatDateRange = (start: string, end: string, current: boolean): string => {
    const startFormatted = start ? new Date(start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
    const endFormatted = current ? 'Present' : end ? new Date(end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
    return `${startFormatted} -- ${endFormatted}`;
  };

  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\usepackage{xcolor}

% Formatting
\\setlist{nosep, leftmargin=*}
\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{10pt}{5pt}
\\pagestyle{empty}
\\setlength{\\parindent}{0pt}

\\begin{document}

% Header
\\begin{center}
  {\\LARGE \\textbf{${escapeLatex(personalInfo.fullName)}}}\\\\[5pt]
  ${escapeLatex(personalInfo.email)} $\\cdot$ ${escapeLatex(personalInfo.phone)} $\\cdot$ ${escapeLatex(personalInfo.location)}\\\\
  ${personalInfo.linkedin ? `\\href{https://${escapeLatex(personalInfo.linkedin)}}{LinkedIn} $\\cdot$ ` : ''}${personalInfo.github ? `\\href{https://${escapeLatex(personalInfo.github)}}{GitHub}` : ''}
\\end{center}

${summary ? `
% Summary
\\section*{Professional Summary}
${escapeLatex(summary)}
` : ''}

${experience.length > 0 ? `
% Experience
\\section*{Experience}
${experience.map(exp => `
\\textbf{${escapeLatex(exp.position)}} \\hfill ${formatDateRange(exp.startDate, exp.endDate, exp.current)}\\\\
\\textit{${escapeLatex(exp.company)}, ${escapeLatex(exp.location)}}
${exp.description.filter(d => d.trim()).length > 0 ? `
\\begin{itemize}
${exp.description.filter(d => d.trim()).map(desc => `  \\item ${escapeLatex(desc)}`).join('\n')}
\\end{itemize}` : ''}
`).join('\n')}
` : ''}

${education.length > 0 ? `
% Education
\\section*{Education}
${education.map(edu => `
\\textbf{${escapeLatex(edu.degree)} in ${escapeLatex(edu.field)}} \\hfill ${formatDateRange(edu.startDate, edu.endDate, false)}\\\\
\\textit{${escapeLatex(edu.institution)}, ${escapeLatex(edu.location)}}${edu.gpa ? ` $\\cdot$ GPA: ${escapeLatex(edu.gpa)}` : ''}
${edu.honors && edu.honors.length > 0 ? `\\\\Honors: ${edu.honors.map(h => escapeLatex(h)).join(', ')}` : ''}
`).join('\n')}
` : ''}

${skills.length > 0 ? `
% Skills
\\section*{Skills}
${skills.map(skill => `
\\textbf{${escapeLatex(skill.category)}:} ${skill.items.map(item => escapeLatex(item)).join(', ')}\\\\
`).join('')}
` : ''}

${projects && projects.length > 0 ? `
% Projects
\\section*{Projects}
${projects.map(proj => `
\\textbf{${escapeLatex(proj.name)}}${proj.link ? ` $\\cdot$ \\href{${escapeLatex(proj.link)}}{Link}` : ''}\\\\
${escapeLatex(proj.description)}\\\\
\\textit{Technologies: ${proj.technologies.map(t => escapeLatex(t)).join(', ')}}
`).join('\n')}
` : ''}

\\end{document}`;
}
