// Client-side PDF text extraction via server API route.
// Sends the PDF to /api/extract-pdf which uses pdf-parse (Node.js) to avoid
// pdfjs-dist webpack bundling issues in Next.js 14.

/**
 * Extract readable text from a PDF file.
 * Uploads to server-side API route for parsing.
 */
export async function extractPdfText(file: File): Promise<string> {
  try {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/extract-pdf", { method: "POST", body: form });
    if (!res.ok) return "";
    const { text } = await res.json();
    return text || "";
  } catch {
    console.error("PDF extraction request failed");
    return "";
  }
}
