"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: { value: number; label: string };
  className?: string;
  variant?: "default" | "success" | "danger" | "info";
}

const variantStyles = {
  default: "bg-white border-slate-200",
  success: "bg-emerald-50 border-emerald-200",
  danger: "bg-rose-50 border-rose-200",
  info: "bg-indigo-50 border-indigo-200",
};

const iconVariantStyles = {
  default: "bg-slate-100 text-slate-600",
  success: "bg-emerald-100 text-emerald-600",
  danger: "bg-rose-100 text-rose-600",
  info: "bg-indigo-100 text-indigo-600",
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, className, variant = "default" }: StatCardProps) {
  return (
    <div className={cn("p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow", variantStyles[variant], className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn("p-2.5 rounded-lg", iconVariantStyles[variant])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className={cn("text-xs font-semibold px-1.5 py-0.5 rounded",
            trend.value >= 0 ? "text-emerald-700 bg-emerald-100" : "text-rose-700 bg-rose-100"
          )}>
            {trend.value >= 0 ? "+" : ""}{trend.value}%
          </span>
          <span className="text-xs text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
