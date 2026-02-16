// src/lib/verification.ts
// Pure output parser — counts citations and quantified values to classify AI output trustworthiness.

export type VerificationStatus = "verified" | "caution" | "unverified";

export interface VerificationResult {
  status: VerificationStatus;
  hasCitations: boolean;
  hasNumbers: boolean;
  citationCount: number;
  numberCount: number;
  message: string;
}

const CITATION_PATTERNS = [
  /§[\d.]+/g,
  /Section\s+\d+/gi,
  /Clause\s+[\d.]+/gi,
  /ASTM\s+[A-Z]\d+/g,
  /AASHTO\s+[A-Z]/g,
  /RFI[-\s]?\d+/gi,
  /CO[-\s]?\d+/gi,
  /Spec(?:ification)?\s+(?:Section\s+)?\d+/gi,
];

const NUMBER_PATTERNS = [
  /\$[\d,]+(?:\.\d{2})?/g,
  /\d+\s*(?:day|week|hour|month)s?\b/gi,
];

export function verifyOutput(text: string): VerificationResult {
  if (!text) {
    return { status: "unverified", hasCitations: false, hasNumbers: false, citationCount: 0, numberCount: 0, message: "No output to verify" };
  }

  const citationMatches = new Set<string>();
  for (const pattern of CITATION_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) matches.forEach((m) => citationMatches.add(m));
  }

  const numberMatches = new Set<string>();
  for (const pattern of NUMBER_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) matches.forEach((m) => numberMatches.add(m));
  }

  const citationCount = citationMatches.size;
  const numberCount = numberMatches.size;
  const hasCitations = citationCount > 0;
  const hasNumbers = numberCount > 0;

  if (citationCount >= 2 && numberCount >= 1) {
    return {
      status: "verified",
      hasCitations,
      hasNumbers,
      citationCount,
      numberCount,
      message: `Output includes ${citationCount} citation${citationCount !== 1 ? "s" : ""} and ${numberCount} quantified value${numberCount !== 1 ? "s" : ""}`,
    };
  }

  if (citationCount >= 1 || numberCount >= 1) {
    return {
      status: "caution",
      hasCitations,
      hasNumbers,
      citationCount,
      numberCount,
      message: "Limited evidence — review before relying on specific values",
    };
  }

  return {
    status: "unverified",
    hasCitations,
    hasNumbers,
    citationCount,
    numberCount,
    message: "No citations or quantified values detected",
  };
}
