export function chunkText(text: string, maxChars = 800, overlap = 120) {
  const normalized = text.trim().replace(/\r\n/g, "\n");
  if (!normalized) {
    return [];
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
    }

    if (paragraph.length <= maxChars) {
      current = paragraph;
      continue;
    }

    let start = 0;
    while (start < paragraph.length) {
      const end = Math.min(start + maxChars, paragraph.length);
      chunks.push(paragraph.slice(start, end));
      start = Math.max(end - overlap, end);
    }
    current = "";
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}
