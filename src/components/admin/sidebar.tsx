"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Aperture,
  CalendarCheck2,
  ChevronDown,
  CircleHelp,
  Cog,
  Contact2,
  FileText,
  FolderCog,
  Images,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Settings2,
  Sparkles,
  Star,
  UserCircle2,
  Users,
  UserSquare2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type MenuGroup = {
  title: string;
  icon: LucideIcon;
  items: MenuItem[];
};

const groups: MenuGroup[] = [
  {
    title: "Geral",
    icon: LayoutDashboard,
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Conteudo",
    icon: FileText,
    items: [
      { href: "/admin/conteudo", label: "Conteúdo", icon: FileText },
      { href: "/admin/servicos", label: "Serviços", icon: Sparkles },
      { href: "/admin/galeria", label: "Galeria", icon: Images },
      { href: "/admin/testemunhos", label: "Testemunhos", icon: Star },
      { href: "/admin/faq", label: "FAQ", icon: CircleHelp },
    ],
  },
  {
    title: "Operacao",
    icon: Aperture,
    items: [
      { href: "/admin/marcacoes", label: "Marcações", icon: CalendarCheck2 },
      { href: "/admin/clientes", label: "Clientes", icon: Users },
      { href: "/admin/contactos", label: "Contactos", icon: MessageSquareText },
      { href: "/admin/equipa", label: "Equipa", icon: UserSquare2 },
      { href: "/admin/disponibilidade", label: "Disponibilidade", icon: Contact2 },
    ],
  },
  {
    title: "Sistema",
    icon: Settings2,
    items: [
      { href: "/admin/configuracoes", label: "Configurações", icon: Cog },
      { href: "/admin/utilizadores", label: "Utilizadores", icon: FolderCog },
    ],
  },
];

type AdminSidebarProps = {
  className?: string;
  onNavigate?: () => void;
  sessionName: string;
  sessionRole: string;
  logoutAction: () => Promise<void>;
};

export function AdminSidebar({ className, onNavigate, sessionName, sessionRole, logoutAction }: AdminSidebarProps) {
  const pathname = usePathname();
  const activeGroupTitle = groups.find((group) => group.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)))?.title ?? "Geral";
  const [openGroup, setOpenGroup] = useState<string | null>(activeGroupTitle);

  const isItemActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const isGroupActive = (items: MenuItem[]) => items.some((item) => isItemActive(item.href));

  return (
    <aside className={cn("section-card rounded-[1.25rem] border-line/80 p-3", className)}>
      <div className="flex h-full min-h-0 flex-col">
        <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-strong">Administração</p>

        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
          {groups.map((group) => (
            <section key={group.title} className="rounded-xl border border-line/70 bg-white/70 p-1.5">
              <button
                type="button"
                onClick={() => setOpenGroup((current) => (current === group.title ? null : group.title))}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]",
                  activeGroupTitle === group.title ? "text-primary-strong" : "text-muted",
                )}
              >
                <span className="flex items-center gap-1.5">
                  <group.icon className="h-3.5 w-3.5" />
                  {group.title}
                </span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", openGroup === group.title ? "rotate-180" : "rotate-0")} />
              </button>

              <div
                className={cn(
                  "space-y-1 overflow-hidden transition-[max-height,opacity,margin,padding] duration-250 ease-out",
                  openGroup === group.title ? "mt-1 max-h-80 py-1 opacity-100" : "max-h-0 py-0 opacity-0",
                )}
              >
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold",
                      isItemActive(item.href)
                        ? "bg-foreground text-white"
                        : isGroupActive(group.items)
                          ? "bg-surface/90 text-foreground hover:bg-surface-strong"
                          : "text-muted hover:bg-surface-strong hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-2 rounded-xl border border-line/70 bg-white/75 p-2.5">
          <p className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <UserCircle2 className="h-4 w-4 text-primary-strong" />
            {sessionName}
          </p>
          <p className="mt-1 text-[11px] text-muted">{sessionRole}</p>

          <form action={logoutAction} className="mt-2">
            <button type="submit" className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground">
              <LogOut className="h-3.5 w-3.5" />
              Terminar sessão
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
