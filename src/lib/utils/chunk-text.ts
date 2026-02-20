// src/lib/utils/chunk-text.ts
// Splits extracted document text into searchable chunks with auto-generated keywords.

import type { StoredChunk } from "@/lib/storage/document-store";

const MAX_CHUNK_SIZE = 1500;
const OVERLAP = 200;

const STOPWORDS = new Set([
  "the", "and", "for", "that", "this", "with", "from", "are", "was", "were",
  "been", "being", "have", "has", "had", "does", "did", "will", "would",
  "could", "should", "may", "might", "shall", "can", "not", "but", "its",
  "all", "any", "each", "every", "such", "than", "other", "which", "what",
  "when", "where", "who", "how", "into", "through", "during", "before",
  "after", "above", "below", "between", "under", "over", "upon", "about",
  "also", "then", "only", "more", "most", "some", "same", "here", "there",
]);

/** Simple hash for generating stable IDs from file names. */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

/** Extract top keywords from a text block. */
function extractKeywords(text: string, maxCount = 12): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));

  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxCount)
    .map(([word]) => word);
}

/** Try to extract a section title from the first line of a chunk. */
function inferSectionTitle(text: string, index: number): string {
  const firstLine = text.split("\n")[0]?.trim() || "";

  // Check for numbered section headers (e.g., "7.3.1 — Differing Site Conditions")
  const sectionMatch = firstLine.match(
    /^(?:§?\s*)?(\d+(?:\.\d+)*)\s*[-—:.]?\s*(.+)/,
  );
  if (sectionMatch && sectionMatch[2].length < 80) {
    return `§${sectionMatch[1]} — ${sectionMatch[2]}`;
  }

  // Check for "Section X" or "Article X" headers
  const articleMatch = firstLine.match(
    /^(Section|Article|Part|Chapter)\s+(\S+)\s*[-—:.]?\s*(.+)/i,
  );
  if (articleMatch) {
    return `${articleMatch[1]} ${articleMatch[2]} — ${articleMatch[3]}`.slice(
      0,
      80,
    );
  }

  // If the first line is short enough, use it as the title
  if (firstLine.length > 5 && firstLine.length < 80) {
    return firstLine;
  }

  return `Section ${index + 1}`;
}

/**
 * Split raw text into chunks suitable for RAG search and context injection.
 *
 * Strategy:
 * 1. Try splitting on section headers (numbered sections)
 * 2. Fall back to double-newline paragraph boundaries
 * 3. Last resort: fixed-size windows with overlap
 */
export function chunkText(
  text: string,
  fileName: string,
  projectId: string,
): StoredChunk[] {
  const fileHash = simpleHash(fileName);
  const now = new Date().toISOString();
  const cleanText = text.replace(/\r\n/g, "\n").trim();

  if (!cleanText) return [];

  // Try section-header splitting first
  const sectionPattern = /\n(?=(?:§?\s*)?\d+(?:\.\d+)+\s*[-—:.\s])/;
  let segments = cleanText.split(sectionPattern).filter((s) => s.trim());

  // If that didn't produce useful splits, try double-newline
  if (segments.length < 2) {
    segments = cleanText.split(/\n\n+/).filter((s) => s.trim());
  }

  // Merge small segments and split large ones
  const merged: string[] = [];
  let buffer = "";

  for (const seg of segments) {
    if (buffer.length + seg.length < MAX_CHUNK_SIZE) {
      buffer += (buffer ? "\n\n" : "") + seg;
    } else {
      if (buffer) merged.push(buffer);
      if (seg.length > MAX_CHUNK_SIZE) {
        // Split oversized segment with overlap
        for (let i = 0; i < seg.length; i += MAX_CHUNK_SIZE - OVERLAP) {
          merged.push(seg.slice(i, i + MAX_CHUNK_SIZE));
        }
      } else {
        buffer = seg;
      }
    }
  }
  if (buffer) merged.push(buffer);

  // If we still have nothing, do a simple window split
  if (merged.length === 0) {
    for (let i = 0; i < cleanText.length; i += MAX_CHUNK_SIZE - OVERLAP) {
      merged.push(cleanText.slice(i, i + MAX_CHUNK_SIZE));
    }
  }

  const titleBase = fileName.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");

  return merged.map((content, i) => ({
    id: `upload-${fileHash}-${i}`,
    projectId,
    source: "uploaded" as const,
    fileName,
    title: `Uploaded: ${titleBase}`,
    section: inferSectionTitle(content, i),
    content: content.trim(),
    keywords: extractKeywords(content),
    uploadedAt: now,
  }));
}
