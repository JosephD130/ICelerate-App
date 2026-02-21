"use client";

import { useState, useRef, useCallback } from "react";
import {
  X,
  Mic,
  MicOff,
  Camera,
  Video,
  Paperclip,
  MapPin,
  AlertTriangle,
  Cpu,
  ChevronRight,
  Image as ImageIcon,
  FileText,
  Film,
} from "lucide-react";
import {
  createDecisionEvent,
  type Severity,
  type EventAttachment,
} from "@/lib/models/decision-event";
import { useSpeechToText } from "@/lib/hooks/use-speech-to-text";
import AttachmentChip from "./modes/AttachmentChip";
import { extractPdfText } from "@/lib/utils/pdf-extract";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (event: ReturnType<typeof createDecisionEvent>) => void;
}

const SEVERITY_OPTIONS: { value: Severity; label: string; color: string; dimColor: string }[] = [
  { value: "low", label: "Low", color: "var(--color-semantic-green)", dimColor: "var(--color-semantic-green-dim)" },
  { value: "medium", label: "Med", color: "var(--color-semantic-blue)", dimColor: "var(--color-semantic-blue-dim)" },
  { value: "high", label: "High", color: "var(--color-semantic-yellow)", dimColor: "var(--color-semantic-yellow-dim)" },
  { value: "critical", label: "Crit", color: "var(--color-semantic-red)", dimColor: "var(--color-semantic-red-dim)" },
];

