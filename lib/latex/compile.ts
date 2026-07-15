import zlib from "zlib";
import * as tar from "tar-stream";

/**
 * Compile LaTeX code to PDF using the LaTeX.Online service by POSTing a
 * .tar archive containing main.tex to its /data endpoint.
 * API: https://github.com/aslushnikov/latex-online
 */
export async function compileLatexToPDF(latexCode: string): Promise<Buffer> {
  const tarBuffer = await createTarArchive(latexCode);

  const formData = new FormData();
  const tarBlob = new Blob([new Uint8Array(tarBuffer)], {
    type: "application/x-tar",
  });
  formData.append("file", tarBlob, "archive.tar");

  const response = await fetch("https://latexonline.cc/data?target=main.tex", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("LaTeX compilation error:", errorText);
    throw new Error(
      `LaTeX compilation failed: ${response.status} ${response.statusText}`
    );
  }

  return Buffer.from(await response.arrayBuffer());
}

function createTarArchive(latexCode: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pack = tar.pack();
    const chunks: Buffer[] = [];

    pack.on("data", (chunk) => chunks.push(chunk));
    pack.on("end", () => resolve(Buffer.concat(chunks)));
    pack.on("error", reject);

    pack.entry({ name: "main.tex" }, latexCode, (err) => {
      if (err) {
        reject(err);
        return;
      }
      pack.finalize();
    });
  });
}

/**
 * Count the pages in a PDF by reading the page-tree /Count entries.
 * pdflatex stores objects in FlateDecode object streams, so every stream is
 * inflated (failures ignored — images etc.) before scanning.
 * ponytail: text scan, not a real PDF parser — swap in pdf-lib if a
 * producer ever shows up whose page tree this misses.
 */
export function countPdfPages(pdf: Buffer): number {
  const raw = pdf.toString("latin1");
  let searchable = raw;

  let index = 0;
  while (true) {
    const streamStart = raw.indexOf("stream", index);
    if (streamStart === -1) {
      break;
    }

    let dataStart = streamStart + "stream".length;
    if (raw[dataStart] === "\r") dataStart += 1;
    if (raw[dataStart] === "\n") dataStart += 1;

    const streamEnd = raw.indexOf("endstream", dataStart);
    if (streamEnd === -1) {
      break;
    }

    try {
      searchable += zlib
        .inflateSync(pdf.subarray(dataStart, streamEnd))
        .toString("latin1");
    } catch {
      // Not a FlateDecode stream (or not one we can read) — skip it.
    }

    index = streamEnd + "endstream".length;
  }

  const pageTreeCounts = [
    ...searchable.matchAll(/\/Type\s*\/Pages[^a-zA-Z][^>]*?\/Count\s+(\d+)/g),
  ].map((match) => Number(match[1]));

  if (pageTreeCounts.length > 0) {
    return Math.max(...pageTreeCounts);
  }

  const pageObjects = (searchable.match(/\/Type\s*\/Page(?![a-zA-Z])/g) ?? [])
    .length;
  if (pageObjects > 0) {
    return pageObjects;
  }

  throw new Error("Could not determine PDF page count");
}
