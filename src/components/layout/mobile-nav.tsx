"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ClipboardList, History, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AppSidebar } from "./app-sidebar";
import type { UserRole } from "@/lib/types";

interface MobileNavProps {
  userName: string;
  userRole: UserRole;
}

export function MobileNav({ userName, userRole }: MobileNavProps) {
  const pathname = usePathname();

  const quickLinks = [
    { href: "/dashboard", icon: LayoutDashboard },
    { href: "/requests", icon: ClipboardList },
    { href: "/history", icon: History },
    ...(userRole === "admin" ? [{ href: "/resources", icon: Package }] : []),
  ];

  return (
    <div className="flex items-center gap-2 lg:hidden">
      <Sheet>
        <SheetTrigger
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-brand-surface hover:bg-brand-background-subtle"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5 text-brand-primary" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <AppSidebar userName={userName} userRole={userRole} />
        </SheetContent>
      </Sheet>

      <div className="flex gap-1">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                size="icon"
                className={
                  isActive
                    ? "bg-brand-primary text-white hover:bg-brand-primary-hover"
                    : "text-brand-text-muted"
                }
              >
                <Icon className="h-4 w-4" />
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
