"use client";

import { useState } from "react";

function ExecuteButton() {
  const [running, setRunning] = useState(false);

  function execute() {
    if (running) return;
    setRunning(true);
    setTimeout(() => setRunning(false), 900);
  }

  return (
    <button
      onClick={execute}
      disabled={running}
      style={{
        height: 30,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "0 12px",
        border: "none",
        borderRadius: 6,
        background: running ? "var(--bg-hover)" : "var(--text)",
        color: running ? "var(--text-dim)" : "var(--bg)",
        cursor: running ? "wait" : "pointer",
        fontSize: 12,
        fontWeight: 650,
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M8 5v14l11-7z" />
      </svg>
      {running ? "Executing..." : "Execute"}
    </button>
  );
}

export function AutomationSkillMode() {
  return (
    <div style={{ height: "100%", minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg)" }}>
      <div style={{ flex: 1, overflowY: "auto", paddingTop: 16 }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 16px 24px" }}>
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 0 22px" }}>
            <div style={{ maxWidth: 560, padding: "9px 12px", borderRadius: 10, background: "var(--user-bg)", color: "var(--text)", fontSize: 13, lineHeight: 1.5 }}>
              Please refine this skill with the next workflow step.
            </div>
          </div>

          <div style={{ padding: "8px 0", color: "var(--text)", fontSize: 13, lineHeight: 1.65 }}>
            <div style={{ marginBottom: 12 }}>
              I updated the automation skill.
            </div>
            <div style={{ marginBottom: 8, fontWeight: 650 }}>Modified files:</div>
            <div style={{ marginBottom: 14, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              <div>- skill.md</div>
              <div>- references/locator-notes.md</div>
            </div>
            <div style={{ marginBottom: 8, fontWeight: 650 }}>Summary:</div>
            <div style={{ color: "var(--text-muted)", marginBottom: 14 }}>
              <div>- Added a new workflow step</div>
              <div>- Added recovery notes for failed actions</div>
              <div>- Updated run output description</div>
            </div>
            <ExecuteButton />
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "12px 16px" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="Message..."
              style={{
                flex: 1,
                height: 36,
                border: "1px solid var(--border)",
                borderRadius: 8,
                background: "var(--bg)",
                color: "var(--text)",
                padding: "0 12px",
                fontSize: 13,
                outline: "none",
              }}
            />
            <button
              disabled
              style={{
                height: 36,
                padding: "0 14px",
                border: "none",
                borderRadius: 8,
                background: "var(--bg-hover)",
                color: "var(--text-dim)",
                cursor: "not-allowed",
                fontSize: 13,
                fontWeight: 650,
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
