import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-brand-background">
      <div className="hidden lg:block">
        <AppSidebar userName={user.nom} userRole={user.role} />
      </div>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
