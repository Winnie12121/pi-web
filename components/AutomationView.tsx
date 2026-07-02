"use client";

import { useCallback, useEffect, useState } from "react";
import { CreateAutomationModal, type AutomationSkill } from "./CreateAutomationModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { ui } from "./uiStyles";

function AutomationIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="13" width="7" height="7" rx="2" />
      <path d="M11 7.5h2.5a3 3 0 0 1 3 3V13" />
      <path d="M13 16.5h-2.5a3 3 0 0 1-3-3V11" />
    </svg>
  );
}

function SourceIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3" />
      <path d="M19.5 4.5 17 7" />
      <path d="M21 12h-3" />
      <path d="m9 12 2 2 4-5" />
    </svg>
  );
}

function StatusPill({ status }: { status: AutomationSkill["status"] }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 22, padding: "0 9px", borderRadius: 11, border: "1px solid var(--border)", background: "var(--bg-hover)", color: "var(--text)", fontSize: ui.font.meta, fontWeight: ui.weight.strong }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text)", flexShrink: 0 }} />
      {status === "ready" ? "Ready" : status}
    </span>
  );
}

function shortenPath(path: string): string {
  return path.replace(/^\/(?:Users|home)\/[^/]+/, "~");
}

interface Props {
  onOpenSkill?: (skillName: string) => void;
}

interface DisplayAutomationSkill extends AutomationSkill {
  mock?: boolean;
}

const MOCK_AUTOMATION_SKILL: DisplayAutomationSkill = {
  name: "offer-workflow-skill",
  description: "Create and send candidate offer emails, then update the tracker.",
  filePath: "mock:offer-workflow-skill",
  baseDir: "~/.pi/skills/offer-workflow-skill",
  source: "manual",
  lastRun: "Never",
  status: "ready",
  mock: true,
};

