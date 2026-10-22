type Status = "operational" | "partial" | "down" | "investigating" | "resolved" | "assigned" | "critical" | "maintenance";

interface StatusBadgeProps {
  status: Status;
  pulse?: boolean;
  className?: string;
}

const config: Record<Status, { dot: string; text: string; label: string }> = {
  operational: { dot: "bg-[var(--color-success-action)]", text: "text-[var(--color-success-strong)] bg-[var(--color-success-soft)]", label: "Operational" },
  partial: { dot: "bg-[var(--color-warning-action)]", text: "text-[var(--color-warning-text)] bg-[var(--color-warning-soft)]", label: "Partial Outage" },
  down: { dot: "bg-[var(--color-danger-action)]", text: "text-[var(--color-danger-strong)] bg-[var(--color-danger-soft)]", label: "Service Down" },
  investigating: { dot: "bg-[var(--color-warning-action)]", text: "text-[var(--color-warning-text)] bg-[var(--color-warning-soft)]", label: "Investigating" },
  resolved: { dot: "bg-[var(--color-success-action)]", text: "text-[var(--color-success-strong)] bg-[var(--color-success-soft)]", label: "Resolved" },
  assigned: { dot: "bg-[var(--color-primary)]", text: "text-[var(--color-primary-dark)] bg-[var(--color-surface-soft)]", label: "Engineer Assigned" },
  critical: { dot: "bg-[var(--color-danger-action)]", text: "text-[var(--color-danger-strong)] bg-[var(--color-danger-soft)]", label: "Critical" },
  maintenance: { dot: "bg-[var(--color-primary)]", text: "text-[var(--color-primary-dark)] bg-[var(--color-surface-soft)]", label: "Maintenance" },
};

export function StatusBadge({ status, pulse = false, className = "" }: StatusBadgeProps) {
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.text} ${className}`}>
      <span className={`relative flex h-2 w-2`}>
        {pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${c.dot} opacity-60`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${c.dot}`} />
      </span>
      {c.label}
    </span>
  );
}

interface StatusDotProps {
  status: "operational" | "partial" | "down";
  pulse?: boolean;
}

export function StatusDot({ status, pulse = false }: StatusDotProps) {
  const colors = {
    operational: "bg-[var(--color-success-action)]",
    partial: "bg-[var(--color-warning-action)]",
    down: "bg-[var(--color-danger-action)]",
  };
  return (
    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
      {pulse && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[status]} opacity-60`} />
      )}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[status]}`} />
    </span>
  );
}
