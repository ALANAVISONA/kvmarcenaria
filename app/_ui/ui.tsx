"use client";

import React from "react";

export const UI = {
  // layout
  pageMax: 1500,
  radius: 16,
  radiusSm: 12,
  pad: 16,

  // colors
  bg: "linear-gradient(180deg, #0b0b0d 0%, #111114 60%, #0b0b0d 100%)",
  glass: "rgba(255,255,255,0.06)",
  glassBorder: "1px solid rgba(255,255,255,0.10)",
  border: "#e9e9ee",
  line: "#eee",
  muted: "#6b7280",
  text: "#111827",

  // brand
  danger: "#8b0f18",
  accent: "#c41620",

  // surfaces
  cardBg: "#ffffff",
  softBg: "#fafafa",

  // effects
  shadow: "0 12px 30px rgba(0,0,0,.25)",
  focusRing: "0 0 0 4px rgba(196,22,32,.10)",
  focusBorder: "rgba(196,22,32,.55)",
};

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: UI.bg, padding: 18 }}>
      <div style={{ maxWidth: UI.pageMax, margin: "18px auto", padding: UI.pad }}>
        {children}
      </div>
    </div>
  );
}

export function Topbar({
  title,
  subtitle,
  right,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: UI.pad,
        borderRadius: UI.radius,
        background: UI.glass,
        border: UI.glassBorder,
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img
          src="/logo.jpg"
          alt="Logo KV Marcenaria"
          style={{
            height: 64,
            width: 64,
            objectFit: "cover",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,.18)",
            background: "#fff",
          }}
        />

        <div>
          <div style={{ color: "rgba(255,255,255,.75)", fontSize: 13 }}>
            KV Marcenaria
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 950,
              margin: 0,
              color: "#fff",
              letterSpacing: -0.2,
            }}
          >
            {title}
          </div>

          {subtitle && (
            <div style={{ marginTop: 4, color: "rgba(255,255,255,.75)", fontSize: 13 }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {right ? (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>{right}</div>
      ) : null}
    </div>
  );
}

export function Card({
  kicker,
  title,
  right,
  children,
}: {
  kicker?: string;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: UI.radius,
        background: UI.cardBg,
        border: `1px solid ${UI.border}`,
        boxShadow: UI.shadow,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: UI.pad,
          borderBottom: `1px solid ${UI.line}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div>
          {kicker && <div style={{ fontSize: 14, color: UI.muted }}>{kicker}</div>}
          <div style={{ fontSize: 18, fontWeight: 950, color: UI.text, letterSpacing: -0.2 }}>
            {title}
          </div>
        </div>
        {right}
      </div>

      <div style={{ padding: UI.pad }}>{children}</div>
    </div>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, color: UI.muted, marginBottom: 6 }}>{children}</div>;
}

/** base style para inputs/select */
function fieldBaseStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    width: "100%",
    height: 48, // padrão (fica tudo alinhado)
    padding: "12px 12px",
    border: "1px solid #d9d9df",
    borderRadius: UI.radiusSm,
    outline: "none",
    color: UI.text,
    background: "#fff",
    transition: "box-shadow .15s, border-color .15s, transform .05s",
    ...extra,
  };
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={fieldBaseStyle(props.style)}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = UI.focusBorder;
        e.currentTarget.style.boxShadow = UI.focusRing;
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#d9d9df";
        e.currentTarget.style.boxShadow = "none";
        props.onBlur?.(e);
      }}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={fieldBaseStyle(props.style)}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = UI.focusBorder;
        e.currentTarget.style.boxShadow = UI.focusRing;
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#d9d9df";
        e.currentTarget.style.boxShadow = "none";
        props.onBlur?.(e);
      }}
    />
  );
}

export function Button({
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "dangerOutline";
}) {
  const base: React.CSSProperties = {
    height: 44,
    padding: "0 14px",
    borderRadius: UI.radiusSm,
    cursor: props.disabled ? "not-allowed" : "pointer",
    fontWeight: 950,
    letterSpacing: -0.1,
    opacity: props.disabled ? 0.7 : 1,
    transition: "transform .05s, box-shadow .15s, filter .15s, background .15s",
    userSelect: "none",
  };

  const styles: React.CSSProperties =
    variant === "primary"
      ? {
          ...base,
          border: `1px solid ${UI.danger}`,
          background: UI.accent,
          color: "#fff",
          boxShadow: "0 10px 18px rgba(196,22,32,.18)",
        }
      : variant === "ghost"
      ? {
          ...base,
          border: "1px solid rgba(255,255,255,.18)",
          background: "rgba(255,255,255,0.06)",
          color: "#fff",
        }
      : {
          ...base,
          border: `1px solid rgba(139,15,24,.35)`,
          background: "#fff",
          color: UI.danger,
        };

  return (
    <button
      {...props}
      style={{ ...styles, ...(props.style ?? {}) }}
      onMouseDown={(e) => {
        if (props.disabled) return;
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(1px)";
        props.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
        props.onMouseUp?.(e);
      }}
      onMouseEnter={(e) => {
        if (props.disabled) return;
        (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.02)";
        props.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.filter = "none";
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
        props.onMouseLeave?.(e);
      }}
    />
  );
}

export function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: UI.radiusSm,
        border: `1px solid ${UI.line}`,
        background: UI.softBg,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontWeight: 950,
        color: UI.text,
      }}
    >
      <span style={{ color: UI.text }}>{label}</span>
      <span style={{ color: UI.text }}>{value}</span>
    </div>
  );
}

/** Badge de dinheiro (subtotal/total) */
export function MoneyBadge({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontWeight: 950,
        color: UI.text,
        background: "rgba(196,22,32,.08)",
        border: "1px solid rgba(196,22,32,.18)",
        padding: "10px 12px",
        borderRadius: UI.radiusSm,
        minWidth: 110,
        textAlign: "right",
      }}
    >
      {children}
    </div>
  );
}

/** Linha padrão para listagens (clientes/produtos/itens) */
export function ListRow({
  title,
  subtitle,
  right,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: 14,
        borderTop: "1px solid #f0f0f4",
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "center",
        background: "linear-gradient(180deg, #ffffff 0%, #fbfbfd 100%)",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 950, color: UI.text, fontSize: 16, lineHeight: 1.2 }}>
          {title}
        </div>
        {subtitle ? (
          <div style={{ fontSize: 12.5, color: UI.muted, marginTop: 6 }}>{subtitle}</div>
        ) : null}
      </div>

      {right ? <div style={{ display: "flex", gap: 10, alignItems: "center" }}>{right}</div> : null}
    </div>
  );
}
