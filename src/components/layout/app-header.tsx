import { MobileNav } from "./mobile-nav";
import type { UserRole } from "@/lib/types";

interface AppHeaderProps {
  title: string;
  description?: string;
  userName: string;
  userRole: UserRole;
}

export function AppHeader({ title, description, userName, userRole }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-brand-border-subtle bg-brand-surface/95 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4 px-4 py-5 lg:px-8">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-brand-primary lg:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-brand-text-muted">{description}</p>
          )}
        </div>
        <MobileNav userName={userName} userRole={userRole} />
      </div>
    </header>
  );
}
