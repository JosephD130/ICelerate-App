// src/lib/demo/v5/resolvers/id-map.ts
// Maps between V4 DecisionEvent IDs (de-001..de-007) and V5 Event IDs (A-E1..A-E3)
// for the Mesa project only. Non-Mesa projects use V5 IDs directly.

const MESA_PROJECT_ID = "p-mesa-stormdrain-2026";

// V4 -> V5 mapping (Mesa only). null means no V5 equivalent.
const V4_TO_V5_MESA: Record<string, string | null> = {
  "de-001": "A-E1", // Unmarked water main
  "de-002": "A-E2", // RFI-047 offset — approximate match
  "de-003": "A-E3", // Soft Soil Condition
  "de-004": null, // no V5 equivalent
  "de-005": null, // no V5 equivalent
  "de-006": null, // no V5 equivalent
  "de-007": null, // no V5 equivalent
};

// Reverse map: V5 -> V4 (Mesa only). Only entries with non-null mappings.
const V5_TO_V4_MESA: Record<string, string> = {};
for (const [v4Id, v5Id] of Object.entries(V4_TO_V5_MESA)) {
  if (v5Id !== null) {
    V5_TO_V4_MESA[v5Id] = v4Id;
  }
}

/**
 * Convert a V4 DecisionEvent ID to its V5 Event ID.
 * Returns null if there is no V5 equivalent for this V4 event.
 * For non-Mesa projects, V5 IDs are used directly so the function returns the input.
 */
export function v4ToV5EventId(
  v4Id: string,
  projectId: string,
): string | null {
  if (projectId === MESA_PROJECT_ID) {
    if (v4Id in V4_TO_V5_MESA) {
      return V4_TO_V5_MESA[v4Id];
    }
    return v4Id;
  }
  return v4Id;
}

/**
 * Convert a V5 Event ID to its V4 DecisionEvent ID.
 * Returns null if there is no V4 equivalent for this V5 event.
 * For non-Mesa projects, V5 IDs are used directly so the function returns the input.
 */
export function v5ToV4EventId(
  v5Id: string,
  projectId: string,
): string | null {
  if (projectId === MESA_PROJECT_ID) {
    if (v5Id in V5_TO_V4_MESA) {
      return V5_TO_V4_MESA[v5Id];
    }
    return null;
  }
  return v5Id;
}
