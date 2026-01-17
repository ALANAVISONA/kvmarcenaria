"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Client = { id: string; name: string };

type Quote = {
  id: string;
  client_id: string;
  status: string;
  total: number;
  quote_date: string | null;
  created_at: string;
  order_number: number;
  clients?: { name: string } | null;
};

function brl(v: number) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function OrcamentosPage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [clientId, setClientId] = useState("");
  const [status, setStatus] = useState("Orçamento");
  const [busca, setBusca] = useState("");

  async function checarLogin() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) router.push("/login");
  }

  async function carregar() {
    setLoading(true);

    const [cRes, qRes] = await Promise.all([
      supabase.from("clients").select("id,name").order("name", { ascending: true }),
      supabase
        .from("quotes")
        .select("id,client_id,status,total,quote_date,created_at,order_number, clients(name)")
        .order("created_at", { ascending: false }),
    ]);

    setLoading(false);

    if (cRes.error) return alert("Erro ao carregar clients: " + cRes.error.message);
    if (qRes.error) return alert("Erro ao carregar quotes: " + qRes.error.message);

    setClients((cRes.data as Client[]) ?? []);
    setQuotes((qRes.data as Quote[]) ?? []);
  }

  async function criarOrcamento(e: React.FormEvent) {
    e.preventDefault();

    if (!clientId) {
      alert("Selecione um cliente.");
      return;
    }

    setCreating(true);

    const { data, error } = await supabase
      .from("quotes")
      .insert([{ client_id: clientId, status }])
      .select("id")
      .single();

    setCreating(false);

    if (error) {
      alert("Erro ao criar orçamento: " + error.message);
      return;
    }

    // se você ainda não criou a tela /orcamentos/[id], comente a linha abaixo:
    router.push(`/orcamentos/${data.id}`);
  }

  useEffect(() => {
    checarLogin();
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return quotes;

    return quotes.filter((o) => {
      const num = String(o.order_number ?? "");
      const cli = (o.clients?.name ?? "").toLowerCase();
      const st = (o.status ?? "").toLowerCase();
      return num.includes(q) || cli.includes(q) || st.includes(q);
    });
  }, [busca, quotes]);

  return (
    <div style={{ maxWidth: 1500, margin: "18px auto", padding: 16 }}>
      <div
        style={{
          borderRadius: 16,
          background: "#fff",
          border: "1px solid #e9e9ee",
          boxShadow: "0 12px 30px rgba(0,0,0,.25)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: 16,
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 14, color: "#6b7280" }}>Gerar orçamento</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#111827" }}>Orçamentos</div>
          </div>

          <div style={{ fontSize: 13, color: "#6b7280" }}>{filtrados.length} orçamento(s)</div>
        </div>

        <div style={{ padding: 16, display: "grid", gap: 12 }}>
          <form
            onSubmit={criarOrcamento}
            style={{
              display: "grid",
              gap: 10,
              gridTemplateColumns: "1fr 260px 220px",
              alignItems: "end",
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>Cliente</div>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                style={{
                  width: "100%",
                  padding: 12,
                  border: "1px solid #d9d9df",
                  borderRadius: 12,
                }}
              >
                <option value="">Selecione...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>Status</div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: "100%",
                  padding: 12,
                  border: "1px solid #d9d9df",
                  borderRadius: 12,
                }}
              >
                <option value="Orçamento">Orçamento</option>
                <option value="Análise">Análise</option>
                <option value="Produção">Produção</option>
                <option value="Montagem">Montagem</option>
                <option value="Entregue">Entregue</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={creating}
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid #8b0f18",
                cursor: creating ? "not-allowed" : "pointer",
                background: "#c41620",
                color: "#fff",
                fontWeight: 900,
                opacity: creating ? 0.7 : 1,
              }}
            >
              {creating ? "Criando..." : "Criar orçamento"}
            </button>
          </form>

          <div style={{ marginTop: 6 }}>
            <input
              placeholder="Buscar por número, cliente ou status..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                border: "1px solid #d9d9df",
                borderRadius: 12,
              }}
            />
          </div>

          <div style={{ border: "1px solid #eee", borderRadius: 14, overflow: "hidden" }}>
            {loading && <div style={{ padding: 12, opacity: 0.7 }}>Carregando...</div>}

            {!loading &&
              filtrados.map((o) => (
                <Link
                  key={o.id}
                  href={`/orcamentos/${o.id}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: 12,
                    borderTop: "1px solid #f0f0f4",
                    background: "#fff",
                    textDecoration: "none",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 900, color: "#111827" }}>
                      Orçamento #{o.order_number} — {o.clients?.name ?? "Cliente"}
                    </div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                      Status: {o.status}
                      {o.quote_date
                        ? ` • Data: ${new Date(o.quote_date).toLocaleDateString("pt-BR")}`
                        : ""}
                    </div>
                  </div>

                  <div style={{ fontWeight: 900, color: "#111827" }}>{brl(o.total ?? 0)}</div>
                </Link>
              ))}

            {!loading && filtrados.length === 0 && (
              <div style={{ padding: 12, opacity: 0.7 }}>Nenhum orçamento encontrado.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
