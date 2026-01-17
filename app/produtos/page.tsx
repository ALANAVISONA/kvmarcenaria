"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  PageShell,
  Topbar,
  Card,
  Label,
  Input,
  Select,
  Button,
  UI,
} from "@/app/_ui/ui";

type Product = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  price: number;
  created_at: string;
};

function brl(v: number) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// aceita: 12,50 | 12.50 | R$ 12,50
function parseBRL(input: string) {
  const cleaned = (input ?? "")
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

// normaliza para comparar nomes (case-insensitive + remove espaços duplicados)
function normalizeName(s: string) {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export default function ProdutosPage() {
  const router = useRouter();

  const [lista, setLista] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // form
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(""); // pode ser "" (sem categoria)
  const [description, setDescription] = useState("");
  const [priceText, setPriceText] = useState("");

  // edição
  const [editId, setEditId] = useState<string | null>(null);

  // busca
  const [busca, setBusca] = useState("");

  // toast
  const [msg, setMsg] = useState<string | null>(null);
  function toast(texto: string) {
    setMsg(texto);
    window.clearTimeout((toast as any)._t);
    (toast as any)._t = window.setTimeout(() => setMsg(null), 2500);
  }

  async function checarLogin() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) router.push("/login");
  }

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function carregar() {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      alert("Erro ao carregar: " + error.message);
      return;
    }

    setLista((data as Product[]) ?? []);
  }

  function limparFormulario() {
    setName("");
    setCategory("");
    setDescription("");
    setPriceText("");
    setEditId(null);
  }

  function iniciarEdicao(p: Product) {
    setEditId(p.id);
    setName(p.name ?? "");
    setCategory(p.category ?? "");
    setDescription(p.description ?? "");
    setPriceText(String(p.price ?? 0).replace(".", ","));
    toast("Modo edição ativado");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // --- DUPLICADO (apenas por nome) ---
  const nomeNormalizado = useMemo(() => normalizeName(name), [name]);

  const nomeDuplicado = useMemo(() => {
    if (!nomeNormalizado) return false;

    return lista.some((p) => {
      // se estiver editando, ignora o próprio item
      if (editId && p.id === editId) return false;
      return normalizeName(p.name) === nomeNormalizado;
    });
  }, [lista, nomeNormalizado, editId]);

  async function cadastrarOuSalvar(e: React.FormEvent) {
    e.preventDefault();

    const nome = name.trim();
    if (!nome) {
      toast("Digite o nome do produto.");
      return;
    }

    if (nomeDuplicado) {
      toast("Já existe um produto com esse nome.");
      return;
    }

    const price = parseBRL(priceText);
    if (!Number.isFinite(price) || price < 0) {
      toast("Preço inválido. Ex: 199,90");
      return;
    }

    setSaving(true);

    // UPDATE
    if (editId) {
      const { error } = await supabase
        .from("products")
        .update({
          name: nome,
          category: category.trim() || null,
          description: description.trim() || null,
          price,
        })
        .eq("id", editId);

      setSaving(false);

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("duplicate") || msg.includes("unique")) {
          toast("Produto duplicado. Use outro nome.");
          return;
        }
        alert("Erro ao salvar: " + error.message);
        return;
      }

      toast("Produto atualizado!");
      limparFormulario();
      await carregar();
      return;
    }

    // INSERT
    const { error } = await supabase.from("products").insert([
      {
        name: nome,
        category: category.trim() || null,
        description: description.trim() || null,
        price,
      },
    ]);

    setSaving(false);

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("duplicate") || msg.includes("unique")) {
        toast("Produto duplicado. Use outro nome.");
        return;
      }
      alert("Erro ao cadastrar: " + error.message);
      return;
    }

    toast("Produto cadastrado!");
    limparFormulario();
    await carregar();
  }

  async function excluir(id: string) {
    const ok = confirm("Deseja excluir este produto?");
    if (!ok) return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert("Erro ao excluir: " + error.message);
      return;
    }

    if (editId === id) limparFormulario();
    toast("Produto excluído!");
    await carregar();
  }

  useEffect(() => {
    checarLogin();
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const listaFiltrada = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return lista;

    return lista.filter((p) => {
      const n = (p.name ?? "").toLowerCase();
      const c = (p.category ?? "").toLowerCase();
      const d = (p.description ?? "").toLowerCase();
      const pr = String(p.price ?? "");
      return n.includes(q) || c.includes(q) || d.includes(q) || pr.includes(q);
    });
  }, [busca, lista]);

  return (
    <PageShell>
      {/* Toast */}
      {msg && (
        <div
          style={{
            position: "fixed",
            top: 14,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#111",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 12,
            fontSize: 14,
            zIndex: 9999,
            border: "1px solid rgba(255,255,255,.15)",
            boxShadow: "0 10px 30px rgba(0,0,0,.35)",
          }}
        >
          {msg}
        </div>
      )}

      <Topbar
        title="Produtos"
        subtitle="Cadastro de produtos, preços e organização por categoria."
        right={
          <>
            <Button variant="ghost" type="button" onClick={() => router.push("/")}>
              Home
            </Button>
            <Button variant="ghost" type="button" onClick={sair}>
              Sair
            </Button>
          </>
        }
      />

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gap: 14,
          gridTemplateColumns: "1.05fr 1.95fr",
          alignItems: "start",
        }}
      >
        {/* COLUNA ESQUERDA: FORM */}
        <Card
          kicker={editId ? "Editando produto" : "Cadastrar novo produto"}
          title={editId ? "Salvar alterações" : "Cadastro"}
        >
          <form onSubmit={cadastrarOuSalvar} style={{ display: "grid", gap: 12 }}>
            <div>
              <Label>Nome do produto</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: MDF 18mm Branco"
                disabled={saving}
              />
              {nomeDuplicado && (
                <div style={{ marginTop: 8, fontSize: 12.5, color: UI.danger, fontWeight: 800 }}>
                  Já existe um produto com esse nome.
                </div>
              )}
            </div>

            <div>
              <Label>Categoria</Label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)} disabled={saving}>
                <option value="">Sem categoria</option>
                <option value="MDF">MDF</option>
                <option value="Ferragem">Ferragem</option>
                <option value="Madeira">Madeira</option>
                <option value="Outros">Outros</option>
              </Select>
            </div>

            <div>
              <Label>Descrição</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes do produto (opcional)"
                disabled={saving}
              />
            </div>

            <div>
              <Label>Preço (R$)</Label>
              <Input
                value={priceText}
                onChange={(e) => setPriceText(e.target.value)}
                placeholder="Ex: 199,90"
                disabled={saving}
              />
            </div>

            <Button
              type="submit"
              disabled={saving || loading || !name.trim() || nomeDuplicado}
              style={{ height: 46 }}
            >
              {saving ? "Salvando..." : editId ? "Salvar" : "Cadastrar"}
            </Button>

            {editId && (
              <Button
                type="button"
                variant="dangerOutline"
                onClick={() => {
                  limparFormulario();
                  toast("Edição cancelada");
                }}
                disabled={saving}
                style={{ height: 46 }}
              >
                Cancelar edição
              </Button>
            )}
          </form>
        </Card>

        {/* COLUNA DIREITA: BUSCA + LISTA */}
        <Card
          kicker="Pesquisar"
          title="Lista de produtos"
          right={<div style={{ fontSize: 13, color: UI.muted }}>{listaFiltrada.length} produto(s)</div>}
        >
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <Label>Busca</Label>
              <Input
                placeholder="Buscar por nome, categoria, descrição ou preço..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            <div style={{ border: `1px solid ${UI.line}`, borderRadius: 14, overflow: "hidden" }}>
              {loading && <div style={{ padding: 12, color: UI.muted }}>Carregando...</div>}

              {!loading && listaFiltrada.length === 0 && (
                <div style={{ padding: 12, color: UI.muted }}>Nenhum produto encontrado.</div>
              )}

              {!loading &&
                listaFiltrada.map((p) => {
                  const emEdicao = editId === p.id;
                  return (
                    <div
                      key={p.id}
                      style={{
                        padding: 14,
                        borderTop: `1px solid ${UI.line}`,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "center",
                        background: emEdicao ? "#fff6f6" : "linear-gradient(180deg,#fff 0%,#fbfbfd 100%)",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 950, color: UI.text, fontSize: 16, lineHeight: 1.2 }}>
                          {p.name} {emEdicao ? <span style={{ color: UI.danger }}>• editando</span> : null}
                        </div>

                        <div style={{ fontSize: 12.5, color: UI.muted, marginTop: 6 }}>
                          {p.category ? <span>Categoria: <b style={{ color: UI.text }}>{p.category}</b></span> : <span>Sem categoria</span>}
                          {" "}• Preço: <b style={{ color: UI.text }}>{brl(Number(p.price ?? 0))}</b>
                        </div>

                        {p.description ? (
                          <div style={{ fontSize: 12.5, color: UI.muted, marginTop: 6 }}>
                            {p.description}
                          </div>
                        ) : null}
                      </div>

                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <Button type="button" variant="dangerOutline" onClick={() => iniciarEdicao(p)} disabled={saving}>
                          Editar
                        </Button>
                        <Button type="button" onClick={() => excluir(p.id)} disabled={saving}>
                          Excluir
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ color: "#fff", opacity: 0.5, fontSize: 12, marginTop: 12 }}>
        © {new Date().getFullYear()} KV Marcenaria • Produtos
      </div>
    </PageShell>
  );
}
