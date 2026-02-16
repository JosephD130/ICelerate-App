"use client";

import { createDecisionEvent } from "@/lib/models/decision-event";
import { useRole } from "@/lib/contexts/role-context";
import FieldCaptureModal from "./FieldCaptureModal";
import PmCreateModal from "./PmCreateModal";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (event: ReturnType<typeof createDecisionEvent>) => void;
}

/**
 * Role-adaptive creation modal.
 * - Field superintendent → FieldCaptureModal (voice, camera, mobile-first)
 * - PM / default        → PmCreateModal (structured entry + document import)
 * - Exec role never reaches here (button shows "Board-Ready Export" instead)
 */
export default function CreateEventModal({ open, onClose, onCreated }: Props) {
  const { role } = useRole();

  if (role === "field") {
    return <FieldCaptureModal open={open} onClose={onClose} onCreated={onCreated} />;
  }

  return <PmCreateModal open={open} onClose={onClose} onCreated={onCreated} />;
}
