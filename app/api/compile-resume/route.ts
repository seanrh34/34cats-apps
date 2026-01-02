import { NextRequest, NextResponse } from "next/server";
import { generateLatexResume } from "@/lib/latex/template";
import { ResumeData } from "@/lib/types/resume";

export async function POST(request: NextRequest) {
  try {
    const resumeData: ResumeData = await request.json();

    // Generate LaTeX code
    const latexCode = generateLatexResume(resumeData);

    // Compile to PDF using LaTeX.Online
    const pdfBuffer = await compileLatexToPDF(latexCode);

    // Return PDF file
    return new NextResponse(pdfBuffer, {
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

/**
 * Compile LaTeX code to PDF using LaTeX.Online service
 * This is a free service that runs pdflatex on the server
 * API Documentation: https://github.com/aslushnikov/latex-online
 */
async function compileLatexToPDF(latexCode: string): Promise<Buffer> {
  try {
    // LaTeX.Online uses GET request with ?text= parameter
    // The text needs to be URL-encoded
    const encodedLatex = encodeURIComponent(latexCode);
    const url = `https://latexonline.cc/compile?text=${encodedLatex}&command=pdflatex`;
    
    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("LaTeX compilation error:", errorText);
      throw new Error(`LaTeX compilation failed: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Error in compileLatexToPDF:", error);
    throw error;
  }
}
