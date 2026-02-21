import Link from "next/link";
import Image from "next/image";
import {
  HardHat,
  Briefcase,
  Eye,
  FileText,
  FileSearch,
  Languages,
  Bot,
  Inbox,
  LayoutDashboard,
  Database,
  Globe,
  Sparkles,
  ArrowRight,
  Shield,
  Cpu,
  Layers,
  Radio,
  Search,
  Users,
  Zap,
} from "lucide-react";

/* ── data ────────────────────────────────────────────── */

const PERSPECTIVES = [
  {
    icon: HardHat,
    title: "Field Tech",
    body: "Enter daily field data \u2014 weather, workforce, issues. AI generates professional narratives, scores quality against contract specs, and flags notice triggers before deadlines expire.",
  },
  {
    icon: Briefcase,
    title: "Project Manager",
    body: "Full control surface: field reports, RFI generation, multi-stakeholder translations, evidence review, and AI-powered contract analysis. Every tool is context-aware from day one.",
  },
  {
    icon: Eye,
    title: "Stakeholder",
    body: "Verified project health at a glance. Cost exposure, schedule risk, notice deadlines \u2014 filtered to show only evidence-backed data. No raw field noise.",
  },
];

const TOOLS = [
  {
    icon: FileText,
    title: "Field Report",
    body: "Structured daily field reports with weather, bid items, issues, and workforce. Opus 4.6 generates the narrative, scores quality, and flags contract triggers automatically.",
  },
  {
    icon: FileSearch,
    title: "RFI Generator",
    body: "Describe a field condition in two sentences. Opus 4.6 searches 150 pages of specs, checks if it\u2019s already answered, identifies notice requirements, and writes a contractually complete RFI.",
  },
  {
    icon: Languages,
    title: "The Translator",
    body: "One technical update, every audience. Select a persona, adjust tone with sliders, choose a Briefing Room \u2014 and watch the same information reshape for directors, finance, or field crews.",
  },
  {
    icon: Bot,
    title: "AI Assistant",
    body: "Your thinking partner for PM strategy, field best practices, and career development. Every conversation builds your long-term communication profile.",
  },
  {
    icon: Inbox,
    title: "Evidence Inbox",
    body: "Incoming evidence from email, Procore, and field captures \u2014 each analyzed by Opus 4.6 with risk assessment, entitlement strength, and a clear approve/reject recommendation.",
  },
  {
    icon: LayoutDashboard,
    title: "Engineer Dashboard",
    body: "DISC personality profile, Engineer Score, and PM archetype \u2014 all inferred from how you communicate, document, and resolve issues across projects.",
  },
];

const PIPELINE_STEPS = [
  {
    icon: Radio,
    title: "Capture",
    subtitle: "Field Report Ingestion",
    body: "Raw field observations become structured events with cost, schedule, and contract signals.",
  },
  {
    icon: Search,
    title: "Analyze",
    subtitle: "Contract Position",
    body: "Opus 4.6 cross-references specs, checks notice requirements, and assesses entitlement.",
  },
  {
    icon: Users,
    title: "Decide",
    subtitle: "Stakeholder Packages",
    body: "4 simultaneous role-adapted outputs from a single input — executive, finance, engineer, field.",
  },
  {
    icon: Zap,
    title: "Communicate",
    subtitle: "Cross-Check Synthesis",
    body: "AI audits all outputs for timeline conflicts, spec gaps, precedent challenges, and hidden dependencies.",
  },
];

const ARCH_LAYERS = [
  {
    icon: Layers,
    title: "Frontend",
    items: [
      "Next.js application",
      "Role-based UI (Field / PM / Exec)",
      "Streaming responses via SSE",
      "Evidence inbox + inline doc viewer",
    ],
  },
  {
    icon: Cpu,
    title: "Backend",
    items: [
      "Single API endpoint",
      "Tool-specific system prompts",
      "Multi-stream parallel generation",
      "Evidence signal extraction",
    ],
  },
  {
    icon: Shield,
    title: "Trust Layer",
    items: [
      "Deterministic citation validation",
      "AI-generated confidence scoring",
      "Human approval gate",
      "Calibration tracking",
    ],
  },
  {
    icon: Database,
    title: "Memory",
    items: [
      "Short-term: project-scoped evidence",
      "Long-term: cross-project cases & lessons",
      "Source freshness tracking",
      "Pattern matching from precedents",
    ],
  },
];

