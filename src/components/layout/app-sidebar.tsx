"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  History,
  LogOut,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand/brand-logo";
import type { UserRole } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/resources", label: "Ressources", icon: Package, adminOnly: true },
  { href: "/requests", label: "Demandes", icon: ClipboardList },
  { href: "/history", label: "Historique", icon: History, adminOnly: true },
  { href: "/admin/users", label: "Inscriptions", icon: UserPlus, adminOnly: true },
];

interface AppSidebarProps {
  userName: string;
  userRole: UserRole;
}

export function AppSidebar({ userName, userRole }: AppSidebarProps) {
  const pathname = usePathname();
  const isAdmin = userRole === "admin";
  const filteredNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="brand-gradient-sidebar flex h-full w-64 flex-col text-white">
      <div className="border-b border-white/10 px-5 py-5">
        <BrandLogo size="sm" variant="light" showText />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
          Navigation
        </p>
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/70 hover:bg-white/8 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 rounded-xl bg-white/5 px-3 py-3">
          <p className="truncate text-sm font-medium">{userName}</p>
          <p className="text-xs text-white/55">
            {userRole === "admin" ? "Administrateur" : "Membre"}
          </p>
        </div>
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-2 rounded-xl text-white/70 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </form>
      </div>
    </aside>
  );
}
