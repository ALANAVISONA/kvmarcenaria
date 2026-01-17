"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Home,
  Users,
  Package,
  Boxes,
  FileText,
  Menu,
  X,
  LogOut,
} from "lucide-react";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link className={`nav__link ${isActive ? "is-active" : ""}`} href={href}>
      {children}
    </Link>
  );
}

export default function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Fecha o menu quando trocar de página
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <Link className="brand" href="/">
          <img
            src="/logo.jpg"
            alt="KV Marcenaria"
            className="brand__logo"
            width={56}
            height={56}
          />
          <div>
            <div className="brand__title">KV Marcenaria</div>
            <div className="brand__sub">Sistema de Gestão</div>
          </div>
        </Link>

        {/* NAV DESKTOP */}
        <nav className="nav nav--desktop">
          <NavLink href="/">
            <span className="nav__item">
              <Home size={16} />
              Home
            </span>
          </NavLink>

          <NavLink href="/clientes">
            <span className="nav__item">
              <Users size={16} />
              Clientes
            </span>
          </NavLink>

          <NavLink href="/produtos">
            <span className="nav__item">
              <Package size={16} />
              Produtos
            </span>
          </NavLink>

          <NavLink href="/estoque">
            <span className="nav__item">
              <Boxes size={16} />
              Estoque
            </span>
          </NavLink>

          <NavLink href="/orcamentos">
            <span className="nav__item">
              <FileText size={16} />
              Orçamentos
            </span>
          </NavLink>
        </nav>

        <div className="topbar__right">
          <span className="chip chip--desktop">Online</span>

          <button type="button" className="btn btn--ghost btn--desktop" onClick={sair}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <LogOut size={16} />
              Sair
            </span>
          </button>

          {/* BOTÃO HAMBURGUER (MOBILE) */}
          <button
            type="button"
            className="iconBtn iconBtn--mobile"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* MENU MOBILE */}
      {open && (
        <div className="mobileNav">
          <div className="mobileNav__inner">
            <NavLink href="/">
              <span className="nav__item">
                <Home size={18} />
                Home
              </span>
            </NavLink>

            <NavLink href="/clientes">
              <span className="nav__item">
                <Users size={18} />
                Clientes
              </span>
            </NavLink>

            <NavLink href="/produtos">
              <span className="nav__item">
                <Package size={18} />
                Produtos
              </span>
            </NavLink>

            <NavLink href="/estoque">
              <span className="nav__item">
                <Boxes size={18} />
                Estoque
              </span>
            </NavLink>

            <NavLink href="/orcamentos">
              <span className="nav__item">
                <FileText size={18} />
                Orçamentos
              </span>
            </NavLink>

            <div className="mobileNav__bottom">
              <span className="chip">Online</span>
              <button type="button" className="btn btn--ghost" onClick={sair}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <LogOut size={16} />
                  Sair
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