export default function FieldCaptureModal({ open, onClose, onCreated }: Props) {
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [attachments, setAttachments] = useState<EventAttachment[]>([]);

  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleVoiceResult = useCallback((text: string) => {
    setDescription((prev) => (prev ? prev + " " + text : text));
  }, []);

  const { isSupported, isListening, interimText, error, start, stop } =
    useSpeechToText(handleVoiceResult);

  const handleFileCapture = useCallback(
    (files: FileList | null, kind: "photo" | "document") => {
      if (!files) return;
      Array.from(files).forEach((file) => {
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");
        const resolvedKind = isImage ? "photo" : kind;
        const attId = `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        setAttachments((prev) => [
          ...prev,
          {
            id: attId,
            kind: resolvedKind,
            title: file.name,
            rawText: isVideo ? `[Video: ${file.name}]` : "",
            metadata: {
              type: file.type,
              size: String(file.size),
              ...(isVideo ? { mediaType: "video" } : {}),
            },
            addedAt: new Date().toISOString(),
          },
        ]);

        // Extract text content from readable files
        if (!isVideo && !isImage) {
          if (file.type === "application/pdf") {
            // Use PDF parser for binary PDF files
            extractPdfText(file).then((text) => {
              if (text) {
                setAttachments((prev) =>
                  prev.map((a) =>
                    a.id === attId ? { ...a, rawText: text.slice(0, 50_000) } : a
                  )
                );
              }
            });
            // Also store PDF as data URL for viewing in EvidenceDrawer
            const pdfReader = new FileReader();
            pdfReader.onload = () => {
              const dataUrl = pdfReader.result as string;
              if (dataUrl) {
                setAttachments((prev) =>
                  prev.map((a) =>
                    a.id === attId ? { ...a, metadata: { ...a.metadata, dataUrl } } : a
                  )
                );
              }
            };
            pdfReader.readAsDataURL(file);
          } else {
            // Plain text, CSV, etc.
            const reader = new FileReader();
            reader.onload = () => {
              const text = typeof reader.result === "string" ? reader.result : "";
              if (text) {
                setAttachments((prev) =>
                  prev.map((a) =>
                    a.id === attId ? { ...a, rawText: text.slice(0, 50_000) } : a
                  )
                );
              }
            };
            reader.readAsText(file);
          }
        }

        // Convert images to base64 for Claude vision + store data URL for viewing
        if (isImage) {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(",")[1];
            if (base64) {
              setAttachments((prev) =>
                prev.map((a) =>
                  a.id === attId
                    ? { ...a, rawText: `[Image: ${file.name}]`, metadata: { ...a.metadata, base64Data: base64, mediaType: file.type, dataUrl } }
                    : a
                )
              );
            }
          };
          reader.readAsDataURL(file);
        }
      });
    },
    [],
  );

  const handleCreate = () => {
    if (!description.trim()) return;
    const event = createDecisionEvent({
      title: description.slice(0, 80) + (description.length > 80 ? "..." : ""),
      trigger: "Field capture — voice/media observation",
      station: "capture",
      severity,
      description,
      location: location || undefined,
      attachments,
    });
    onCreated(event);
    // Reset
    setDescription("");
    setLocation("");
    setSeverity("medium");
    setAttachments([]);
  };

  if (!open) return null;

  const displayText = description + (interimText ? (description ? " " : "") + interimText : "");
  const canSubmit = description.trim().length > 0 || attachments.length > 0;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-t-[20px] sm:rounded-[var(--radius-card)] w-full sm:max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-dim)] flex items-center justify-center">
                <MapPin size={16} className="text-[var(--color-accent)]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Field Capture
                </div>
                <div className="text-[10px] text-[var(--color-text-dim)]">
                  Voice, photo, or text
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--color-text-dim)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* Voice input area */}
            <div>
              <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                Describe what you see
              </label>
              <div className="relative">
                <textarea
                  value={displayText}
                  onChange={(e) => {
                    setDescription(e.target.value);
                  }}
                  className={`w-full h-28 bg-[var(--color-surface)] border rounded-[var(--radius-input)] p-3 pr-14 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] resize-none focus:outline-none transition-colors ${
                    isListening
                      ? "border-[var(--color-accent)] shadow-[0_0_12px_var(--color-accent-glow)]"
                      : "border-[var(--color-border)] focus:border-[var(--color-accent)]"
                  }`}
                  placeholder="Tap the mic or type your observation..."
                />
                {/* Mic button inside textarea */}
                {isSupported && (
                  <button
                    type="button"
                    onClick={isListening ? stop : start}
                    className={`absolute right-2 top-2 w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isListening
                        ? "bg-[var(--color-accent)] text-white animate-pulse"
                        : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                    }`}
                    aria-label={isListening ? "Stop recording" : "Start recording"}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                )}
              </div>
              {isListening && (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                  <span className="text-xs text-[var(--color-accent)]">
                    Listening...
                  </span>
                </div>
              )}
              {error && (
                <div className="text-xs text-[var(--color-semantic-red)] mt-1">
                  {error}
                </div>
              )}
            </div>

            {/* Media capture buttons */}
            <div>
              <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                Attach Evidence
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[var(--radius-sm)] bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/40 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-all cursor-pointer"
                >
                  <Camera size={20} />
                  <span className="text-[10px] font-medium">Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => videoRef.current?.click()}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[var(--radius-sm)] bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/40 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-all cursor-pointer"
                >
                  <Video size={20} />
                  <span className="text-[10px] font-medium">Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[var(--radius-sm)] bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]/40 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-all cursor-pointer"
                >
                  <Paperclip size={20} />
                  <span className="text-[10px] font-medium">File</span>
                </button>
              </div>
              {/* Hidden file inputs */}
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                multiple
                onChange={(e) => handleFileCapture(e.target.files, "photo")}
              />
              <input
                ref={videoRef}
                type="file"
                accept="video/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileCapture(e.target.files, "document")}
              />
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                multiple
                onChange={(e) => handleFileCapture(e.target.files, "document")}
              />
            </div>

            {/* Attachment previews */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((a) => (
                  <div
                    key={a.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]"
                  >
                    <span className="text-[var(--color-accent)] shrink-0">
                      {a.kind === "photo" ? (
                        <ImageIcon size={12} />
                      ) : a.metadata?.mediaType === "video" ? (
                        <Film size={12} />
                      ) : (
                        <FileText size={12} />
                      )}
                    </span>
                    <span className="truncate max-w-[120px]">{a.title}</span>
                    <button
                      onClick={() =>
                        setAttachments((prev) => prev.filter((x) => x.id !== a.id))
                      }
                      className="shrink-0 text-[var(--color-text-dim)] hover:text-[var(--color-semantic-red)] transition-colors cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Location */}
            <div>
              <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
                Location
              </label>
              <div className="relative">
                <MapPin
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]"
                />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-input)] py-2.5 pl-9 pr-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-dim)] focus:border-[var(--color-accent)] focus:outline-none"
                  placeholder="STA 42+50, Phase 2 Area B"
                />
              </div>
            </div>

            {/* Severity */}
            <div>
              <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">
                Severity
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SEVERITY_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSeverity(s.value)}
                    className="text-center py-2 rounded-[var(--radius-sm)] text-xs font-semibold transition-all border cursor-pointer"
                    style={{
                      borderColor: severity === s.value ? s.color : "var(--color-border)",
                      backgroundColor: severity === s.value ? s.dimColor : "var(--color-surface)",
                      color: severity === s.value ? s.color : "var(--color-text-muted)",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI processing info strip */}
            <div className="bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20 rounded-[var(--radius-sm)] p-3">
              <div className="flex items-center gap-2 mb-2">
                <Cpu size={14} className="text-[var(--color-accent)]" />
                <span className="text-xs font-semibold text-[var(--color-accent)]">
                  Opus 4.6 will analyze
                </span>
              </div>
              <div className="grid grid-cols-2 gap-y-1 gap-x-3">
                {[
                  "Extract risk signals",
                  "Find contract refs",
                  "Flag notice deadlines",
                  "Route to stakeholders",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)]"
                  >
                    <ChevronRight size={8} className="text-[var(--color-accent)] shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="px-5 py-4 border-t border-[var(--color-border)]">
            <button
              onClick={handleCreate}
              disabled={!canSubmit}
              className="w-full btn-primary py-3 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <AlertTriangle size={14} />
              Submit to AI Analysis
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