/* ── page ────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* ─── Nav ─────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex items-center justify-end gap-4 sm:gap-6 px-4 sm:px-8 py-4 border-b border-[var(--color-border)] bg-[var(--color-navy)]/90 backdrop-blur-md">
        <a
          href="#about"
          className="text-xs font-data uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          About
        </a>
        <a
          href="#tools"
          className="text-xs font-data uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          Tools
        </a>
        <a
          href="#architecture"
          className="text-xs font-data uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          Architecture
        </a>
        <Link
          href="/projects"
          className="text-xs font-data uppercase tracking-widest text-[var(--color-text-primary)] border border-[var(--color-text-muted)] rounded-full px-4 py-1.5 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
        >
          Launch
        </Link>
      </nav>

      {/* ─── Hero ────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center text-center min-h-[90vh] px-6 overflow-hidden">
        {/* Background layers */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(30,58,95,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(30,58,95,0.4) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(30,58,95,0.6) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 60%, rgba(15,29,50,0.8) 0%, transparent 70%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-2xl">
          {/* Logo */}
          <div className="inline-flex items-center gap-3 mb-8">
            <Image
              src="/Logo-ICelerate.png"
              alt="ICelerate"
              width={240}
              height={54}
              className="object-contain"
              priority
            />
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-[3.2rem] font-bold text-[var(--color-text-primary)] leading-[1.15] mb-6">
            <span className="text-[var(--color-accent)] whitespace-nowrap">Field-to-office intelligence</span> that accelerates infrastructure decisions.
          </h1>

          {/* Body */}
          <p className="text-base md:text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-xl mx-auto mb-4">
            ICelerate turns daily field reports into verified evidence, detects
            contract triggers, and delivers role-specific decision views for
            Field, PMs, and Stakeholders.
          </p>

          {/* Powered line */}
          <p className="text-xs text-[var(--color-text-dim)] mb-8">
            Powered by Claude Opus 4.6. Dual-memory architecture. Built by
            Joseph Dib, PE, PMP.
          </p>

          {/* CTA */}
          <Link href="/projects" className="btn-primary inline-block text-sm">
            Launch Workspace
          </Link>

          {/* Sub-CTA */}
          <p className="text-xs text-[var(--color-text-dim)] mt-4 leading-relaxed">
            4 pre-loaded projects. No signup required.
          </p>
        </div>
      </section>

      {/* ─── Three Perspectives ──────────────────── */}
      <section
        id="about"
        className="px-6 py-20 flex flex-col items-center"
        style={{ scrollMarginTop: "3.5rem" }}
      >
        <div className="max-w-4xl w-full bg-[var(--color-card)] border border-[var(--color-accent)]/25 rounded-[var(--radius-card)] p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold italic text-[var(--color-text-primary)] text-center mb-10">
            One platform, three roles
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PERSPECTIVES.map((p) => (
              <div key={p.title} className="flex flex-col items-start">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-muted)] mb-3">
                  <p.icon size={20} />
                </div>
                <h3 className="text-xs font-data font-bold uppercase tracking-[1.2px] text-[var(--color-text-primary)] mb-2">
                  {p.title}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI-Powered Tools (light) ────────────── */}
      <section
        id="tools"
        className="light-content py-20 px-6"
        style={{ scrollMarginTop: "3.5rem" }}
      >
        <div className="max-w-5xl mx-auto">
          {/* Section label */}
          <div className="flex items-center gap-2 mb-10">
            <Sparkles size={16} className="text-[var(--color-accent)]" />
            <span className="text-xs font-data font-bold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
              AI-Powered Tools
            </span>
          </div>

          {/* Tool grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-10">
            {TOOLS.map((tool) => (
              <div key={tool.title}>
                <div className="w-9 h-9 rounded-lg bg-[var(--color-accent-dim)] flex items-center justify-center text-[var(--color-accent)] mb-3">
                  <tool.icon size={18} />
                </div>
                <h3 className="text-xs font-data font-bold uppercase tracking-[1.2px] text-[var(--color-text-primary)] mb-2">
                  {tool.title}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {tool.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Dual Memory Architecture ────────────── */}
      <section
        className="py-20 px-6"
        style={{
          background:
            "linear-gradient(135deg, #1a1207 0%, #2d1f0e 20%, #4a3520 40%, #8b6040 60%, #c4956a 80%, #e8c9a8 100%)",
        }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left — headline */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] leading-tight mb-4">
              Dual-memory
              <br />
              architecture
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-sm">
              Short-term memory gives every tool project context from day one.
              Long-term memory learns your patterns and makes ICelerate smarter
              with every project.
            </p>
          </div>

          {/* Right — cards */}
          <div className="space-y-4">
            {/* Short-term */}
            <div className="bg-[rgba(255,240,225,0.9)] rounded-[var(--radius-card)] p-5 border border-[#d4a574]/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-[#8b6040]" />
                  <span className="text-xs font-data font-bold uppercase tracking-[1.2px] text-[#2d1f0e]">
                    Short-Term Memory
                  </span>
                </div>
                <span className="text-[9px] font-data font-bold uppercase tracking-widest text-[#8b6040]">
                  Project Scope
                </span>
              </div>
              <p className="text-sm text-[#4a3520] leading-relaxed">
                Contract docs, specs, schedule baselines, and daily logs &mdash;
                all indexed and retrievable. Every AI tool searches your project
                documents before responding.
              </p>
            </div>

            {/* Long-term */}
            <div className="bg-[rgba(255,240,225,0.9)] rounded-[var(--radius-card)] p-5 border border-[#d4a574]/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-[#8b6040]" />
                  <span className="text-xs font-data font-bold uppercase tracking-[1.2px] text-[#2d1f0e]">
                    Long-Term Memory
                  </span>
                </div>
                <span className="text-[9px] font-data font-bold uppercase tracking-widest text-[#8b6040]">
                  PM-Scopes
                </span>
              </div>
              <p className="text-sm text-[#4a3520] leading-relaxed">
                Communication style, resolution patterns, recurring risk types.
                Built passively from every report you write and every decision
                you make &mdash; no forms, no debriefs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Technical Architecture ──────────────── */}
      <section id="architecture" className="py-20 px-6" style={{ scrollMarginTop: "3.5rem" }}>
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Cpu size={16} className="text-[var(--color-accent)]" />
              <span className="text-xs font-data font-bold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
                Technical Architecture
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
              Decision Pipeline
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2 max-w-lg mx-auto">
              A single field observation cascades through four stations &mdash;
              each powered by Claude Opus 4.6.
            </p>
          </div>

          {/* Pipeline flow */}
          <div className="flex flex-col md:flex-row items-stretch gap-3 mb-14">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.title} className="flex items-stretch flex-1 min-w-0">
                {/* Card */}
                <div className="flex-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-5 hover:border-[var(--color-accent)]/40 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-dim)] flex items-center justify-center text-[var(--color-accent)] shrink-0">
                      <step.icon size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-data font-bold uppercase tracking-[1.2px] text-[var(--color-text-primary)]">
                        {step.title}
                      </div>
                      <div className="text-[10px] font-data text-[var(--color-accent)]">
                        {step.subtitle}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {step.body}
                  </p>
                </div>
                {/* Arrow connector */}
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="hidden md:flex items-center px-1 text-[var(--color-accent)]">
                    <ArrowRight size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Infrastructure layers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ARCH_LAYERS.map((layer) => (
              <div
                key={layer.title}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <layer.icon size={16} className="text-[var(--color-text-muted)]" />
                  <span className="text-xs font-data font-bold uppercase tracking-[1.2px] text-[var(--color-text-primary)]">
                    {layer.title}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {layer.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      <span className="w-1 h-1 rounded-full bg-[var(--color-accent)] mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────── */}
      <footer className="border-t border-[var(--color-border)] py-6 px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Image
            src="/Logo-ICelerate.png"
            alt="ICelerate"
            width={140}
            height={32}
            className="object-contain opacity-70"
          />
          <span className="text-xs text-[var(--color-text-dim)] font-data">
            ICelerate &copy; 2026
          </span>
          <span className="text-xs text-[var(--color-text-dim)]">
            Built by Joseph Dib, PE, PMP
          </span>
        </div>
      </footer>
    </div>
  );
}
