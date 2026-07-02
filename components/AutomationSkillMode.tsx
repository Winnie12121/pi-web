"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ui } from "./uiStyles";

const SKILL_NAME = "offer-workflow-skill";

const SKILL_MARKDOWN = `# Offer Workflow Skill

## Goal
Automate the end-to-end process of creating and sending an offer email to a candidate from an approved requisition.

## Inputs
- candidate_name: string
- requisition_id: string
- offer_template: string, optional

## Preconditions
- User is logged into Outlook
- Candidate profile link is accessible
- Offer template is available
- Excel tracker is available

## Steps
1. Open Outlook.
2. Find unread emails related to candidate offers.
3. Open each candidate link.
4. Extract candidate details.
5. Validate offer amount and requisition ID.
6. Attach offer letter PDF.
7. Review email draft.
8. Send email.
9. Update Excel tracker.

## Recovery
If a locator fails, try semantic fallback.
If the fallback succeeds, update the skill notes or references.
If an action fails repeatedly, pause the run and ask for user confirmation.

## Output
- email_id
- candidate_name
- status
- run_log`;

const TRACE_STEPS = [
  "Loaded skill.md",
  "Loaded references",
  "Started browser session",
  "Opened Outlook",
  "Found unread offer emails",
  "Opened candidate profile link",
  "Extracted candidate details",
  "Validated offer amount",
  "Attached offer letter PDF",
  "Updated Excel tracker",
  "Completed run",
];

function StatusBadge({ status }: { status: "ready" | "running" | "completed" }) {
  const label = status === "running" ? "Running" : status === "completed" ? "Completed" : "Ready";
  const color = status === "running" ? "var(--accent)" : status === "completed" ? "#10b981" : "var(--text)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 22, padding: "0 9px", border: "1px solid var(--border)", borderRadius: 11, background: "var(--bg-hover)", color, fontSize: ui.font.meta, fontWeight: ui.weight.strong }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

function SkillWorkspaceHeader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "16px 22px", borderBottom: "1px solid var(--border)", background: "var(--bg)" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--text-muted)", fontSize: ui.font.body, marginBottom: 8 }}>
          <span>Automation</span>
          <span style={{ color: "var(--text-dim)" }}>/</span>
          <span style={{ color: "var(--text)" }}>{SKILL_NAME}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: ui.font.pageTitle, lineHeight: 1.25, color: "var(--text)", fontWeight: ui.weight.bold, overflowWrap: "anywhere" }}>
            {SKILL_NAME}
          </h1>
          <button
            title="Edit skill metadata"
            style={{ height: ui.control.inputHeight, display: "inline-flex", alignItems: "center", gap: 7, padding: "0 13px", borderRadius: ui.radius.button, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-muted)", fontSize: ui.font.body, fontWeight: ui.weight.semibold, cursor: "pointer" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            Edit
          </button>
        </div>
      </div>
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 2, padding: "8px 14px", borderRadius: ui.radius.panel, background: "rgba(16,185,129,0.10)", color: "#059669", fontSize: ui.font.label, fontWeight: ui.weight.semibold }}>
        <span>Synced to</span>
        <code style={{ fontFamily: "var(--font-mono)", color: "#047857" }}>~/.pi/skills</code>
      </div>
    </div>
  );
}

