import { NextRequest, NextResponse } from "next/server";
import { generateLatexResume } from "@/lib/latex/template";
import { ResumeData } from "@/lib/types/resume";

export async function POST(request: NextRequest) {
  try {
    const resumeData: ResumeData = await request.json();

    // Generate LaTeX code
    const latexCode = generateLatexResume(resumeData);

    // TODO: For now, we'll return the LaTeX code
    // In production, you would compile this to PDF using:
    // 1. LaTeX.Online API (https://latexonline.cc/compile?text=...)
    // 2. Local pdflatex server
    // 3. Third-party service like Overleaf API

    // Example API call (you'll need to implement this):
    // const pdfBuffer = await compileLatexToPDF(latexCode);
    // return new NextResponse(pdfBuffer, {
    //   headers: {
    //     'Content-Type': 'application/pdf',
    //     'Content-Disposition': 'attachment; filename="resume.pdf"'
    //   }
    // });

    // For now, return LaTeX code for testing
    return NextResponse.json({
      success: true,
      latex: latexCode,
      message: "LaTeX generated successfully. PDF compilation will be implemented next.",
    });
  } catch (error) {
    console.error("Error generating resume:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate resume" },
      { status: 500 }
    );
  }
}

/**
 * Example function to compile LaTeX to PDF using LaTeX.Online
 * Uncomment and use when ready to implement PDF compilation
 */
async function compileLatexToPDF(latexCode: string): Promise<Buffer> {
  // Using LaTeX.Online API
  const url = "https://latexonline.cc/compile";
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      text: latexCode,
      command: "pdflatex",
    }),
  });

  if (!response.ok) {
    throw new Error("LaTeX compilation failed");
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
