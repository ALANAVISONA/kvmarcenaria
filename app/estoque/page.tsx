"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { PageShell, Topbar, Card, Label, Input, Select, Button, UI } from "@/app/_ui/ui";

type StockRow = {
  product_id: string;
  name: string;
  category: string | null;
  balance: number; // numeric do postgres vem como number/string dependendo config; vamos normalizar
};

type MoveType = "IN" | "OUT" | "ADJUST";

type StockMoveRow = {
  id: string;
  product_id: string;
  move_type: MoveType;
  quantity: number;
  reason: string | null;
  created_at: string;
  products?: { name: string } | null;
};

function brl(v: number) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// numeric pode vir string -> normaliza
function toNumber(v: any) {
  const n = typeof v === "string" ? Number(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function EstoquePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [rows, setRows] = useState<StockRow[]>([]);
  const [moves, setMoves] = useState<StockMoveRow[]>([]);

  // filtros
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string>("");

  // form movimento
  const [productId, setProductId] = useState("");
  const [moveType, setMoveType] = useState<MoveType>("IN");
  const [qty, setQty] = useState<number>(1);
  const [reason, setReason] = useState("");

  async function checarLogin() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) router.push("/login");
  }

  async function carregar() {
    setLoading(true);

    // saldo (view)
    const saldoRes = await supabase
      .from("stock_balance_full")
      .select("product_id,name,category,balance")
      .order("name", { ascending: true });

    if (saldoRes.error) {
      setLoading(false);
      alert("Erro saldo: " + saldoRes.error.message);
      return;
    }

    // histórico (tabela)
    const movRes = await supabase
      .from("stock_moves")
      .select("id,product_id,move_type,quantity,reason,created_at, products(name)")
      .order("created_at", { ascending: false })
      .limit(40);

    setLoading(false);

    if (movRes.error) {
      alert("Erro movimentos: " + movRes.error.message);
      return;
    }

    setRows(
      ((saldoRes.data ?? []) as any[]).map((r) => ({
        product_id: String(r.product_id),
        name: String(r.name ?? ""),
        category: r.category ?? null,
        balance: toNumber(r.balance),
      }))
    );

    setMoves(
      ((movRes.data ?? []) as any[]).map((m) => ({
        id: String(m.id),
        product_id: String(m.product_id),
        move_type: m.move_type as MoveType,
        quantity: toNumber(m.quantity),
        reason: m.reason ?? null,
        created_at: String(m.created_at),
        products: m.products ?? null,
      }))
    );
  }

  useEffect(() => {
    checarLogin();
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categorias = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.category && set.add(r.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [rows]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();

    return rows.filter((r) => {
      const okCat = !categoria || (r.category ?? "") === categoria;
      if (!okCat) return false;

      if (!q) return true;

      const nome = (r.name ?? "").toLowerCase();
      const cat = (r.category ?? "").toLowerCase();
      return nome.includes(q) || cat.includes(q);
    });
  }, [rows, busca, categoria]);

  const produtoSelecionado = useMemo(() => {
    return rows.find((r) => r.product_id === productId) ?? null;
  }, [rows, productId]);

  async function registrarMovimento() {
    if (!productId) return alert("Selecione um produto.");
    if (!Number.isFinite(qty) || qty <= 0) return alert("Quantidade inválida.");

    // regra: não deixar sair mais do que tem (para OUT)
    if (moveType === "OUT") {
      const saldoAtual = produtoSelecionado?.balance ?? 0;
      if (qty > saldoAtual) {
        return alert(`Saída maior que o saldo atual. Saldo: ${saldoAtual}`);
      }
    }

    setSaving(true);

    const { error } = await supabase.from("stock_moves").insert([
      {
        product_id: productId,
        move_type: moveType,
        quantity: qty,
        reason: reason.trim() || null,
      },
    ]);

    setSaving(false);

    if (error) {
      alert("Erro ao registrar: " + error.message);
      return;
    }

    // reset form
    setProductId("");
    setMoveType("IN");
    setQty(1);
    setReason("");

    await carregar();
  }

  async function excluirMovimento(id: string) {
    const ok = confirm("Deseja excluir este movimento? (Isso altera o saldo)");
    if (!ok) return;

    const { error } = await supabase.from("stock_moves").delete().eq("id", id);
    if (error) return alert("Erro ao excluir: " + error.message);

    await carregar();
  }

  const badgeMove = (t: MoveType) => {
    const label = t === "IN" ? "Entrada" : t === "OUT" ? "Saída" : "Ajuste";
    const bg =
      t === "IN"
        ? "rgba(34,197,94,.10)"
        : t === "OUT"
        ? "rgba(239,68,68,.10)"
        : "rgba(59,130,246,.10)";
    const bd =
      t === "IN"
        ? "rgba(34,197,94,.25)"
        : t === "OUT"
        ? "rgba(239,68,68,.25)"
        : "rgba(59,130,246,.25)";
    const tx =
      t === "IN" ? "#166534" : t === "OUT" ? "#7f1d1d" : "#1e3a8a";

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 999,
          border: `1px solid ${bd}`,
          background: bg,
          color: tx,
          fontWeight: 900,
          fontSize: 12,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    );
  };

  return (
    <PageShell>
      <Topbar
        title="Estoque"
        subtitle={
          <>
            Produtos com saldo e histórico de movimentações •{" "}
            <b>{filtrados.length}</b> item(ns)
          </>
        }
        right={
          <Button variant="ghost" type="button" onClick={() => router.push("/")}>
            Home
          </Button>
        }
      />

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "520px 1fr",
          gap: 14,
          alignItems: "start",
        }}
      >
        {/* MOVIMENTO */}
        <Card kicker="Movimentação" title="Entrada / Saída / Ajuste">
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <Label>Produto</Label>
              <Select value={productId} onChange={(e) => setProductId(e.target.value)} disabled={loading || saving}>
                <option value="">Selecione...</option>
                {rows.map((r) => (
                  <option key={r.product_id} value={r.product_id}>
                    {r.name} {r.category ? `(${r.category})` : ""}
                  </option>
                ))}
              </Select>
              {produtoSelecionado && (
                <div style={{ marginTop: 8, fontSize: 13, color: UI.muted }}>
                  Saldo atual:{" "}
                  <b style={{ color: UI.text }}>{produtoSelecionado.balance}</b>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
              <div>
                <Label>Tipo</Label>
                <Select value={moveType} onChange={(e) => setMoveType(e.target.value as MoveType)} disabled={loading || saving}>
                  <option value="IN">Entrada</option>
                  <option value="OUT">Saída</option>
                  <option value="ADJUST">Ajuste</option>
                </Select>
              </div>

              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  disabled={loading || saving}
                />
              </div>
            </div>

            <div>
              <Label>Motivo (opcional)</Label>
              <Input
                placeholder="Ex: Entrada inicial, compra fornecedor, quebra, acerto..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={loading || saving}
              />
            </div>

            <Button type="button" onClick={registrarMovimento} disabled={loading || saving}>
              {saving ? "Salvando..." : "Registrar movimento"}
            </Button>

            <div style={{ fontSize: 12.5, color: UI.muted, lineHeight: 1.35 }}>
              * Para <b>Saída</b>, o sistema bloqueia se a quantidade for maior que o saldo atual.
            </div>
          </div>
        </Card>

        {/* LISTA / HISTÓRICO */}
        <Card
          kicker="Visão geral"
          title="Saldo por produto"
          right={<div style={{ fontSize: 13, color: UI.muted }}>{rows.length} produtos</div>}
        >
          <div style={{ display: "grid", gap: 12 }}>
            {/* filtros */}
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 260px" }}>
              <div>
                <Label>Buscar</Label>
                <Input
                  placeholder="Buscar por nome ou categoria..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <Label>Categoria</Label>
                <Select value={categoria} onChange={(e) => setCategoria(e.target.value)} disabled={loading}>
                  <option value="">Todas</option>
                  {categorias.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* tabela simples */}
            <div style={{ border: `1px solid ${UI.line}`, borderRadius: 14, overflow: "hidden" }}>
              {loading && <div style={{ padding: 12, opacity: 0.7 }}>Carregando...</div>}

              {!loading && filtrados.length === 0 && (
                <div style={{ padding: 12, opacity: 0.7 }}>Nenhum produto encontrado.</div>
              )}

              {!loading &&
                filtrados.map((r) => (
                  <div
                    key={r.product_id}
                    style={{
                      padding: 14,
                      borderTop: `1px solid ${UI.line}`,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "center",
                      background: "linear-gradient(180deg, #ffffff 0%, #fbfbfd 100%)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900, color: UI.text, fontSize: 16, lineHeight: 1.2 }}>
                        {r.name}
                      </div>
                      <div style={{ fontSize: 12.5, color: UI.muted, marginTop: 6 }}>
                        {r.category ? r.category : "Sem categoria"}
                      </div>
                    </div>

                    <div
                      style={{
                        fontWeight: 950,
                        color: UI.text,
                        background: "rgba(196,22,32,.08)",
                        border: "1px solid rgba(196,22,32,.18)",
                        padding: "10px 12px",
                        borderRadius: 12,
                        minWidth: 110,
                        textAlign: "right",
                      }}
                    >
                      {toNumber(r.balance)}
                    </div>
                  </div>
                ))}
            </div>

            {/* histórico */}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, color: UI.muted, fontWeight: 900, marginBottom: 8 }}>
                Últimos movimentos
              </div>

              <div style={{ border: `1px solid ${UI.line}`, borderRadius: 14, overflow: "hidden" }}>
                {moves.length === 0 && (
                  <div style={{ padding: 12, opacity: 0.7 }}>Nenhum movimento registrado ainda.</div>
                )}

                {moves.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      padding: 14,
                      borderTop: `1px solid ${UI.line}`,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "center",
                      background: "#fff",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        {badgeMove(m.move_type)}
                        <div style={{ fontWeight: 900, color: UI.text }}>
                          {m.products?.name ?? "Produto"}
                        </div>
                      </div>

                      <div style={{ fontSize: 12.5, color: UI.muted, marginTop: 6 }}>
                        Qtd: <b style={{ color: UI.text }}>{toNumber(m.quantity)}</b>
                        {" • "}
                        {new Date(m.created_at).toLocaleString("pt-BR")}
                        {m.reason ? ` • ${m.reason}` : ""}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => excluirMovimento(m.id)}
                      style={{
                        border: "1px solid rgba(139,15,24,.35)",
                        padding: "8px 10px",
                        borderRadius: 12,
                        cursor: "pointer",
                        background: "#fff",
                        color: UI.danger,
                        fontWeight: 900,
                        height: 40,
                        minWidth: 92,
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ color: "#fff", opacity: 0.5, fontSize: 12, marginTop: 10 }}>
        © {new Date().getFullYear()} KV Marcenaria • Estoque
      </div>
    </PageShell>
  );
}
