"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  PageShell,
  Topbar,
  Card,
  Label,
  Input,
  Select,
  Button,
  StatRow,
  UI,
} from "@/app/_ui/ui";
import { BotaoBaixarPDF } from "@/app/components/OrcamentoPDF";

type Client = { id: string; name: string };

type Product = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  price: number;
};

type Quote = {
  id: string;
  client_id: string;
  status: string;
  quote_date: string | null;
  total: number;
  order_number: number;
  created_at: string;
};

type QuoteItem = {
  id: string;
  quote_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number | null;
  created_at: string;
  // ✅ supabase costuma retornar relacionamento como array
  products?: { name: string; category: string | null }[] | null;
};

function brl(v: number) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// aceita: 12,50 | 12.50 | R$ 12,50
function parseBRL(input: string) {
  const cleaned = input.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

function formatDateBR(iso: string | null | undefined) {
  if (!iso) return "";
  // iso: yyyy-mm-dd
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

export default function QuoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const quoteId = String(params?.id ?? "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);

  // form cabeçalho
  const [clientId, setClientId] = useState("");
  const [status, setStatus] = useState("Orçamento");
  const [quoteDate, setQuoteDate] = useState(""); // yyyy-mm-dd

  // form item
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [unitPriceText, setUnitPriceText] = useState("");

  async function checarLogin() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) router.push("/login");
  }

  async function carregarTudo() {
    if (!quoteId) return;

    setLoading(true);

    // 1) quote
    const qRes = await supabase.from("quotes").select("*").eq("id", quoteId).single();
    if (qRes.error) {
      setLoading(false);
      alert("Erro ao carregar orçamento: " + qRes.error.message);
      return;
    }

    const q = qRes.data as Quote;
    setQuote(q);
    setClientId(q.client_id);
    setStatus(q.status ?? "Orçamento");
    setQuoteDate(q.quote_date ?? "");

    // 2) demais dados em paralelo
    const [cRes, pRes, iRes] = await Promise.all([
      supabase.from("clients").select("id,name").order("name"),
      supabase.from("products").select("id,name,category,description,price").order("name"),
      supabase
        .from("quote_items")
        .select("id,quote_id,product_id,quantity,unit_price,subtotal,created_at, products(name,category)")
        .eq("quote_id", quoteId)
        .order("created_at", { ascending: true }),
    ]);

    setLoading(false);

    if (cRes.error) return alert("Erro ao carregar clientes: " + cRes.error.message);
    if (pRes.error) return alert("Erro ao carregar produtos: " + pRes.error.message);
    if (iRes.error) return alert("Erro ao carregar itens: " + iRes.error.message);

    setClients((cRes.data as Client[]) ?? []);
    setProducts((pRes.data as Product[]) ?? []);
    setItems((iRes.data as QuoteItem[]) ?? []); // ✅ agora bate com o tipo
  }

  useEffect(() => {
    checarLogin();
    if (quoteId) carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId]);

  const totalCalculado = useMemo(() => {
    return items.reduce((acc, it) => {
      const sub = Number(it.subtotal ?? Number(it.quantity) * Number(it.unit_price) ?? 0);
      return acc + (Number.isFinite(sub) ? sub : 0);
    }, 0);
  }, [items]);

  const nomeCliente = useMemo(() => {
    const c = clients.find((x) => x.id === clientId);
    return c?.name ?? "Cliente";
  }, [clients, clientId]);

  function preencherPrecoAutomatico(prodId: string) {
    const p = products.find((x) => x.id === prodId);
    if (!p) return;
    setUnitPriceText(String(p.price ?? 0).replace(".", ","));
  }

  async function adicionarItem() {
    if (adding) return;

    if (!productId) return alert("Selecione um produto.");

    const q = Number(qty);
    if (!Number.isFinite(q) || q <= 0) return alert("Quantidade inválida.");

    const unitPrice = parseBRL(unitPriceText);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return alert("Preço unitário inválido. Ex: 199,90");
    }

    setAdding(true);

    // subtotal é GENERATED no banco -> NÃO enviar subtotal
    const { error } = await supabase.from("quote_items").insert([
      { quote_id: quoteId, product_id: productId, quantity: q, unit_price: unitPrice },
    ]);

    setAdding(false);

    if (error) return alert("Erro ao adicionar item: " + error.message);

    setProductId("");
    setQty(1);
    setUnitPriceText("");
    await carregarTudo();
  }

  async function removerItem(itemId: string) {
    const ok = confirm("Deseja remover este item?");
    if (!ok) return;

    const { error } = await supabase.from("quote_items").delete().eq("id", itemId);
    if (error) return alert("Erro ao remover item: " + error.message);

    await carregarTudo();
  }

  async function salvarOrcamento() {
    if (!quote) return;
    if (!clientId) return alert("Selecione um cliente.");

    setSaving(true);

    const { error } = await supabase
      .from("quotes")
      .update({
        client_id: clientId,
        status,
        quote_date: quoteDate || null,
        total: totalCalculado,
      })
      .eq("id", quote.id);

    setSaving(false);

    if (error) return alert("Erro ao salvar orçamento: " + error.message);

    alert("Orçamento salvo com sucesso!");
    await carregarTudo();
  }

  // ✅ montar objeto no formato do PDF
  const dadosPDF = useMemo(() => {
    const numero = String(quote?.order_number ?? quoteId ?? "0000");
    const dataBR = quoteDate ? formatDateBR(quoteDate) : new Date().toLocaleDateString("pt-BR");

    const itens = items.map((it) => {
      const nome = it.products?.[0]?.name ?? "Produto";
      const qtd = Number(it.quantity ?? 0);
      const precoUnit = Number(it.unit_price ?? 0);
      const total = Number(it.subtotal ?? qtd * precoUnit ?? 0);
      return { nome, qtd, precoUnit, total };
    });

    return {
      numero,
      cliente: nomeCliente,
      status: status ?? "Orçamento",
      data: dataBR,
      itens,
      total: totalCalculado,
    };
  }, [quote?.order_number, quoteId, quoteDate, items, nomeCliente, status, totalCalculado]);

  return (
    <PageShell>
      <Topbar
        title={`Orçamento #${quote?.order_number ?? "..."}`}
        subtitle={
          <>
            Cliente: <b>{nomeCliente}</b> • Total: <b>{brl(totalCalculado)}</b>
          </>
        }
        right={
          <>
            <Button variant="ghost" type="button" onClick={() => router.push("/orcamentos")}>
              Voltar
            </Button>

            {/* ✅ PDF */}
            <BotaoBaixarPDF orcamento={dadosPDF} />

            <Button type="button" onClick={salvarOrcamento} disabled={saving || loading}>
              {saving ? "Salvando..." : "Salvar orçamento"}
            </Button>
          </>
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
        {/* CABEÇALHO */}
        <Card kicker="Dados do orçamento" title="Cabeçalho">
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <Label>Cliente</Label>
              <Select value={clientId} onChange={(e) => setClientId(e.target.value)} disabled={loading}>
                <option value="">Selecione...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
              <div>
                <Label>Status</Label>
                <Select value={status} onChange={(e) => setStatus(e.target.value)} disabled={loading}>
                  <option value="Orçamento">Orçamento</option>
                  <option value="Análise">Análise</option>
                  <option value="Produção">Produção</option>
                  <option value="Montagem">Montagem</option>
                  <option value="Entregue">Entregue</option>
                </Select>
              </div>

              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={quoteDate}
                  onChange={(e) => setQuoteDate(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <StatRow label="Total" value={brl(totalCalculado)} />
          </div>
        </Card>

        {/* ITENS */}
        <Card
          kicker="Itens"
          title="Produtos do orçamento"
          right={<div style={{ fontSize: 13, color: UI.muted }}>{items.length} item(ns)</div>}
        >
          <div style={{ display: "grid", gap: 12 }}>
            {/* FORM ADD */}
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "1fr 140px 200px 230px",
                alignItems: "end",
              }}
            >
              <div>
                <Label>Produto</Label>
                <Select
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    preencherPrecoAutomatico(e.target.value);
                  }}
                  disabled={loading || adding}
                >
                  <option value="">Selecione...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label>Qtd</Label>
                <Input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  disabled={loading || adding}
                />
              </div>

              <div>
                <Label>Preço unit.</Label>
                <Input
                  placeholder="Ex: 199,90"
                  value={unitPriceText}
                  onChange={(e) => setUnitPriceText(e.target.value)}
                  disabled={loading || adding}
                />
              </div>

              <Button type="button" onClick={adicionarItem} disabled={loading || adding}>
                {adding ? "Adicionando..." : "Adicionar item"}
              </Button>
            </div>

            {/* LISTA */}
            <div style={{ border: `1px solid ${UI.line}`, borderRadius: 14, overflow: "hidden" }}>
              {loading && <div style={{ padding: 12, opacity: 0.7 }}>Carregando...</div>}

              {!loading && items.length === 0 && (
                <div style={{ padding: 12, opacity: 0.7 }}>Nenhum item adicionado ainda.</div>
              )}

              {!loading &&
                items.map((it) => {
                  const subtotal = Number(it.subtotal ?? Number(it.quantity) * Number(it.unit_price) ?? 0);
                  const nome = it.products?.[0]?.name ?? "Produto";
                  const categoria = it.products?.[0]?.category ?? null;

                  return (
                    <div
                      key={it.id}
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
                          {nome}
                        </div>

                        <div style={{ fontSize: 12.5, color: UI.muted, marginTop: 6 }}>
                          Qtd: <b style={{ color: UI.text }}>{it.quantity}</b> • Unit:{" "}
                          <b style={{ color: UI.text }}>{brl(Number(it.unit_price ?? 0))}</b>
                          {categoria ? (
                            <>
                              {" "}
                              • <span style={{ opacity: 0.8 }}>{categoria}</span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div
                          style={{
                            fontWeight: 950,
                            color: UI.text,
                            background: "rgba(196,22,32,.08)",
                            border: "1px solid rgba(196,22,32,.18)",
                            padding: "10px 12px",
                            borderRadius: 12,
                            minWidth: 118,
                            textAlign: "right",
                          }}
                        >
                          {brl(subtotal)}
                        </div>

                        <Button
                          type="button"
                          variant="dangerOutline"
                          onClick={() => removerItem(it.id)}
                          style={{ height: 40, minWidth: 100 }}
                          disabled={loading || adding || saving}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* RODAPÉ TOTAL */}
            <div
              style={{
                marginTop: 8,
                paddingTop: 12,
                borderTop: `1px solid ${UI.line}`,
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 900,
                color: UI.text,
                alignItems: "center",
              }}
            >
              <span style={{ color: UI.muted, fontWeight: 800 }}>Total do orçamento</span>
              <span style={{ fontSize: 20 }}>{brl(totalCalculado)}</span>
            </div>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
