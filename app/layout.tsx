// app/layout.tsx
import "./globals.css";
import Topbar from "./components/Topbar";

export const metadata = {
  title: "KV Marcenaria",
  description: "Sistema de Gestão",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ano = new Date().getFullYear();

  return (
    <html lang="pt-BR">
      <body>
        {/* TOPBAR GLOBAL */}
        <Topbar />

        {/* CONTEÚDO */}
        <main className="appShell">{children}</main>

        <footer className="footer">© {ano} KV Marcenaria</footer>
      </body>
    </html>
  );
}
