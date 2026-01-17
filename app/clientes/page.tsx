"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  PageShell,
  Topbar,
  Card,
  Label,
  Input,
  Button,
  UI,
} from "@/app/_ui/ui";

type Cliente = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
};

type ModalState =
  | { open: false }
  | {
      open: true;
      id: string;
      title: string;
      description?: string;
      confirmText?: string;
      danger?: boolean;
    };

function formatPhoneBR(raw: string) {
  // mantém só dígitos
  const digits = raw.replace(/\D/g, "").slice(0, 11);

  // (11) 99999-9999
  if (digits.length <= 2) return digits;
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;

  // 9 dígitos (celular)
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
}

function useToast() {
  const [msg, setMsg] = useState<{ text: string; kind?: "ok" | "warn" } | null>(null);

  function toast(text: string, kind: "ok" | "warn" = "ok") {
    setMsg({ text, kind });
    window.clearTimeout((toast as any)._t);
    (toast as any)._t = window.setTimeout(() => setMsg(null), 2400);
  }

  const Toast = msg ? (
    <div
      style={{
        position: "fixed",
        top: 14,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        padding: "10px 14px",
        borderRadius: 12,
        fontSize: 14,
        color: "#fff",
        background: msg.kind === "warn" ? "rgba(139,15,24,.92)" : "rgba(17,17,17,.92)",
        border: "1px solid rgba(255,255,255,.14)",
        boxShadow: "0 10px 30px rgba(0,0,0,.35)",
        backdropFilter: "blur(10px)",
      }}
    >
      {msg.text}
    </div>
  ) : null;

  return { toast, Toast };
}

