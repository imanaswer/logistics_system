"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Briefcase, Plus, FileText, ArrowLeftRight,
  BarChart3, BookOpen, ChevronLeft, LogOut, Menu, X,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  {
    label: "Jobs", icon: Briefcase,
    children: [
      { label: "All Jobs", href: "/jobs" },
      { label: "New Job", href: "/jobs/new" },
    ],
  },
  { label: "Invoices", href: "/invoices", icon: FileText },
  { label: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  {
    label: "Reports", icon: BarChart3,
    children: [
      { label: "Statements", href: "/reports" },
      { label: "Ledger", href: "/reports/ledger" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [username, setUsername] = useState("User");

  useEffect(() => {
    const user = localStorage.getItem("username");
    if (user) setUsername(user);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    if (confirm("Sign out?")) {
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: typeof navItems[0]) => {
    const Icon = item.icon;
    const hasChildren = "children" in item && item.children;
    const active = hasChildren
      ? item.children!.some(c => isActive(c.href))
      : isActive(item.href!);
    const groupOpen = openGroup === item.label;

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            onClick={() => setOpenGroup(groupOpen ? null : item.label)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronLeft className={cn("w-4 h-4 transition-transform", groupOpen && "-rotate-90")} />
              </>
            )}
          </button>
          {!collapsed && groupOpen && (
            <div className="ml-8 mt-1 space-y-0.5">
              {item.children!.map(child => (
                <Link key={child.href} href={child.href}
                  className={cn(
                    "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive(child.href) ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  )}>
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link key={item.href} href={item.href!}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
        )}>
        <Icon className="w-5 h-5 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight">Logistics<span className="text-indigo-600">ERP</span></span>
              <p className="text-[10px] text-muted-foreground leading-none">SPEED INTERNATIONAL</p>
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition hidden lg:block">
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map(renderNavItem)}
      </nav>

      <div className="p-3 border-t">
        <div className={cn("flex items-center gap-3 px-3 py-2", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold uppercase shrink-0">
            {username[0]}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate capitalize">{username}</p>
              <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Online
              </p>
            </div>
          )}
          <button onClick={handleLogout} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg border shadow-sm no-print">
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 no-print">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl">
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col border-r bg-white shrink-0 transition-all duration-200 no-print",
        collapsed ? "w-16" : "w-64"
      )}>
        {sidebarContent}
      </aside>
    </>
  );
}
