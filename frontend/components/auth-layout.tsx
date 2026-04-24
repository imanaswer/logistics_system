"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { PageSkeleton } from "./ui/loading-skeleton";

const PUBLIC_PATHS = ["/login"];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  const isPublic = PUBLIC_PATHS.includes(pathname);
  const isInvoiceView = pathname.match(/^\/invoices\/\d+\/view$/);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setAuthed(!!token);
    setChecking(false);
  }, [pathname]);

  if (isPublic) return <>{children}</>;

  if (checking) return <PageSkeleton />;

  if (!authed) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return <PageSkeleton />;
  }

  if (isInvoiceView) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-[1400px] mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
