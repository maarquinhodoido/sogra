"use client";

import { useState, type ReactNode } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";
import { cn } from "@/lib/utils";

type AdminPanelFrameProps = {
  children: ReactNode;
  sessionName: string;
  sessionRole: string;
  logoutAction: () => Promise<void>;
};

export function AdminPanelFrame({ children, sessionName, sessionRole, logoutAction }: AdminPanelFrameProps) {
  const pathname = usePathname();
  const isAgendaPage = pathname.startsWith("/admin/marcacoes");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setDesktopSidebarOpen((value) => !value)}
        className={cn(
          "fixed top-4 z-50 hidden h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-foreground lg:inline-flex",
          desktopSidebarOpen ? "left-[238px]" : "left-3",
        )}
        aria-label={desktopSidebarOpen ? "Fechar menu" : "Abrir menu"}
      >
        {desktopSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
      </button>

      <div className="flex justify-end lg:hidden">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen((value) => !value)}
          className="rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground"
        >
          {mobileSidebarOpen ? "Fechar menu" : "Abrir menu"}
        </button>
      </div>

      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 bg-black/30 lg:hidden" onClick={() => setMobileSidebarOpen(false)}>
          <div
            className="absolute left-0 top-0 h-full w-[300px] max-w-[92vw] overflow-y-auto p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <AdminSidebar
              key={`mobile-${pathname}`}
              className="h-full"
              sessionName={sessionName}
              sessionRole={sessionRole}
              logoutAction={logoutAction}
              onNavigate={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-[250px] lg:transition-transform lg:duration-300",
          desktopSidebarOpen ? "lg:translate-x-0" : "lg:-translate-x-full",
        )}
      >
        <AdminSidebar
          key={`desktop-${pathname}`}
          className="h-full rounded-none border-y-0 border-l-0 border-r border-line/80"
          sessionName={sessionName}
          sessionRole={sessionRole}
          logoutAction={logoutAction}
        />
      </div>

      <div
        className={cn(
          "min-w-0 transition-[padding] duration-300",
          desktopSidebarOpen ? "lg:pl-[258px]" : "lg:pl-0",
        )}
      >
        <div
          className={cn(
            "mx-auto w-full px-1 py-1 sm:px-2 lg:px-3",
            isAgendaPage ? "max-w-none" : "max-w-[1040px]",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}