import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { verifyAdminSession } from "@/lib/auth";

export const metadata = {
  title: "Panel Admin"
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const token = cookies().get("admin_session")?.value;
  const session = token ? await verifyAdminSession(token) : null;
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="admin-layout">
      <AdminNav />
      <main className="admin-main">{children}</main>
    </div>
  );
}

export const dynamic = "force-dynamic";

