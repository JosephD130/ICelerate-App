"use client";

import { useState, useMemo, useRef } from "react";
import {
  FileText,
  Search,
  Upload,
  BookOpen,
  Hash,
  Loader2,
  Trash2,
} from "lucide-react";
import SectionTitle from "@/components/shared/SectionTitle";
import { getAllDocuments, searchDocuments, refreshUploadedChunksCache } from "@/lib/demo/documents";
import { FLAGS } from "@/lib/flags";
import { extractPdfText } from "@/lib/utils/pdf-extract";
import { extractExcelText } from "@/lib/utils/excel-extract";
import { chunkText } from "@/lib/utils/chunk-text";
import { addChunks, deleteByFile } from "@/lib/storage/document-store";
import { useActiveProject } from "@/lib/contexts/project-context";

const DOC_GROUPS = [
  { title: "General Conditions", prefix: "gc-", color: "var(--color-semantic-blue)" },
  { title: "Special Provisions", prefix: "sp-", color: "var(--color-semantic-purple)" },
  { title: "Technical Specifications", prefix: "ts-", color: "var(--color-semantic-green)" },
  { title: "Project Schedule", prefix: "sch-", color: "var(--color-semantic-yellow)" },
  { title: "Uploaded Documents", prefix: "upload-", color: "var(--color-accent)" },
];

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [, setRefreshKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { activeProject } = useActiveProject();

  const allDocs = useMemo(() => getAllDocuments(), []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filteredDocs = useMemo(() => {
    const docs = getAllDocuments();
    if (!searchQuery.trim()) return docs;
    return searchDocuments(searchQuery);
  }, [searchQuery]);

  const activeDoc = getAllDocuments().find((d) => d.id === selectedDoc);

  const handleUpload = async (file: File) => {
    if (!FLAGS.realFileProcessing) return;
    setIsUploading(true);
    try {
      let text = "";
      if (file.name.toLowerCase().endsWith(".pdf")) {
        text = await extractPdfText(file);
      } else {
        text = await extractExcelText(file);
      }

      if (text) {
        const chunks = chunkText(text, file.name, activeProject.id);
        await addChunks(chunks);
        await refreshUploadedChunksCache(activeProject.id);
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteUploaded = async (docId: string) => {
    const doc = getAllDocuments().find((d) => d.id === docId);
    if (!doc) return;
    // Extract filename from the chunk ID pattern: upload-{hash}-{index}
    // We need to find all chunks with the same prefix
    const prefix = docId.replace(/-\d+$/, "");
    const fileName = doc.title.replace("Uploaded: ", "").replace(/ /g, "_");
    await deleteByFile(activeProject.id, fileName);
    await refreshUploadedChunksCache(activeProject.id);
    setSelectedDoc(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center bg-[var(--color-semantic-blue-dim)] text-[var(--color-semantic-blue)]">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              Documents
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              {getAllDocuments().length} document sections loaded in context
            </p>
          </div>
        </div>
        <input
          type="file"
          accept=".pdf,.xlsx,.xls,.csv"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          {isUploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload size={16} />
              Upload Document
            </>
          )}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]"
        />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-input)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-semantic-blue)] focus:outline-none"
          placeholder="Search documents by keyword, section, or content..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
        {/* Left — Document list */}
        <div className="space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto">
          {DOC_GROUPS.map((group) => {
            const docs = filteredDocs.filter((d) => d.id.startsWith(group.prefix));
            if (docs.length === 0) return null;

            return (
              <div key={group.prefix}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <BookOpen size={12} style={{ color: group.color }} />
                  <span className="text-xs font-semibold uppercase tracking-[1.2px] text-[var(--color-text-muted)]">
                    {group.title}
                  </span>
                  <span className="text-xs font-data text-[var(--color-text-dim)] ml-auto">
                    {docs.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {docs.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc.id)}
                      className={`w-full text-left px-3 py-2 rounded-[var(--radius-sm)] text-xs transition-all ${
                        selectedDoc === doc.id
                          ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] border-l-2"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] border-l-2 border-l-transparent"
                      }`}
                      style={
                        selectedDoc === doc.id
                          ? { borderLeftColor: group.color }
                          : undefined
                      }
                    >
                      <div className="font-medium truncate">{doc.section}</div>
                      <div className="text-xs text-[var(--color-text-dim)] mt-0.5 flex items-center gap-1">
                        <Hash size={8} />
                        {doc.id}
                        {doc.id.startsWith("upload-") && (
                          <span
                            className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
                            style={{ background: "var(--color-accent-dim)", color: "var(--color-accent)" }}
                          >
                            UPLOADED
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right — Document viewer */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-[var(--radius-card)] p-5 min-h-[500px]">
          {activeDoc ? (
            <>
              <div className="mb-4 pb-3 border-b border-[var(--color-border)]">
                <div className="flex items-center justify-between">
                  <SectionTitle>{activeDoc.title}</SectionTitle>
                  {activeDoc.id.startsWith("upload-") && (
                    <button
                      onClick={() => handleDeleteUploaded(activeDoc.id)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-[var(--radius-sm)] transition-colors hover:bg-[var(--color-semantic-red-dim)]"
                      style={{ color: "var(--color-semantic-red)" }}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  )}
                </div>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mt-2">
                  {activeDoc.section}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-data text-[var(--color-text-dim)]">
                    ID: {activeDoc.id}
                  </span>
                  <span className="text-xs text-[var(--color-text-dim)]">·</span>
                  <span className="text-xs font-data text-[var(--color-text-dim)]">
                    {activeDoc.keywords.length} keywords
                  </span>
                  {activeDoc.id.startsWith("upload-") && (
                    <>
                      <span className="text-xs text-[var(--color-text-dim)]">·</span>
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
                        style={{ background: "var(--color-accent-dim)", color: "var(--color-accent)" }}
                      >
                        UPLOADED
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                {activeDoc.content}
              </div>

              <div className="mt-6 pt-3 border-t border-[var(--color-border)]">
                <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                  Keywords
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeDoc.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-0.5 bg-[var(--color-surface)] rounded-[var(--radius-pill)] text-xs text-[var(--color-text-secondary)] font-data"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-[var(--color-text-dim)]">
              <FileText size={32} className="mb-3 opacity-50" />
              <p className="text-sm">Select a document to view its contents</p>
              <p className="text-sm mt-1">
                These documents are automatically included as RAG context in all tools
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
