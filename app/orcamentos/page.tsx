"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { PageShell, Topbar, Card, Label, Select, Input, Button, UI } from "@/app/_ui/ui";

type Client = { id: string; name: string };

type Quote = {
  id: string;
  client_id: string;
  status: string;
  total: number;
  quote_date: string | null;
  created_at: string;
  order_number: number;
  clients?: { name: string }[] | null; // ✅ supabase pode vir como array
};

function brl(v: number) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateBR(iso: string | null) {
  if (!iso) return "";
  // se vier como yyyy-mm-dd (date)
  if (iso.includes("-")) {
    const [y, m, d] = iso.split("-");
    if (y && m && d) return `${d}/${m}/${y}`;
  }
  // fallback
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}

export default function OrcamentosPage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
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

    if (cRes.error) return alert("Erro ao carregar clientes: " + cRes.error.message);
    if (qRes.error) return alert("Erro ao carregar orçamentos: " + qRes.error.message);

    setClients((cRes.data as Client[]) ?? []);
    setQuotes(((qRes.data ?? []) as unknown as Quote[])); // ✅ evita briga do TS
  }

  async function criarOrcamento(e: React.FormEvent) {
    e.preventDefault();

    if (!clientId) return alert("Selecione um cliente.");

    setCreating(true);

    const { data, error } = await supabase
      .from("quotes")
      .insert([{ client_id: clientId, status }])
      .select("id")
      .single();

    setCreating(false);

    if (error) return alert("Erro ao criar orçamento: " + error.message);

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
      const cli = (o.clients?.[0]?.name ?? "").toLowerCase();
      const st = (o.status ?? "").toLowerCase();
      return num.includes(q) || cli.includes(q) || st.includes(q);
    });
  }, [busca, quotes]);

  return (
    <PageShell>
      <Topbar
        title="Orçamentos"
        subtitle="Criar, listar e abrir orçamentos"
        right={
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.75)" }}>
            {filtrados.length} orçamento(s)
          </div>
        }
      />

      <div style={{ marginTop: 14, display: "grid", gap: 14 }}>
        <Card kicker="Gerar orçamento" title="Criar novo">
          <form
            onSubmit={criarOrcamento}
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "1fr 260px 220px",
              alignItems: "end",
            }}
          >
            <div>
              <Label>Cliente</Label>
              <Select value={clientId} onChange={(e) => setClientId(e.target.value)} disabled={creating}>
                <option value="">Selecione...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={status} onChange={(e) => setStatus(e.target.value)} disabled={creating}>
                <option value="Orçamento">Orçamento</option>
                <option value="Análise">Análise</option>
                <option value="Produção">Produção</option>
                <option value="Montagem">Montagem</option>
                <option value="Entregue">Entregue</option>
              </Select>
            </div>

            <Button type="submit" disabled={creating}>
              {creating ? "Criando..." : "Criar orçamento"}
            </Button>
          </form>

          <div style={{ marginTop: 12 }}>
            <Label>Buscar</Label>
            <Input
              placeholder="Buscar por número, cliente ou status..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </Card>

        <Card
          kicker="Lista"
          title="Orçamentos recentes"
          right={<div style={{ fontSize: 13, color: UI.muted }}>{loading ? "Carregando..." : ""}</div>}
        >
          <div style={{ border: `1px solid ${UI.line}`, borderRadius: 14, overflow: "hidden" }}>
            {loading && <div style={{ padding: 12, opacity: 0.7 }}>Carregando...</div>}

            {!loading &&
              filtrados.map((o, idx) => {
                const cliente = o.clients?.[0]?.name ?? "Cliente";
                const data = o.quote_date ? formatDateBR(o.quote_date) : "";
                return (
                  <Link
                    key={o.id}
                    href={`/orcamentos/${o.id}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: 14,
                      borderTop: idx === 0 ? "none" : "1px solid #f0f0f4",
                      background: "linear-gradient(180deg, #ffffff 0%, #fbfbfd 100%)",
                      textDecoration: "none",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 950, color: UI.text, fontSize: 16, lineHeight: 1.2 }}>
                        Orçamento #{o.order_number} — {cliente}
                      </div>
                      <div style={{ fontSize: 12.5, color: UI.muted, marginTop: 6 }}>
                        Status: <b style={{ color: UI.text }}>{o.status}</b>
                        {data ? ` • Data: ${data}` : ""}
                      </div>
                    </div>

                    <div style={{ fontWeight: 950, color: UI.text, whiteSpace: "nowrap" }}>
                      {brl(o.total ?? 0)}
                    </div>
                  </Link>
                );
              })}

            {!loading && filtrados.length === 0 && (
              <div style={{ padding: 12, opacity: 0.7 }}>Nenhum orçamento encontrado.</div>
            )}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
