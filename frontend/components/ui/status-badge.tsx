import { cn } from "@/lib/utils";

type BadgeVariant = "pending" | "active" | "completed" | "cancelled" | "paid" | "unpaid" | "partial"
  | "credit" | "debit" | "sea" | "air" | "land" | "invoice";

const variants: Record<BadgeVariant, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  active: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  unpaid: "bg-rose-100 text-rose-700 border-rose-200",
  partial: "bg-amber-100 text-amber-700 border-amber-200",
  credit: "bg-emerald-100 text-emerald-700 border-emerald-200",
  debit: "bg-rose-100 text-rose-700 border-rose-200",
  sea: "bg-cyan-100 text-cyan-700 border-cyan-200",
  air: "bg-indigo-100 text-indigo-700 border-indigo-200",
  land: "bg-orange-100 text-orange-700 border-orange-200",
  invoice: "bg-purple-100 text-purple-700 border-purple-200",
};

interface StatusBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
