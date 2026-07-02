"use client";

import { useCallback, useState } from "react";
import type { ReactNode } from "react";

export interface AutomationSkill {
  name: string;
  description: string;
  filePath: string;
  baseDir: string;
  source: "manual" | "unknown";
  lastRun: string;
  status: "ready";
}

interface Props {
  skill?: AutomationSkill | null;
  onClose: () => void;
  onCreated: (skill: AutomationSkill) => void;
  onUpdated?: (skill: AutomationSkill) => void;
}

function SourceOption({
  title,
  description,
  selected,
  disabled,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  selected?: boolean;
  disabled?: boolean;
  icon: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        minHeight: 76,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        background: selected ? "var(--bg-hover)" : "var(--bg)",
        border: selected ? "1px solid var(--text)" : "1px solid var(--border)",
        borderRadius: 10,
        color: disabled ? "var(--text-dim)" : "var(--text)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        textAlign: "left",
      }}
    >
      <span style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexShrink: 0 }}>
        {icon}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: disabled ? "var(--text-dim)" : "var(--text)" }}>{title}</span>
        <span style={{ display: "block", marginTop: 4, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>{description}</span>
      </span>
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: selected ? "none" : "1px solid var(--border)",
          background: selected ? "var(--text)" : "transparent",
          color: "var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {selected && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
    </button>
  );
}

function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Skill name is required";
  if (trimmed.length > 64) return "Skill name must be 64 characters or less";
  if (!/^[a-z0-9-]+$/.test(trimmed)) return "Use lowercase letters, numbers, and hyphens only";
  if (trimmed.startsWith("-") || trimmed.endsWith("-")) return "Skill name cannot start or end with a hyphen";
  if (trimmed.includes("--")) return "Skill name cannot contain consecutive hyphens";
  return null;
}

export function CreateAutomationModal({ skill, onClose, onCreated, onUpdated }: Props) {
  const isEditing = Boolean(skill);
  const [name, setName] = useState(skill?.name ?? "");
  const [description, setDescription] = useState(skill?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validationError = name.trim() ? validateName(name) : null;
  const canSave = Boolean(name.trim() && description.trim() && !validationError && !saving);

  const save = useCallback(async () => {
    const nameError = validateName(name);
    if (nameError) {
      setError(nameError);
      return;
    }
    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const method = isEditing ? "PATCH" : "POST";
      const res = await fetch("/api/automation", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing ? { filePath: skill?.filePath } : { source: "blank" }),
          name: name.trim(),
          description: description.trim(),
        }),
      });
      const data = await res.json() as { skill?: AutomationSkill; error?: string };
      if (!res.ok || data.error || !data.skill) {
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      if (isEditing) onUpdated?.(data.skill);
      else onCreated(data.skill);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }, [canSave, description, isEditing, name, onClose, onCreated, onUpdated, skill?.filePath]);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "min(720px, calc(100vw - 48px))", maxHeight: "calc(100vh - 48px)", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 14, boxShadow: "0 18px 60px rgba(0,0,0,0.28)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "24px 28px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", gap: 18 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 750, color: "var(--text)", lineHeight: 1.2 }}>{isEditing ? "Edit Automation Skill" : "Create Automation Skill"}</div>
            <div style={{ marginTop: 10, fontSize: 15, color: "var(--text-muted)", lineHeight: 1.5, maxWidth: 560 }}>
              {isEditing ? "Update the name and description for this automation skill." : "Scaffold a new reusable skill workspace under your global skills folder."}
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close"
            style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0, flexShrink: 0 }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: "24px 28px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 22 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Skill name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="offer-workflow-skill"
              autoFocus
              style={{ height: 48, border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg)", color: "var(--text)", padding: "0 16px", fontSize: 15, outline: "none", fontFamily: "var(--font-mono)" }}
            />
            {validationError && (
              <span style={{ fontSize: 12, color: "#ef4444", lineHeight: 1.4 }}>
                {validationError}
              </span>
            )}
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Description</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Automate offer email creation and tracker updates"
              style={{ height: 48, border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg)", color: "var(--text)", padding: "0 16px", fontSize: 15, outline: "none" }}
            />
          </label>

          {!isEditing && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>Source</div>
              <SourceOption
                title="Blank Skill"
                description="Start from an empty SKILL.md scaffold."
                selected
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M8 13h8" /><path d="M8 17h5" /></svg>}
              />
              <SourceOption
                title="Import skill.md"
                description="Upload an existing skill.md file. Coming soon."
                disabled
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H7a4 4 0 0 0-4 4v2" /><path d="M8 21H7a4 4 0 0 1-4-4v-2" /><path d="M16 3h1a4 4 0 0 1 4 4v2" /><path d="M16 21h1a4 4 0 0 0 4-4v-2" /></svg>}
              />
            </div>
          )}

          {error && <div style={{ fontSize: 13, color: "#ef4444" }}>{error}</div>}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 28px", borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
          <button
            onClick={onClose}
            style={{ height: 42, padding: "0 18px", border: "1px solid var(--border)", borderRadius: 9, background: "var(--bg)", color: "var(--text)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!canSave}
            style={{ height: 42, padding: "0 20px", border: "none", borderRadius: 9, background: canSave ? "var(--text)" : "var(--bg-hover)", color: canSave ? "var(--bg)" : "var(--text-dim)", fontSize: 14, fontWeight: 700, cursor: canSave ? "pointer" : "not-allowed" }}
          >
            {saving ? (isEditing ? "Saving..." : "Creating...") : (isEditing ? "Save Changes" : "Create Workspace")}
          </button>
        </div>
      </div>
    </div>
  );
}
