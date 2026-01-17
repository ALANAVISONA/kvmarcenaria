"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  Image,
} from "@react-pdf/renderer";

type Item = {
  nome: string;
  qtd: number;
  precoUnit: number;
  total: number;
};

type Orcamento = {
  numero: string;
  cliente: string;
  status: string;
  data: string; // "17/01/2026"
  itens: Item[];
  total: number;
};

const KV_RED = "#C41F2A";
const DARK = "#111827";
const MUTED = "#6B7280";
const LINE = "#E5E7EB";
const LIGHT = "#F9FAFB";

/** Caminho do logo na pasta /public */
const LOGO_URL = "/logo.jpg";

/** Dados da empresa */
const WHATSAPP = "(11) 93903-7952";
const ENDERECO = "Rua Martim Burchard 187, Brás - 03043-020 - São Paulo/SP";

const styles = StyleSheet.create({
  page: {
    paddingTop: 26,
    paddingBottom: 30,
    paddingHorizontal: 28,
    fontSize: 10.5,
    fontFamily: "Helvetica",
    color: DARK,
  },

  /* Header */
  headerWrap: {
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    paddingBottom: 12,
    marginBottom: 14,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 44, height: 44, borderRadius: 10 },
  brandName: { fontSize: 12.5, fontWeight: "bold" },
  brandSub: { fontSize: 9.5, color: MUTED, marginTop: 2 },

  headerRight: { maxWidth: 260 },
  rightLine: { fontSize: 9.3, color: MUTED, textAlign: "right", lineHeight: 1.25 },
  rightStrong: { fontSize: 11.5, fontWeight: "bold", textAlign: "right", marginTop: 6 },

  docTitle: { fontSize: 18, fontWeight: "bold", marginTop: 10 },
  docMetaRow: { flexDirection: "row", gap: 10, marginTop: 8, flexWrap: "wrap" },

  chip: {
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: LIGHT,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontSize: 9.5,
    color: DARK,
  },
  chipStatus: {
    borderColor: KV_RED,
    backgroundColor: "#FDEBEC",
    color: KV_RED,
    fontWeight: "bold",
  },

  /* Info boxes */
  infoGrid: { flexDirection: "row", gap: 10, marginTop: 10 },
  box: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#FFFFFF",
  },
  label: { fontSize: 9, color: MUTED, marginBottom: 4 },
  value: { fontSize: 11.5, fontWeight: "bold" },

  /* Table */
  table: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 8,
    overflow: "hidden",
  },
  trHead: {
    flexDirection: "row",
    backgroundColor: LIGHT,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  th: { fontWeight: "bold", color: DARK },
  td: { color: DARK },

  c1: { width: "46%" },
  c2: { width: "12%", textAlign: "right" },
  c3: { width: "21%", textAlign: "right" },
  c4: { width: "21%", textAlign: "right" },

  /* Total */
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
  totalBox: {
    width: 260,
    borderWidth: 1,
    borderColor: KV_RED,
    backgroundColor: "#FDEBEC",
    borderRadius: 10,
    padding: 12,
  },
  totalLabel: { color: KV_RED, fontSize: 9.5, fontWeight: "bold" },
  totalValue: { fontSize: 16, fontWeight: "bold", marginTop: 6, color: DARK },

  /* Conditions */
  notes: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#FFFFFF",
  },
  notesTitle: { fontSize: 10.5, fontWeight: "bold", marginBottom: 8 },
  bullet: { flexDirection: "row", gap: 6, marginBottom: 6 },
  bulletDot: { color: KV_RED, fontWeight: "bold" },
  notesText: { fontSize: 9.6, color: MUTED, lineHeight: 1.35, flex: 1 },

  /* Footer */
  footer: {
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: LINE,
    fontSize: 9,
    color: MUTED,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  footerLeft: { flex: 1 },
  footerRight: { textAlign: "right" },
});