function SkillTabs({ activeTab, onSelect }: { activeTab: "chat" | "skill"; onSelect: (tab: "chat" | "skill") => void }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", height: 38, borderBottom: "1px solid var(--border)", background: "var(--bg-panel)", paddingLeft: 22 }}>
      {([
        ["chat", "Chat"],
        ["skill", "skill.md"],
      ] as const).map(([id, label]) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            style={{ height: 38, padding: "0 16px", border: "none", borderBottom: active ? "2px solid var(--text)" : "2px solid transparent", background: "none", color: active ? "var(--text)" : "var(--text-muted)", cursor: "pointer", fontSize: ui.font.body, fontWeight: active ? ui.weight.bold : ui.weight.semibold }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function SkillMarkdownView() {
  const lines = useMemo(() => SKILL_MARKDOWN.split("\n"), []);
  return (
    <div style={{ height: "100%", overflow: "auto", background: "var(--bg)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "52px minmax(0, 1fr)", minHeight: "100%", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.75 }}>
        <div style={{ padding: "8px 10px", borderRight: "1px solid var(--border)", color: "var(--text-dim)", textAlign: "right", userSelect: "none", background: "var(--bg-panel)" }}>
          {lines.map((_, index) => <div key={index}>{index + 1}</div>)}
        </div>
        <pre style={{ margin: 0, padding: "8px 18px 40px", color: "var(--text)", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          {SKILL_MARKDOWN}
        </pre>
      </div>
    </div>
  );
}

function SkillChatView() {
  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "22px", background: "var(--bg)", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ alignSelf: "flex-end", maxWidth: 520, padding: "10px 12px", borderRadius: ui.radius.panel, background: "var(--user-bg)", color: "var(--text)", fontSize: ui.font.body, lineHeight: 1.5 }}>
        Please refine this skill to add offer amount validation.
      </div>
      <div style={{ maxWidth: 620, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ color: "var(--text)", fontSize: ui.font.body, lineHeight: 1.55 }}>
          I&apos;ll update the skill.md steps and add a recovery note for failed validation.
        </div>
        <div style={{ border: "1px solid var(--border)", borderRadius: ui.radius.panel, background: "var(--bg-panel)", overflow: "hidden" }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", color: "var(--text)", fontSize: ui.font.body, fontWeight: ui.weight.semibold }}>
            Proposed changes
          </div>
          <div style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: ui.font.label, lineHeight: 1.7 }}>
            <div style={{ color: "var(--text)", marginBottom: 4 }}>Updated files:</div>
            <div style={{ fontFamily: "var(--font-mono)" }}>- skill.md</div>
            <div style={{ fontFamily: "var(--font-mono)" }}>- references/locator-notes.md</div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "10px 12px", borderTop: "1px solid var(--border)" }}>
            <button style={{ height: ui.control.dialogButtonHeight, padding: "0 13px", borderRadius: ui.radius.control, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text-muted)", fontSize: ui.font.label, cursor: "pointer" }}>Reject</button>
            <button style={{ height: ui.control.dialogButtonHeight, padding: "0 14px", borderRadius: ui.radius.control, border: "none", background: "var(--text)", color: "var(--bg)", fontSize: ui.font.label, fontWeight: ui.weight.semibold, cursor: "pointer" }}>Apply Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RunConsole() {
  const [status, setStatus] = useState<"ready" | "running" | "completed">("ready");
  const [visibleSteps, setVisibleSteps] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
  }, []);

  function execute() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setStatus("running");
    setVisibleSteps(0);
    TRACE_STEPS.forEach((_, index) => {
      const timer = setTimeout(() => {
        setVisibleSteps(index + 1);
        if (index === TRACE_STEPS.length - 1) setStatus("completed");
      }, 180 * (index + 1));
      timersRef.current.push(timer);
    });
  }

  const hasOutput = status === "completed";

  return (
    <aside style={{ width: 340, flexShrink: 0, borderLeft: "1px solid var(--border)", background: "var(--bg-panel)", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "0 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontSize: ui.font.title, fontWeight: ui.weight.bold, color: "var(--text)" }}>Run Console</div>
        <StatusBadge status={status} />
      </div>
      <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
        <button
          onClick={execute}
          disabled={status === "running"}
          style={{ width: "100%", height: 38, borderRadius: ui.radius.button, border: "none", background: status === "running" ? "var(--bg-hover)" : "var(--text)", color: status === "running" ? "var(--text-dim)" : "var(--bg)", cursor: status === "running" ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: ui.font.body, fontWeight: ui.weight.bold }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          {status === "completed" ? "Execute Again" : status === "running" ? "Running..." : "Execute"}
        </button>
      </div>
      <div style={{ padding: 16, borderBottom: "1px solid var(--border)", minHeight: 250 }}>
        <div style={{ color: "var(--text-muted)", fontSize: ui.font.label, fontWeight: ui.weight.bold, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 12 }}>
          Trace
        </div>
        {visibleSteps === 0 ? (
          <div style={{ color: "var(--text-dim)", fontSize: ui.font.body, textAlign: "center", paddingTop: 42 }}>
            No trace yet. Press Execute to start.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {TRACE_STEPS.slice(0, visibleSteps).map((step, index) => {
              const isActive = status === "running" && index === visibleSteps - 1;
              return (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: 8, color: isActive ? "var(--accent)" : "var(--text-muted)", fontSize: ui.font.label }}>
                  {isActive ? (
                    <span style={{ width: 14, height: 14, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", flexShrink: 0 }} />
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  <span>{step}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ color: "var(--text-muted)", fontSize: ui.font.label, fontWeight: ui.weight.bold, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 12 }}>
          Output
        </div>
        {!hasOutput ? (
          <div style={{ color: "var(--text-dim)", fontSize: ui.font.body }}>No output yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {["result.json", "output.xlsx", "run-log.md"].map((file) => (
              <div key={file} style={{ height: 34, display: "flex", alignItems: "center", gap: 9, padding: "0 10px", border: "1px solid var(--border)", borderRadius: ui.radius.control, background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: ui.font.label }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                  <path d="M14 2v6h6" />
                </svg>
                {file}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

export function AutomationSkillMode() {
  const [activeTab, setActiveTab] = useState<"chat" | "skill">("skill");

  return (
    <div style={{ height: "100%", minWidth: 0, display: "flex", overflow: "hidden", background: "var(--bg)" }}>
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <SkillWorkspaceHeader />
        <SkillTabs activeTab={activeTab} onSelect={setActiveTab} />
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {activeTab === "skill" ? <SkillMarkdownView /> : <SkillChatView />}
        </div>
      </main>
      <RunConsole />
    </div>
  );
}
