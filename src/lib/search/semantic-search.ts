import { searchDocuments, getAllDocuments, type DocumentChunk } from "@/lib/demo/documents";

// In-memory cache: query → { expandedTerms, timestamp }
const expansionCache = new Map<string, { terms: string[]; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getExpandedTerms(query: string): Promise<string[]> {
  const cached = expansionCache.get(query);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.terms;
  }

  try {
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const terms: string[] = data.expandedTerms || [];
    expansionCache.set(query, { terms, ts: Date.now() });
    return terms;
  } catch {
    return [];
  }
}

/**
 * Semantic search: expand query via Claude, then merge results
 * from both original and expanded queries through existing keyword search.
 */
export async function semanticSearchDocuments(
  query: string,
): Promise<DocumentChunk[]> {
  // Run original search immediately
  const originalResults = searchDocuments(query);

  // Get expanded terms from Claude
  const expandedTerms = await getExpandedTerms(query);
  if (expandedTerms.length === 0) return originalResults;

  // Search with expanded terms
  const expandedQuery = expandedTerms.join(" ");
  const expandedResults = searchDocuments(expandedQuery);

  // Merge and deduplicate, preserving original results first
  const seen = new Set(originalResults.map((d) => d.id));
  const merged = [...originalResults];

  for (const doc of expandedResults) {
    if (!seen.has(doc.id)) {
      seen.add(doc.id);
      merged.push(doc);
    }
  }

  return merged;
}
