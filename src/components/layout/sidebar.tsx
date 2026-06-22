"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wand2, ScanSearch, LayoutGrid, Gem } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Мои проекты", icon: LayoutDashboard },
  { href: "/generator", label: "Создать карточку", icon: Wand2 },
  { href: "/infographics", label: "Инфографика", icon: LayoutGrid },
  { href: "/analysis", label: "Анализ и улучшение", icon: ScanSearch },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card/50 md:flex">
      <Link href="/" className="flex items-center gap-2 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-500 text-white shadow-md">
          <Gem className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">WB Card Studio</div>
          <div className="text-xs text-muted-foreground">AI для карточек</div>
        </div>
      </Link>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 pb-5">
        <div className="rounded-xl border bg-card/60 p-3 text-xs text-muted-foreground">
          Загрузите фото товара, получите идеи и сгенерируйте премиальную карточку.
        </div>
      </div>
    </aside>
  );
}
