import { NextRequest, NextResponse } from "next/server";
import { generateLatexResume } from "@/lib/latex/template";
import { ResumeData } from "@/lib/types/resume";
import * as tar from "tar-stream";
import { Readable } from "stream";

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
 * 
 * For large documents, we POST a .tar archive to the /data endpoint
 * Reference: https://github.com/aslushnikov/latex-online/issues
 */
async function compileLatexToPDF(latexCode: string): Promise<Buffer> {
  try {
    // Create a tar archive containing main.tex
    const tarBuffer = await createTarArchive(latexCode);
    
    // Create FormData and upload tar file
    const formData = new FormData();
    const tarBlob = new Blob([tarBuffer], { type: "application/x-tar" });
    formData.append("file", tarBlob, "archive.tar");
    
    // POST the tar archive to LaTeX.Online with target parameter
    const response = await fetch("https://latexonline.cc/data?target=main.tex", {
      method: "POST",
      body: formData,
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

/**
 * Create a tar archive containing the LaTeX file
 */
async function createTarArchive(latexCode: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pack = tar.pack();
    const chunks: Buffer[] = [];

    // Collect tar data
    pack.on("data", (chunk) => chunks.push(chunk));
    pack.on("end", () => resolve(Buffer.concat(chunks)));
    pack.on("error", reject);

    // Add main.tex to the archive
    pack.entry({ name: "main.tex" }, latexCode, (err) => {
      if (err) {
        reject(err);
        return;
      }
      pack.finalize();
    });
  });
}
