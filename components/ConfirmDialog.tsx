"use client";

import { ui } from "./uiStyles";

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: ui.modal.overlayPadding,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        style={{
          width: ui.modal.confirmWidth,
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: ui.radius.panel,
          boxShadow: ui.modal.shadow,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "18px 20px 15px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: ui.radius.icon,
                background: destructive ? "rgba(239,68,68,0.10)" : "var(--bg-hover)",
                color: destructive ? "#ef4444" : "var(--text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div id="confirm-dialog-title" style={{ fontSize: ui.font.title, fontWeight: ui.weight.bold, color: "var(--text)", lineHeight: 1.3 }}>
                {title}
              </div>
              <div style={{ marginTop: 6, fontSize: ui.font.label, color: "var(--text-muted)", lineHeight: 1.5 }}>
                {description}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
            background: "var(--bg)",
          }}
        >
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              height: ui.control.dialogButtonHeight,
              padding: "0 13px",
              border: "1px solid var(--border)",
              borderRadius: ui.radius.control,
              background: "var(--bg)",
              color: "var(--text-muted)",
              fontSize: ui.font.body,
              fontWeight: ui.weight.medium,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              height: ui.control.dialogButtonHeight,
              padding: "0 14px",
              border: "none",
              borderRadius: ui.radius.control,
              background: destructive ? "#ef4444" : "var(--text)",
              color: "#fff",
              fontSize: ui.font.body,
              fontWeight: ui.weight.strong,
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
