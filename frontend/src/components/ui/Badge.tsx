import { clsx } from "@/lib/format";
import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warn" | "danger" | "info";
}) {
  const tones = {
    neutral: "bg-deep/8 text-deep",
    success: "bg-mint/20 text-sea",
    warn: "bg-amber/15 text-amber",
    danger: "bg-coral/15 text-coral",
    info: "bg-foam text-deep",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("skeleton", className)} />;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-display text-xl text-deep">{title}</p>
      <p className="mt-2 max-w-md text-sm text-slate">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
