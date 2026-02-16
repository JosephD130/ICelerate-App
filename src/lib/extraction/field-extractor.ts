// src/lib/extraction/field-extractor.ts
// Regex entity extraction from AI field report output.
// Pure deterministic — no AI calls.

import { personas } from "@/lib/demo/personas";

export type EntityType =
  | "cost"
  | "schedule"
  | "location"
  | "contract_ref"
  | "stakeholder"
  | "equipment";

export interface ExtractedEntity {
  type: EntityType;
  raw: string;
  value?: number;
  unit?: string;
  confidence: "high" | "medium" | "low";
}

export interface FieldExtraction {
  entities: ExtractedEntity[];
  suggestedCostRange: { low: number; high: number } | null;
  suggestedScheduleDays: number | null;
  contractRefsFound: string[];
  executiveSummary: string | null;
  recommendedActions: string | null;
}

// ── Patterns ──────────────────────────────────────────────

const DOLLAR_PATTERN = /\$[\d,]+(?:\.\d{2})?/g;
const DOLLAR_RANGE_PATTERN =
  /\$([\d,]+(?:\.\d{2})?)\s*(?:[-–—]|to)\s*\$([\d,]+(?:\.\d{2})?)/gi;
const DAYS_PATTERN = /(\d+)\s*(?:working\s+)?days?\b/gi;
const STATION_PATTERN = /STA\s*\d+\+\d+/gi;
const PHASE_PATTERN = /Phase\s*\d+/gi;
const AREA_PATTERN = /Area\s*[A-Z]\d*/gi;
const ZONE_PATTERN = /Zone\s*\d+/gi;
const CLAUSE_PATTERN = /§[\d.]+[A-Za-z]*/g;
const SECTION_PATTERN = /Section\s+\d+[\d.]*/gi;
const EQUIPMENT_PATTERN =
  /\b(excavator|backhoe|loader|crane|roller|compactor|dozer|grader|dump\s*truck|trencher|pile\s*driver|forklift|skid\s*steer)\b/gi;
const PIPE_PATTERN = /(\d+)[""]?\s*(DIP|RCP|PVC|HDPE|CMP)/gi;

function parseDollar(raw: string): number {
  return parseInt(raw.replace(/[$,]/g, "")) || 0;
}

/** Extract content under a markdown ## or ### header, up to the next same-level header. */
function extractSection(text: string, header: string): string {
  const idx = text.indexOf(header);
  if (idx < 0) return "";
  const start = idx + header.length;
  const nextHeader = text.indexOf("\n##", start);
  return (nextHeader >= 0 ? text.slice(start, nextHeader) : text.slice(start)).trim();
}

// ── Main extractor ────────────────────────────────────────

/**
 * Extract structured entities from AI field report output text.
 * Returns typed entities with values, plus aggregated suggestions.
 */