export function AutomationView({ onOpenSkill }: Props) {
  const [skills, setSkills] = useState<AutomationSkill[]>([]);
  const [skillsRoot, setSkillsRoot] = useState("~/.pi/agent/skills");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<AutomationSkill | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AutomationSkill | null>(null);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/automation")
      .then((r) => r.json())
      .then((data: { skills?: AutomationSkill[]; skillsRoot?: string; error?: string }) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setSkills(data.skills ?? []);
        if (data.skillsRoot) setSkillsRoot(shortenPath(data.skillsRoot));
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deleteSkill = useCallback(async () => {
    const skill = deleteTarget;
    if (!skill) return;
    setDeletingPath(skill.filePath);
    setError(null);
    try {
      const res = await fetch("/api/automation", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: skill.filePath }),
      });
      const data = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setSkills((prev) => prev.filter((item) => item.filePath !== skill.filePath));
      setDeleteTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeletingPath(null);
    }
  }, [deleteTarget]);

  const displaySkills: DisplayAutomationSkill[] = [
    MOCK_AUTOMATION_SKILL,
    ...skills.filter((skill) => skill.name !== MOCK_AUTOMATION_SKILL.name),
  ];

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "var(--bg)" }}>
      <div style={{ maxWidth: ui.automation.pageMaxWidth, margin: "0 auto", padding: ui.automation.pagePadding }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
          <div style={{ width: 34, height: 34, borderRadius: ui.radius.icon, background: "var(--bg-hover)", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AutomationIcon size={18} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: ui.font.pageTitle, lineHeight: 1.25, color: "var(--text)", fontWeight: ui.weight.heavy, letterSpacing: 0 }}>Automation</h1>
            <p style={{ margin: "7px 0 0", color: "var(--text-muted)", fontSize: ui.font.body, lineHeight: 1.5, maxWidth: 760 }}>
              Reusable automation skills generated from browser workflows. Stored under{" "}
              <code style={{ fontFamily: "var(--font-mono)", fontSize: ui.font.label, padding: "1px 5px", borderRadius: ui.radius.code, background: "var(--bg-hover)", color: "var(--text-muted)" }}>{skillsRoot}</code>.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 22, flexWrap: "wrap" }}>
          <button
            disabled
            title="Import from Recorder coming soon"
            style={{ height: ui.control.inputHeight, display: "inline-flex", alignItems: "center", gap: 7, padding: "0 13px", borderRadius: ui.radius.button, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-dim)", fontSize: ui.font.body, fontWeight: ui.weight.semibold, cursor: "not-allowed", opacity: 0.55 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12" />
              <path d="m8 11 4 4 4-4" />
              <path d="M20 17.5A4.5 4.5 0 0 0 15.5 13H15" />
              <path d="M4 17.5A4.5 4.5 0 0 1 8.5 13H9" />
            </svg>
            Import from Recorder
          </button>
          <button
            onClick={() => setModalOpen(true)}
            style={{ height: ui.control.inputHeight, display: "inline-flex", alignItems: "center", gap: 8, padding: "0 15px", borderRadius: ui.radius.button, border: "none", background: "var(--text)", color: "var(--bg)", fontSize: ui.font.body, fontWeight: ui.weight.strong, cursor: "pointer", boxShadow: "0 2px 7px rgba(0,0,0,0.14)" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Automation
          </button>
        </div>

        <div style={{ marginTop: 26, border: "1px solid var(--border)", borderRadius: ui.radius.panel, overflow: "hidden", background: "var(--bg)" }}>
          <div style={{ display: "grid", gridTemplateColumns: ui.automation.tableColumns, gap: 12, padding: "11px 16px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", fontSize: ui.font.meta, fontWeight: ui.weight.heavy, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            <div>Skill</div>
            <div>Source</div>
            <div>Last Run</div>
            <div>Status</div>
            <div />
          </div>

          {loading ? (
            <div style={{ padding: 22, color: "var(--text-muted)", fontSize: ui.font.body }}>Loading...</div>
          ) : error ? (
            <div style={{ padding: 22, color: "#ef4444", fontSize: ui.font.body }}>{error}</div>
          ) : displaySkills.length === 0 ? (
            <div style={{ padding: "32px 22px", color: "var(--text-muted)", fontSize: ui.font.body, lineHeight: 1.55 }}>
              No automation skills yet. Create a blank workspace to get started.
            </div>
          ) : (
            displaySkills.map((skill) => (
              <div
                key={skill.filePath}
                style={{ display: "grid", gridTemplateColumns: ui.automation.tableColumns, gap: 12, alignItems: "center", padding: "14px 16px", borderBottom: "1px solid var(--border)" }}
              >
                <div style={{ minWidth: 0 }}>
                  <button
                    onClick={() => {
                      if (skill.mock) onOpenSkill?.(skill.name);
                    }}
                    title={skill.mock ? "Open automation workspace" : skill.name}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: 0,
                      border: "none",
                      background: "none",
                      fontFamily: "var(--font-mono)",
                      fontSize: ui.font.body,
                      fontWeight: ui.weight.bold,
                      color: skill.mock ? "var(--accent)" : "var(--text)",
                      cursor: skill.mock ? "pointer" : "default",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      textAlign: "left",
                    }}
                  >
                    {skill.name}
                  </button>
                  <div style={{ marginTop: 4, fontSize: ui.font.label, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{skill.description}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: ui.font.label }}>
                  <SourceIcon />
                  {skill.source === "manual" ? "Manual" : "Unknown"}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: ui.font.label }}>{skill.lastRun}</div>
                <div><StatusPill status={skill.status} /></div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 5 }}>
                  <button
                    onClick={() => {
                      if (!skill.mock) setEditingSkill(skill);
                    }}
                    disabled={skill.mock}
                    title={skill.mock ? "Mock workspace editing is not available yet" : "Edit automation"}
                    style={{ width: ui.control.iconButton, height: ui.control.iconButton, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", borderRadius: ui.radius.control, background: "var(--bg)", color: skill.mock ? "var(--text-dim)" : "var(--text-muted)", cursor: skill.mock ? "not-allowed" : "pointer", padding: 0, opacity: skill.mock ? 0.45 : 1 }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      if (!skill.mock) setDeleteTarget(skill);
                    }}
                    disabled={skill.mock || deletingPath === skill.filePath}
                    title={skill.mock ? "Mock workspace deletion is not available yet" : "Delete automation"}
                    style={{ width: ui.control.iconButton, height: ui.control.iconButton, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", borderRadius: ui.radius.control, background: "var(--bg)", color: (skill.mock || deletingPath === skill.filePath) ? "var(--text-dim)" : "#ef4444", cursor: skill.mock ? "not-allowed" : deletingPath === skill.filePath ? "wait" : "pointer", padding: 0, opacity: (skill.mock || deletingPath === skill.filePath) ? 0.55 : 1 }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="m19 6-1 14H6L5 6" />
                      <path d="M10 11v5" />
                      <path d="M14 11v5" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {modalOpen && (
        <CreateAutomationModal
          onClose={() => setModalOpen(false)}
          onCreated={(skill) => {
            setSkills((prev) => [skill, ...prev.filter((s) => s.filePath !== skill.filePath)].sort((a, b) => a.name.localeCompare(b.name)));
          }}
        />
      )}
      {editingSkill && (
        <CreateAutomationModal
          skill={editingSkill}
          onClose={() => setEditingSkill(null)}
          onCreated={(skill) => {
            setSkills((prev) => [skill, ...prev.filter((s) => s.filePath !== skill.filePath)].sort((a, b) => a.name.localeCompare(b.name)));
          }}
          onUpdated={(skill) => {
            setSkills((prev) => [skill, ...prev.filter((s) => s.filePath !== editingSkill.filePath)].sort((a, b) => a.name.localeCompare(b.name)));
          }}
        />
      )}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete automation skill?"
        description={deleteTarget ? `This will permanently remove "${deleteTarget.name}" and its workspace from your global skills folder.` : ""}
        confirmLabel="Delete"
        destructive
        loading={Boolean(deleteTarget && deletingPath === deleteTarget.filePath)}
        onCancel={() => {
          if (!deletingPath) setDeleteTarget(null);
        }}
        onConfirm={() => void deleteSkill()}
      />
    </div>
  );
}
