"use client";

import { useCallback, useEffect, useState } from "react";
import { CreateAutomationModal, type AutomationSkill } from "./CreateAutomationModal";
import { ConfirmDialog } from "./ConfirmDialog";

function AutomationIcon({ size = 22 }: { size?: number }) {
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3" />
      <path d="M19.5 4.5 17 7" />
      <path d="M21 12h-3" />
      <path d="m9 12 2 2 4-5" />
    </svg>
  );
}

function StatusPill({ status }: { status: AutomationSkill["status"] }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 26, padding: "0 12px", borderRadius: 13, border: "1px solid var(--border)", background: "var(--bg-hover)", color: "var(--text)", fontSize: 13, fontWeight: 700 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--text)", flexShrink: 0 }} />
      {status === "ready" ? "Ready" : status}
    </span>
  );
}

function shortenPath(path: string): string {
  return path.replace(/^\/(?:Users|home)\/[^/]+/, "~");
}

export function AutomationView() {
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

  return (
    <div style={{ height: "100%", overflowY: "auto", background: "var(--bg)" }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "54px 32px 40px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bg-hover)", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AutomationIcon size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 26, lineHeight: 1.2, color: "var(--text)", fontWeight: 800, letterSpacing: 0 }}>Automation</h1>
            <p style={{ margin: "12px 0 0", color: "var(--text-muted)", fontSize: 16, lineHeight: 1.45, maxWidth: 820 }}>
              Reusable automation skills generated from browser workflows. Stored under{" "}
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 15, padding: "2px 5px", borderRadius: 5, background: "var(--bg-hover)", color: "var(--text-muted)" }}>{skillsRoot}</code>.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 28, flexWrap: "wrap" }}>
          <button
            disabled
            title="Import from Recorder coming soon"
            style={{ height: 46, display: "inline-flex", alignItems: "center", gap: 9, padding: "0 18px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-dim)", fontSize: 15, fontWeight: 650, cursor: "not-allowed", opacity: 0.55 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12" />
              <path d="m8 11 4 4 4-4" />
              <path d="M20 17.5A4.5 4.5 0 0 0 15.5 13H15" />
              <path d="M4 17.5A4.5 4.5 0 0 1 8.5 13H9" />
            </svg>
            Import from Recorder
          </button>
          <button
            onClick={() => setModalOpen(true)}
            style={{ height: 46, display: "inline-flex", alignItems: "center", gap: 10, padding: "0 20px", borderRadius: 10, border: "none", background: "var(--text)", color: "var(--bg)", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 10px rgba(0,0,0,0.16)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Automation
          </button>
        </div>

        <div style={{ marginTop: 34, border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", background: "var(--bg)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(240px, 1.4fr) minmax(150px, 0.75fr) minmax(130px, 0.65fr) minmax(110px, 0.5fr) 86px", gap: 16, padding: "14px 22px", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 12, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            <div>Skill</div>
            <div>Source</div>
            <div>Last Run</div>
            <div>Status</div>
            <div />
          </div>

          {loading ? (
            <div style={{ padding: 28, color: "var(--text-muted)", fontSize: 14 }}>Loading...</div>
          ) : error ? (
            <div style={{ padding: 28, color: "#ef4444", fontSize: 14 }}>{error}</div>
          ) : skills.length === 0 ? (
            <div style={{ padding: "42px 28px", color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>
              No automation skills yet. Create a blank workspace to get started.
            </div>
          ) : (
            skills.map((skill) => (
              <div
                key={skill.filePath}
                style={{ display: "grid", gridTemplateColumns: "minmax(240px, 1.4fr) minmax(150px, 0.75fr) minmax(130px, 0.65fr) minmax(110px, 0.5fr) 86px", gap: 16, alignItems: "center", padding: "20px 22px", borderBottom: "1px solid var(--border)" }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{skill.name}</div>
                  <div style={{ marginTop: 5, fontSize: 13, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{skill.description}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 14 }}>
                  <SourceIcon />
                  {skill.source === "manual" ? "Manual" : "Unknown"}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 14 }}>{skill.lastRun}</div>
                <div><StatusPill status={skill.status} /></div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                  <button
                    onClick={() => setEditingSkill(skill)}
                    title="Edit automation"
                    style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg)", color: "var(--text-muted)", cursor: "pointer", padding: 0 }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(skill)}
                    disabled={deletingPath === skill.filePath}
                    title="Delete automation"
                    style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg)", color: deletingPath === skill.filePath ? "var(--text-dim)" : "#ef4444", cursor: deletingPath === skill.filePath ? "wait" : "pointer", padding: 0, opacity: deletingPath === skill.filePath ? 0.55 : 1 }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
