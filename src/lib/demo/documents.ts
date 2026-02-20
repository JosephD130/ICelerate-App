import { getChunksByProject, type StoredChunk } from "@/lib/storage/document-store";

export interface DocumentChunk {
  id: string;
  title: string;
  section: string;
  content: string;
  keywords: string[];
}

// ── Uploaded document cache ──────────────────────────────────
// In-memory cache of uploaded chunks from IndexedDB.
// Refreshed on workspace mount and after each upload.

let uploadedChunksCache: DocumentChunk[] = [];

/** Reload uploaded chunks from IndexedDB into the in-memory cache. */
export async function refreshUploadedChunksCache(
  projectId: string,
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const stored: StoredChunk[] = await getChunksByProject(projectId);
    uploadedChunksCache = stored
      .filter((c) => c.source === "uploaded")
      .map((c) => ({
        id: c.id,
        title: c.title,
        section: c.section,
        content: c.content,
        keywords: c.keywords,
      }));
  } catch {
    uploadedChunksCache = [];
  }
}

/** Get all documents: demo + uploaded. */
export function getAllDocuments(): DocumentChunk[] {
  return [...demoDocuments, ...uploadedChunksCache];
}

export const demoDocuments: DocumentChunk[] = [
  // General Conditions
  {
    id: "gc-7.3.1",
    title: "General Conditions",
    section: "§7.3.1 — Differing Site Conditions",
    content: `7.3.1.1 — Definition. Differing Site Conditions are defined as: (a) Type I — subsurface or otherwise concealed physical conditions at the site which differ materially from those indicated in the Contract Documents, including but not limited to geotechnical reports, boring logs, utility records, and as-built drawings referenced therein; or (b) Type II — unknown physical conditions at the site of an unusual nature which differ materially from those ordinarily found to exist and generally recognized as inherent in work of the character provided for in the Contract. The determination of whether conditions constitute a Differing Site Condition shall be made by the Engineer based on the totality of information available at the time of discovery, including pre-bid site investigation reports and any supplemental geotechnical data provided during the bidding period.

7.3.1.2 — Notice Requirements. Upon discovery of conditions believed to constitute a Differing Site Condition, the Contractor shall promptly notify the Engineer in writing within forty-eight (48) hours of initial discovery. Such written notice shall include: (a) a detailed description of the condition encountered, including photographs and field measurements where practicable; (b) the precise location of the condition, referenced to the Contract stationing, grid coordinates, or other location system established in the Contract Documents; (c) a comparison of the conditions encountered with those indicated in the Contract Documents, identifying the specific documents, plan sheets, or specification sections that differ from actual conditions; (d) an initial assessment of the potential impact to the Contract Sum and Contract Time; and (e) the Contractor's recommended course of action. The Contractor shall not disturb the conditions at the site, except as necessary to protect life or property, until the Engineer has completed the investigation described in Section 7.3.1.3 or has authorized the Contractor to proceed. Oral notification shall not constitute compliance with this Section, but may supplement the required written notice.

7.3.1.3 — Investigation and Findings. Upon receipt of written notice, the Engineer shall promptly investigate the conditions at the site. The investigation shall include a physical inspection of the site conditions, review of the Contract Documents, and comparison with available pre-construction survey and geotechnical data. The Engineer shall issue written findings within seven (7) calendar days of completing the investigation. If the Engineer determines that the conditions constitute a Differing Site Condition as defined in Section 7.3.1.1, the findings shall include: (a) classification as Type I or Type II; (b) the extent of the condition; (c) the Engineer's assessment of impacts to the Work; and (d) direction regarding the method of proceeding. If the Engineer determines that the conditions do not constitute a Differing Site Condition, the findings shall include the basis for that determination and the Contractor's obligation to proceed with the Work as specified.

7.3.1.4 — Equitable Adjustment. If the Engineer's findings confirm a Differing Site Condition, the Contract Sum and/or Contract Time shall be equitably adjusted by Change Order in accordance with Sections 4.2.1 and 4.2.3. The equitable adjustment shall reflect the actual, documented costs of addressing the Differing Site Condition, including: (a) direct labor, materials, and equipment costs; (b) subcontractor costs with supporting documentation; (c) overhead and profit not to exceed the limits established in Section 4.2.3; and (d) time extension for delays directly attributable to the condition and not concurrent with other delays. The Contractor shall maintain contemporaneous daily records of all costs incurred in addressing the Differing Site Condition, and such records shall be made available to the Engineer upon request.

7.3.1.5 — Duty to Continue Work. Pending resolution of any Differing Site Condition claim, the Contractor shall not suspend or delay the Work unless directed to do so by the Engineer in writing. The Contractor shall proceed diligently with performance of the Contract, including any changes directed by the Engineer to address the Differing Site Condition. Failure to continue the Work shall constitute a material breach and may result in termination under Section 14.2.

7.3.1.6 — Waiver. Failure of the Contractor to provide written notice within the time period specified in Section 7.3.1.2, or failure to provide the information required therein, may result in waiver of the Contractor's right to an equitable adjustment for the Differing Site Condition. The Owner reserves the right to deny any claim for equitable adjustment where timely notice was not provided, unless the Contractor can demonstrate that the Owner had actual knowledge of the condition and suffered no prejudice from the late notice. In no event shall a claim for Differing Site Conditions be considered if notice is provided more than fourteen (14) calendar days after the Contractor's discovery of the condition.

7.3.1.7 — Dispute Resolution. If the Contractor disputes the Engineer's findings under Section 7.3.1.3, or if the parties cannot agree on the equitable adjustment under Section 7.3.1.4, the dispute shall be resolved in accordance with Article 15 — Claims and Disputes. The Contractor shall file a formal claim within twenty-one (21) calendar days of receiving the Engineer's findings or the Owner's proposed adjustment, whichever is later. Pending resolution of the dispute, the Contractor shall proceed with the Work as directed by the Engineer.`,
    keywords: ["differing site conditions", "concealed", "subsurface", "notice", "48 hours", "engineer", "adjust", "Type I", "Type II", "equitable adjustment", "waiver", "investigation", "change order", "dispute"],
  },
  {
    id: "gc-7.3.2",
    title: "General Conditions",
    section: "§7.3.2 — Notice Requirements",
    content: `Written notice of differing site conditions must be provided to the Engineer within 48 hours of discovery. Failure to provide timely notice may result in waiver of the Contractor's right to additional compensation or time extension. Notice shall include: (a) description of the condition, (b) location, (c) comparison to Contract Documents, (d) estimated impact to cost and schedule.`,
    keywords: ["notice", "48 hours", "written", "waiver", "compensation", "time extension"],
  },
  {
    id: "gc-4.2.1",
    title: "General Conditions",
    section: "§4.2.1 — Change Orders",
    content: `Changes in the Work may be accomplished after execution of the Contract, without invalidating the Contract, by Change Order or Construction Change Directive. A Change Order shall be based upon agreement among the Owner, Contractor, and Engineer. The Engineer will prepare the Change Order for execution by the Owner and Contractor.`,
    keywords: ["change order", "modification", "agreement", "owner", "contractor", "engineer"],
  },
  {
    id: "gc-4.2.3",
    title: "General Conditions",
    section: "§4.2.3 — Cost Determination",
    content: `If the Owner and Contractor do not agree on the cost of a change, the Contractor shall proceed with the work and the cost shall be determined by the Engineer on the basis of reasonable expenditures and savings, including a reasonable allowance for overhead and profit. Overhead and profit shall not exceed 15% combined.`,
    keywords: ["cost", "change", "overhead", "profit", "reasonable", "determination"],
  },
  {
    id: "gc-8.3.1",
    title: "General Conditions",
    section: "§8.3.1 — Time Extensions",
    content: `If the Contractor is delayed at any time in the progress of the Work by an act or neglect of the Owner or Engineer, by changes ordered in the Work, by labor disputes, fire, unusual delay in deliveries, unavoidable casualties, or other causes beyond the Contractor's control, then the Contract Time shall be extended by Change Order for such reasonable time as the Engineer may determine.`,
    keywords: ["delay", "time extension", "critical path", "change order", "beyond control"],
  },
  // Special Provisions
  {
    id: "sp-12.1",
    title: "Special Provisions",
    section: "§12.1 — Utility Relocation",
    content: `Contractor shall coordinate with all affected utility companies prior to commencement of utility relocation work. Known utilities are shown on the plans. Contractor is responsible for potholing and verifying locations of all utilities within 50 feet of proposed excavation. Any unmarked or mislocated utilities shall be reported to the Engineer immediately.`,
    keywords: ["utility", "relocation", "potholing", "unmarked", "mislocated", "coordinate"],
  },
  {
    id: "sp-12.3",
    title: "Special Provisions",
    section: "§12.3 — Storm Drain Installation",
    content: `Storm drain pipe shall be reinforced concrete pipe (RCP) conforming to ASTM C76. Minimum cover shall be 3 feet. Bedding shall be Class B per Standard Plans. Joints shall be rubber gasketed bell and spigot. Outfall structures shall include Type II energy dissipators where flow velocity exceeds 6 fps at design discharge.`,
    keywords: ["storm drain", "RCP", "pipe", "bedding", "outfall", "dissipator", "velocity"],
  },
  {
    id: "sp-12.4",
    title: "Special Provisions",
    section: "§12.4 — Water Main Conflicts",
    content: `Where new construction conflicts with existing water mains, minimum horizontal clearance of 10 feet and minimum vertical clearance of 18 inches shall be maintained. If minimum clearances cannot be achieved, the Engineer shall be notified and a revised alignment or protection method shall be approved prior to construction. Existing water mains shall not be disturbed without prior approval from the water utility.`,
    keywords: ["water main", "conflict", "clearance", "horizontal", "vertical", "protection", "alignment"],
  },
  // Utility proximity & encroachment
  {
    id: "sp-12.4.3",
    title: "Special Provisions",
    section: "§12.4.3 — Backfill in Utility Proximity Zones",
    content: `Where trench excavation is within 24 inches of an existing utility, backfill shall consist of imported Class II aggregate base material. Native material shall not be used within the utility proximity zone. Compaction shall achieve 95% relative compaction in lifts not exceeding 4 inches. Mechanical compaction equipment within the proximity zone shall be limited to hand-operated plate compactors not exceeding 200 lbs. Violation of proximity zone requirements may result in liability for utility damage.`,
    keywords: ["backfill", "utility", "proximity", "compaction", "aggregate", "imported", "lifts", "water main"],
  },
  {
    id: "sp-12.6",
    title: "Special Provisions",
    section: "§12.6 — Utility Owner Coordination & Encroachment Permits",
    content: `Prior to performing any construction work within 5 feet of an existing utility, the Contractor shall obtain an encroachment permit from the utility owner. Encroachment permit applications typically require 15-30 business days for processing. No work shall commence within the utility proximity zone until the encroachment permit is received and a pre-construction meeting with the utility owner is conducted. Failure to obtain required permits prior to construction constitutes a contract violation.`,
    keywords: ["utility", "encroachment", "permit", "coordination", "water main", "proximity", "owner"],
  },
  // Technical Specifications
  {
    id: "ts-301.2",
    title: "Technical Specifications",
    section: "§301.2 — Trench Excavation",
    content: `Trench excavation shall conform to Cal/OSHA requirements. Maximum trench width shall be pipe OD plus 24 inches. Excavation in unstable or saturated soils shall require shoring or trench boxes. Trench backfill shall be compacted to 90% relative compaction in 8-inch lifts. Compaction testing shall be performed at intervals not exceeding 200 linear feet.`,
    keywords: ["trench", "excavation", "shoring", "compaction", "backfill", "OSHA"],
  },
  {
    id: "ts-301.4",
    title: "Technical Specifications",
    section: "§301.4 — Pipe Installation",
    content: `Pipe shall be installed on a prepared bedding surface, true to line and grade. Minimum grade for storm drain shall be 0.5%. Maximum deflection at joints shall not exceed manufacturer's recommendations. Laser alignment shall be used for all pipe installation. CCTV inspection shall be performed prior to acceptance.`,
    keywords: ["pipe", "installation", "bedding", "grade", "laser", "CCTV", "deflection"],
  },
  {
    id: "ts-501.1",
    title: "Technical Specifications",
    section: "§501.1 — Concrete Structures",
    content: `Catch basin and manhole structures shall be constructed of Class A concrete (f'c = 4,000 psi at 28 days). Reinforcement shall be Grade 60 per ASTM A615. Forms shall be designed for full liquid head. Structure inverts shall be formed and finished smooth. Junction structures (including CB-7) shall accommodate the specified inlet and outlet pipe configurations as shown on the plans.`,
    keywords: ["concrete", "catch basin", "manhole", "junction", "CB-7", "reinforcement", "structure"],
  },
  {
    id: "ts-601.2",
    title: "Technical Specifications",
    section: "§601.2 — Energy Dissipators",
    content: `Type II energy dissipators shall be installed at all storm drain outfall locations where discharge velocity exceeds 6 fps. Dissipators shall be constructed of reinforced concrete with riprap apron. Dimensions shall conform to Caltrans Standard Plan D-76A. Riprap shall be Class V minimum, placed on geotextile fabric.`,
    keywords: ["dissipator", "energy", "Type II", "outfall", "velocity", "riprap", "Caltrans"],
  },
  // Schedule
  {
    id: "sch-ph2",
    title: "Project Schedule",
    section: "Phase 2 — Utility Relocation",
    content: `Phase 2 Duration: 120 calendar days. Current status: Day 82, 68% complete. Critical path activities: Storm drain installation (STA 40+00 to STA 48+00), CB-7 junction structure, outfall connection. Float remaining: 8 working days. Key milestone: Phase 2 completion August 15, 2026. Phase 3 paving cannot begin until Phase 2 utility work is accepted.`,
    keywords: ["schedule", "Phase 2", "critical path", "milestone", "float", "completion", "duration"],
  },
  {
    id: "sch-rfi",
    title: "Project Schedule",
    section: "RFI Response Timeline",
    content: `Per contract requirements, RFIs shall be responded to within 14 calendar days of receipt by the Engineer. For RFIs affecting critical path activities, expedited response within 7 calendar days may be requested. Contractor-caused delays due to insufficient RFI information shall not be cause for time extension.`,
    keywords: ["RFI", "response", "timeline", "14 days", "7 days", "expedited", "critical path"],
  },
];

export function searchDocuments(query: string): DocumentChunk[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 2);

  return getAllDocuments()
    .map((doc) => {
      let score = 0;
      const contentLower = doc.content.toLowerCase();
      const sectionLower = doc.section.toLowerCase();

      // Keyword matching
      for (const kw of doc.keywords) {
        if (queryLower.includes(kw)) score += 3;
        for (const word of queryWords) {
          if (kw.includes(word)) score += 1;
        }
      }

      // Content matching
      for (const word of queryWords) {
        if (contentLower.includes(word)) score += 1;
        if (sectionLower.includes(word)) score += 2;
      }

      return { doc, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ doc }) => doc);
}
