"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Card = {
  title: string;
  desc: string;
  href: string;
  badge?: string;
};

export default function HomePage() {
  const router = useRouter();

  async function checarLogin() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) router.push("/login");
  }

  useEffect(() => {
    checarLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards: Card[] = [
    { title: "Clientes", desc: "Cadastrar e gerenciar clientes.", href: "/clientes", badge: "OK" },
    { title: "Produtos", desc: "Cadastro de produtos e preços.", href: "/produtos", badge: "OK" },
    { title: "Estoque", desc: "Entradas, saídas e saldo.", href: "/estoque", badge: "OK" },
    { title: "Orçamentos", desc: "Gerar orçamento com itens e total.", href: "/orcamentos", badge: "OK" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #0b0b0d 0%, #111114 60%, #0b0b0d 100%)",
        padding: 18,
      }}
    >
      <div style={{ maxWidth: 1500, margin: "18px auto", padding: 16 }}>
        {/* GRID */}
        <div
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 14,
          }}
        >
          {cards.map((c) => (
            <button
              key={c.href}
              onClick={() => router.push(c.href)}
              type="button"
              style={{
                textAlign: "left",
                padding: 16,
                borderRadius: 16,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "0 12px 30px rgba(0,0,0,.22)",
                cursor: "pointer",
                color: "#fff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{c.title}</div>

                {c.badge && (
                  <div
                    style={{
                      fontSize: 12,
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,.14)",
                      background: "rgba(255,255,255,0.06)",
                      color: "#fff",
                      opacity: 0.9,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.badge}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 8, color: "rgba(255,255,255,.70)" }}>
                {c.desc}
              </div>

              <div style={{ marginTop: 14, fontWeight: 800, opacity: 0.9 }}>
                Acessar →
              </div>
            </button>
          ))}
        </div>

        <div style={{ color: "#fff", opacity: 0.5, fontSize: 12, marginTop: 12 }}>
          © {new Date().getFullYear()} KV Marcenaria • Home
        </div>
      </div>
    </div>
  );
}