function moeda(v: number) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function OrcamentoDoc({ data }: { data: Orcamento }) {
  const itensCount = data.itens?.length ?? 0;
  const dataGeracao = new Date().toLocaleDateString("pt-BR");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.headerWrap}>
          <View style={styles.headerTop}>
            <View style={styles.brand}>
              <Image src={LOGO_URL} style={styles.logo} />
              <View>
                <Text style={styles.brandName}>KV Marcenaria</Text>
                <Text style={styles.brandSub}>Sistema de Gestão • Orçamento</Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <Text style={styles.rightLine}>WhatsApp: {WHATSAPP}</Text>
              <Text style={styles.rightLine}>{ENDERECO}</Text>
              <Text style={styles.rightStrong}>Orçamento #{data.numero}</Text>
            </View>
          </View>

          <Text style={styles.docTitle}>Proposta de Orçamento</Text>

          <View style={styles.docMetaRow}>
            <Text style={styles.chip}>Data: {data.data || "-"}</Text>
            <Text style={[styles.chip, styles.chipStatus]}>
              Status: {data.status || "Orçamento"}
            </Text>
            <Text style={styles.chip}>Itens: {itensCount}</Text>
          </View>
        </View>

        {/* DADOS */}
        <View style={styles.infoGrid}>
          <View style={styles.box}>
            <Text style={styles.label}>Cliente</Text>
            <Text style={styles.value}>{data.cliente || "-"}</Text>
          </View>

          <View style={styles.box}>
            <Text style={styles.label}>Pagamento</Text>
            <Text style={styles.value}>PIX • Crédito • Débito</Text>
          </View>
        </View>

        {/* TABELA */}
        <View style={styles.table}>
          <View style={styles.trHead}>
            <Text style={[styles.th, styles.c1]}>Produto / Serviço</Text>
            <Text style={[styles.th, styles.c2]}>Qtd</Text>
            <Text style={[styles.th, styles.c3]}>Valor unit.</Text>
            <Text style={[styles.th, styles.c4]}>Subtotal</Text>
          </View>

          {itensCount === 0 ? (
            <View style={styles.tr}>
              <Text style={[styles.td, styles.c1]}>Nenhum item adicionado.</Text>
              <Text style={[styles.td, styles.c2]} />
              <Text style={[styles.td, styles.c3]} />
              <Text style={[styles.td, styles.c4]} />
            </View>
          ) : (
            data.itens.map((it, idx) => (
              <View key={idx} style={styles.tr}>
                <Text style={[styles.td, styles.c1]}>{it.nome}</Text>
                <Text style={[styles.td, styles.c2]}>{it.qtd}</Text>
                <Text style={[styles.td, styles.c3]}>{moeda(it.precoUnit)}</Text>
                <Text style={[styles.td, styles.c4]}>{moeda(it.total)}</Text>
              </View>
            ))
          )}
        </View>

        {/* TOTAL */}
        <View style={styles.totalRow}>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>TOTAL DO ORÇAMENTO</Text>
            <Text style={styles.totalValue}>{moeda(data.total)}</Text>
          </View>
        </View>

        {/* CONDIÇÕES COMERCIAIS */}
        <View style={styles.notes}>
          <Text style={styles.notesTitle}>Condições comerciais</Text>

          <View style={styles.bullet}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.notesText}>
              <Text style={{ fontWeight: "bold", color: DARK }}>Prazo estabelecido:</Text>{" "}
              até <Text style={{ fontWeight: "bold", color: DARK }}>40 (quarenta) dias úteis</Text>{" "}
              para produção e entrega, contados a partir da aprovação do orçamento, confirmação do
              pagamento de entrada e validação final das medidas e detalhes do projeto.
            </Text>
          </View>

          <View style={styles.bullet}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.notesText}>
              <Text style={{ fontWeight: "bold", color: DARK }}>Validade do orçamento:</Text>{" "}
              <Text style={{ fontWeight: "bold", color: DARK }}>7 (sete) dias</Text> a partir da data
              de emissão.
            </Text>
          </View>

          <View style={styles.bullet}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.notesText}>
              <Text style={{ fontWeight: "bold", color: DARK }}>Forma de pagamento:</Text>{" "}
              <Text style={{ fontWeight: "bold", color: DARK }}>50% de entrada</Text> para início da
              produção e <Text style={{ fontWeight: "bold", color: DARK }}>50% na entrega/montagem</Text>.
            </Text>
          </View>

          <View style={styles.bullet}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.notesText}>
              <Text style={{ fontWeight: "bold", color: DARK }}>Pagamentos aceitos:</Text> PIX, cartão
              de crédito e cartão de débito.
            </Text>
          </View>

          <View style={styles.bullet}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.notesText}>
              <Text style={{ fontWeight: "bold", color: DARK }}>Observação:</Text> eventuais alterações
              solicitadas após a aprovação podem impactar prazo e valores.
            </Text>
          </View>
        </View>

        {/* RODAPÉ */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={styles.footerLeft}>KV Marcenaria • WhatsApp: {WHATSAPP}</Text>
            <Text style={styles.footerRight}>Gerado em {dataGeracao}</Text>
          </View>
          <Text>{ENDERECO}</Text>
        </View>
      </Page>
    </Document>
  );
}

export function BotaoBaixarPDF({ orcamento }: { orcamento: Orcamento }) {
  const fileName = `orcamento-${orcamento.numero}.pdf`;

  return (
    <PDFDownloadLink
      document={<OrcamentoDoc data={orcamento} />}
      fileName={fileName}
      style={{ textDecoration: "none" }}
    >
      {({ loading }) => (
        <button type="button" className="btn btn--primary" disabled={loading}>
          {loading ? "Gerando PDF..." : "Baixar PDF"}
        </button>
      )}
    </PDFDownloadLink>
  );
}