function Modal({
  state,
  onClose,
  onConfirm,
  busy,
}: {
  state: ModalState;
  onClose: () => void;
  onConfirm: () => void;
  busy?: boolean;
}) {
  if (!state.open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "rgba(0,0,0,.55)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "min(560px, 100%)",
          background: "#fff",
          borderRadius: 18,
          border: `1px solid ${UI.border}`,
          boxShadow: "0 24px 70px rgba(0,0,0,.45)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 16, borderBottom: `1px solid ${UI.line}` }}>
          <div style={{ fontSize: 13, color: UI.muted }}>
            {state.danger ? "Ação irreversível" : "Confirmação"}
          </div>
          <div style={{ fontSize: 18, fontWeight: 950, color: UI.text }}>{state.title}</div>
          {state.description ? (
            <div style={{ marginTop: 6, fontSize: 13.5, color: UI.muted, lineHeight: 1.35 }}>
              {state.description}
            </div>
          ) : null}
        </div>

        <div style={{ padding: 16, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              border: "1px solid rgba(17,24,39,.14)",
              padding: "10px 14px",
              borderRadius: 12,
              cursor: busy ? "not-allowed" : "pointer",
              background: "#fff",
              color: UI.text,
              fontWeight: 900,
              opacity: busy ? 0.7 : 1,
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            style={{
              border: state.danger ? `1px solid ${UI.danger}` : `1px solid ${UI.danger}`,
              padding: "10px 14px",
              borderRadius: 12,
              cursor: busy ? "not-allowed" : "pointer",
              background: state.danger ? UI.accent : UI.accent,
              color: "#fff",
              fontWeight: 950,
              opacity: busy ? 0.7 : 1,
              minWidth: 140,
            }}
          >
            {busy ? "Processando..." : state.confirmText ?? "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientesPage() {
  const router = useRouter();
  const { toast, Toast } = useToast();

  const [lista, setLista] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  // form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // edição
  const [editId, setEditId] = useState<string | null>(null);

  // busca
  const [busca, setBusca] = useState("");

  // modal
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [modalBusy, setModalBusy] = useState(false);

  // foco no nome ao abrir edição/novo
  const nameRef = useRef<HTMLInputElement | null>(null);

  async function checarLogin() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) router.push("/login");
  }

  async function carregar() {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);

    if (error) {
      toast("Erro ao carregar: " + error.message, "warn");
      return;
    }
    setLista((data as Cliente[]) ?? []);
  }

  function limparFormulario(opts?: { keepFocus?: boolean }) {
    setName("");
    setPhone("");
    setAddress("");
    setNotes("");
    setEditId(null);
    if (opts?.keepFocus) {
      setTimeout(() => nameRef.current?.focus(), 0);
    }
  }

  function iniciarEdicao(c: Cliente) {
    setEditId(c.id);
    setName(c.name ?? "");
    setPhone(c.phone ?? "");
    setAddress(c.address ?? "");
    setNotes(c.notes ?? "");
    toast("Modo edição ativado");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => nameRef.current?.focus(), 0);
  }

  async function cadastrarOuSalvar(e: React.FormEvent) {
    e.preventDefault();

    const nm = name.trim();
    if (!nm) return toast("Digite o nome do cliente.", "warn");

    setLoading(true);

    if (editId) {
      const { error } = await supabase
        .from("clients")
        .update({
          name: nm,
          phone: phone.trim() || null,
          address: address.trim() || null,
          notes: notes.trim() || null,
        })
        .eq("id", editId);

      setLoading(false);

      if (error) return toast("Erro ao salvar: " + error.message, "warn");

      toast("Cliente atualizado!");
      limparFormulario({ keepFocus: true });
      await carregar();
      return;
    }

    const { error } = await supabase.from("clients").insert([
      {
        name: nm,
        phone: phone.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
      },
    ]);

    setLoading(false);

    if (error) return toast("Erro ao cadastrar: " + error.message, "warn");

    toast("Cliente cadastrado!");
    limparFormulario({ keepFocus: true });
    await carregar();
  }

  function pedirExclusao(c: Cliente) {
    setModal({
      open: true,
      id: c.id,
      title: `Excluir "${c.name}"?`,
      description:
        "Essa ação remove o cliente do sistema. Se ele estiver vinculado a orçamentos, pode falhar dependendo das regras do banco (relacionamentos).",
      confirmText: "Excluir cliente",
      danger: true,
    });
  }

  async function confirmarExclusao() {
    if (!modal.open) return;

    setModalBusy(true);
    const { error } = await supabase.from("clients").delete().eq("id", modal.id);
    setModalBusy(false);

    if (error) {
      toast("Erro ao excluir: " + error.message, "warn");
      return;
    }

    if (editId === modal.id) limparFormulario({ keepFocus: true });
    setModal({ open: false });
    toast("Cliente excluído!");
    await carregar();
  }

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  useEffect(() => {
    checarLogin();
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const listaFiltrada = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return lista;

    return lista.filter((c) => {
      const nome = (c.name ?? "").toLowerCase();
      const tel = (c.phone ?? "").toLowerCase();
      const end = (c.address ?? "").toLowerCase();
      const obs = (c.notes ?? "").toLowerCase();
      return nome.includes(q) || tel.includes(q) || end.includes(q) || obs.includes(q);
    });
  }, [busca, lista]);

  const total = lista.length;
  const totalFiltrado = listaFiltrada.length;

  return (
    <PageShell>
      {Toast}

      <Modal
        state={modal}
        onClose={() => (modalBusy ? null : setModal({ open: false }))}
        onConfirm={confirmarExclusao}
        busy={modalBusy}
      />

      <Topbar
        title="Clientes"
        subtitle={
          <>
            Cadastre, edite e gerencie clientes. •{" "}
            <b>{totalFiltrado}</b> visível(is) • <span style={{ opacity: 0.9 }}>{total}</span>{" "}
            no total
          </>
        }
        right={
          <>
            <div
              style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,.16)",
                background: "rgba(255,255,255,0.06)",
                color: "#fff",
                opacity: 0.85,
                alignSelf: "center",
              }}
            >
              Online
            </div>
            <Button variant="ghost" type="button" onClick={sair}>
              Sair
            </Button>
          </>
        }
      />

      <div
        className="clientesGrid"
        style={{
          marginTop: 14,
          display: "grid",
          gap: 14,
          gridTemplateColumns: "520px 1fr",
          alignItems: "start",
        }}
      >
        {/* CADASTRO / EDIÇÃO */}
        <Card
          kicker={editId ? "Editando cliente" : "Cadastrar novo cliente"}
          title={editId ? "Salvar alterações" : "Cadastro"}
          right={
            editId ? (
              <div
                style={{
                  fontSize: 12,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(196,22,32,.22)",
                  background: "rgba(196,22,32,.06)",
                  color: UI.text,
                  fontWeight: 900,
                }}
              >
                Modo edição
              </div>
            ) : null
          }
        >
          <form onSubmit={cadastrarOuSalvar} style={{ display: "grid", gap: 12 }}>
            <div>
              <Label>Nome</Label>
              <Input
                ref={(el) => {
                  nameRef.current = el;
                }}
                placeholder="Ex: João da Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <Label>Telefone</Label>
              <Input
                placeholder="Ex: (11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
                disabled={loading}
                inputMode="numeric"
              />
            </div>

            <div>
              <Label>Endereço</Label>
              <Input
                placeholder="Rua, nº, bairro, cidade"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <Label>Observação</Label>
              <Input
                placeholder="Preferências, referências, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <Button type="submit" disabled={loading}>
                {editId ? "Salvar" : "Cadastrar"}
              </Button>

              {editId ? (
                <Button
                  type="button"
                  variant="dangerOutline"
                  disabled={loading}
                  onClick={() => {
                    limparFormulario({ keepFocus: true });
                    toast("Edição cancelada");
                  }}
                >
                  Cancelar
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={() => limparFormulario({ keepFocus: true })}
                  disabled={loading}
                  style={{
                    border: "1px solid rgba(17,24,39,.14)",
                    padding: "10px 14px",
                    borderRadius: 12,
                    cursor: loading ? "not-allowed" : "pointer",
                    background: "#fff",
                    color: UI.text,
                    fontWeight: 900,
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  Limpar
                </button>
              )}
            </div>

            <div
              style={{
                marginTop: 4,
                fontSize: 12.5,
                color: UI.muted,
                lineHeight: 1.35,
              }}
            >
              Dica: você pode buscar por <b style={{ color: UI.text }}>nome</b>,{" "}
              <b style={{ color: UI.text }}>telefone</b>, <b style={{ color: UI.text }}>endereço</b>{" "}
              ou <b style={{ color: UI.text }}>observação</b>.
            </div>
          </form>
        </Card>

        {/* LISTA */}
        <Card
          kicker="Pesquisar"
          title="Lista de clientes"
          right={
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ fontSize: 13, color: UI.muted }}>
                {totalFiltrado} cliente(s)
              </div>
              <button
                type="button"
                onClick={carregar}
                disabled={loading}
                style={{
                  border: "1px solid rgba(17,24,39,.14)",
                  padding: "8px 10px",
                  borderRadius: 12,
                  cursor: loading ? "not-allowed" : "pointer",
                  background: "#fff",
                  color: UI.text,
                  fontWeight: 900,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                Atualizar
              </button>
            </div>
          }
        >
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <Label>Buscar</Label>
              <Input
                placeholder="Nome, telefone, endereço ou observação..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                disabled={loading}
              />
            </div>

            <div style={{ border: `1px solid ${UI.line}`, borderRadius: 14, overflow: "hidden" }}>
              {loading && <div style={{ padding: 12, opacity: 0.7 }}>Carregando...</div>}

              {!loading && listaFiltrada.length === 0 && (
                <div style={{ padding: 12, opacity: 0.7 }}>Nenhum cliente encontrado.</div>
              )}

              {!loading &&
                listaFiltrada.map((c) => {
                  const emEdicao = editId === c.id;

                  return (
                    <div
                      key={c.id}
                      style={{
                        padding: 14,
                        borderTop: `1px solid ${UI.line}`,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "center",
                        background: emEdicao
                          ? "rgba(196,22,32,.06)"
                          : "linear-gradient(180deg, #ffffff 0%, #fbfbfd 100%)",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 950,
                            color: UI.text,
                            fontSize: 16,
                            lineHeight: 1.2,
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 420 }}>
                            {c.name}
                          </span>
                          {emEdicao ? (
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 900,
                                color: UI.text,
                                border: "1px solid rgba(196,22,32,.22)",
                                background: "rgba(196,22,32,.08)",
                                padding: "4px 8px",
                                borderRadius: 999,
                              }}
                            >
                              editando
                            </span>
                          ) : null}
                        </div>

                        <div style={{ fontSize: 12.5, color: UI.muted, marginTop: 6, lineHeight: 1.35 }}>
                          {c.phone ? (
                            <>
                              📞 <b style={{ color: UI.text }}>{c.phone}</b>
                            </>
                          ) : (
                            <span style={{ opacity: 0.6 }}>📞 sem telefone</span>
                          )}
                          {c.address ? (
                            <>
                              {" "}
                              • 📍 <span style={{ opacity: 0.9 }}>{c.address}</span>
                            </>
                          ) : null}
                          {c.notes ? (
                            <>
                              {" "}
                              • 📝 <span style={{ opacity: 0.9 }}>{c.notes}</span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(c)}
                          style={{
                            border: "1px solid rgba(17,24,39,.14)",
                            padding: "10px 12px",
                            borderRadius: 12,
                            cursor: "pointer",
                            background: "#fff",
                            color: UI.text,
                            fontWeight: 900,
                            height: 42,
                            minWidth: 96,
                          }}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => pedirExclusao(c)}
                          style={{
                            border: "1px solid rgba(139,15,24,.35)",
                            padding: "10px 12px",
                            borderRadius: 12,
                            cursor: "pointer",
                            background: "#fff",
                            color: UI.danger,
                            fontWeight: 950,
                            height: 42,
                            minWidth: 96,
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ color: "#fff", opacity: 0.5, fontSize: 12, marginTop: 10 }}>
        © {new Date().getFullYear()} KV Marcenaria • Clientes
      </div>

      <style>{`
        @media (max-width: 980px) {
          .clientesGrid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </PageShell>
  );
}
