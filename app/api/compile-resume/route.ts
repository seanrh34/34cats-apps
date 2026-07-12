import { NextRequest, NextResponse } from "next/server";
import { compileLatexToPDF } from "@/lib/latex/compile";
import { generateLatexResume } from "@/lib/latex/template";
import { requireUser } from "@/lib/supabase/require-user";
import { ResumeData } from "@/lib/types/resume";

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireUser();
    if (!user) {
      return NextResponse.json({ error }, { status: 401 });
    }

    const resumeData: ResumeData = await request.json();

    // Generate LaTeX code
    const latexCode = generateLatexResume(resumeData);

    // Compile to PDF using LaTeX.Online
    const pdfBuffer = await compileLatexToPDF(latexCode);

    // Return PDF file (convert Buffer to Uint8Array for NextResponse)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="resume.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error generating resume:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to generate resume" 
      },
      { status: 500 }
    );
  }
}