export function extractFieldEntities(aiOutput: string): FieldExtraction {
  const entities: ExtractedEntity[] = [];
  const seen = new Set<string>();

  function add(entity: ExtractedEntity) {
    const key = `${entity.type}:${entity.raw}`;
    if (seen.has(key)) return;
    seen.add(key);
    entities.push(entity);
  }

  // ── Cost extraction ──
  const dollarMatches = aiOutput.match(DOLLAR_PATTERN) || [];
  for (const raw of dollarMatches) {
    add({
      type: "cost",
      raw,
      value: parseDollar(raw),
      unit: "USD",
      confidence: "medium",
    });
  }

  // ── Schedule extraction ──
  let match: RegExpExecArray | null;
  const daysRegex = new RegExp(DAYS_PATTERN.source, DAYS_PATTERN.flags);
  while ((match = daysRegex.exec(aiOutput)) !== null) {
    const days = parseInt(match[1]);
    if (days > 0 && days < 500) {
      add({
        type: "schedule",
        raw: match[0],
        value: days,
        unit: "days",
        confidence: match[0].toLowerCase().includes("working") ? "medium" : "low",
      });
    }
  }

  // ── Location extraction ──
  const stationMatches = aiOutput.match(STATION_PATTERN) || [];
  for (const raw of stationMatches) {
    add({ type: "location", raw, confidence: "high" });
  }

  const phaseMatches = aiOutput.match(PHASE_PATTERN) || [];
  for (const raw of phaseMatches) {
    add({ type: "location", raw, confidence: "high" });
  }

  const areaMatches = aiOutput.match(AREA_PATTERN) || [];
  for (const raw of areaMatches) {
    add({ type: "location", raw, confidence: "medium" });
  }

  const zoneMatches = aiOutput.match(ZONE_PATTERN) || [];
  for (const raw of zoneMatches) {
    add({ type: "location", raw, confidence: "medium" });
  }

  // ── Contract reference extraction ──
  const clauseMatches = aiOutput.match(CLAUSE_PATTERN) || [];
  for (const raw of clauseMatches) {
    add({ type: "contract_ref", raw, confidence: "high" });
  }

  const sectionMatches = aiOutput.match(SECTION_PATTERN) || [];
  for (const raw of sectionMatches) {
    add({ type: "contract_ref", raw, confidence: "high" });
  }

  // ── Stakeholder extraction ──
  const textLower = aiOutput.toLowerCase();
  for (const p of personas) {
    if (textLower.includes(p.name.toLowerCase())) {
      add({
        type: "stakeholder",
        raw: p.name,
        confidence: "high",
      });
    }
    if (textLower.includes(p.role.toLowerCase())) {
      add({
        type: "stakeholder",
        raw: `${p.name} (${p.role})`,
        confidence: "medium",
      });
    }
  }

  // ── Equipment extraction ──
  const equipRegex = new RegExp(EQUIPMENT_PATTERN.source, EQUIPMENT_PATTERN.flags);
  while ((match = equipRegex.exec(aiOutput)) !== null) {
    add({
      type: "equipment",
      raw: match[0],
      confidence: "medium",
    });
  }

  // ── Pipe/material mentions ──
  const pipeRegex = new RegExp(PIPE_PATTERN.source, PIPE_PATTERN.flags);
  while ((match = pipeRegex.exec(aiOutput)) !== null) {
    add({
      type: "equipment",
      raw: match[0],
      confidence: "high",
    });
  }

  // ── Aggregated suggestions ──

  // Cost range: detect dollar ranges or derive from individual amounts
  let suggestedCostRange: { low: number; high: number } | null = null;
  const rangeRegex = new RegExp(DOLLAR_RANGE_PATTERN.source, DOLLAR_RANGE_PATTERN.flags);
  const rangeMatch = rangeRegex.exec(aiOutput);
  if (rangeMatch) {
    const low = parseDollar(rangeMatch[1]);
    const high = parseDollar(rangeMatch[2]);
    suggestedCostRange = { low: Math.min(low, high), high: Math.max(low, high) };
  } else {
    const costEntities = entities
      .filter((e) => e.type === "cost" && e.value && e.value > 0)
      .map((e) => e.value!)
      .sort((a, b) => a - b);
    if (costEntities.length >= 2) {
      suggestedCostRange = {
        low: costEntities[0],
        high: costEntities[costEntities.length - 1],
      };
    } else if (costEntities.length === 1) {
      // Single value: +/- 20%
      suggestedCostRange = {
        low: Math.round(costEntities[0] * 0.8),
        high: Math.round(costEntities[0] * 1.2),
      };
    }
  }

  // Schedule: take the largest day count
  const scheduleEntities = entities
    .filter((e) => e.type === "schedule" && e.value && e.value > 0)
    .map((e) => e.value!);
  const suggestedScheduleDays =
    scheduleEntities.length > 0 ? Math.max(...scheduleEntities) : null;

  // Contract refs: unique list
  const contractRefsFound = Array.from(
    new Set(
      entities
        .filter((e) => e.type === "contract_ref")
        .map((e) => e.raw),
    ),
  );

  // Section extraction
  const executiveSummary = extractSection(aiOutput, "## Executive Summary") || null;
  const recommendedActions = extractSection(aiOutput, "### Recommended Immediate Actions") || null;

  return {
    entities,
    suggestedCostRange,
    suggestedScheduleDays,
    contractRefsFound,
    executiveSummary,
    recommendedActions,
  };
}
