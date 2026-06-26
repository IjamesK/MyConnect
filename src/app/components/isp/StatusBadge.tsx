type Status = "operational" | "partial" | "down" | "investigating" | "resolved" | "assigned" | "critical" | "maintenance";

interface StatusBadgeProps {
  status: Status;
  pulse?: boolean;
  className?: string;
}

const config: Record<Status, { dot: string; text: string; label: string }> = {
  operational: { dot: "bg-[#16A34A]", text: "text-[#15803D] bg-[#F0FDF4]", label: "Operational" },
  partial: { dot: "bg-[#F59E0B]", text: "text-[#B45309] bg-[#FFFBEB]", label: "Partial Outage" },
  down: { dot: "bg-[#DC2626]", text: "text-[#B91C1C] bg-[#FEF2F2]", label: "Service Down" },
  investigating: { dot: "bg-[#F59E0B]", text: "text-[#B45309] bg-[#FFFBEB]", label: "Investigating" },
  resolved: { dot: "bg-[#16A34A]", text: "text-[#15803D] bg-[#F0FDF4]", label: "Resolved" },
  assigned: { dot: "bg-[#0057B8]", text: "text-[#1D4ED8] bg-[#EBF2FF]", label: "Engineer Assigned" },
  critical: { dot: "bg-[#DC2626]", text: "text-[#B91C1C] bg-[#FEF2F2]", label: "Critical" },
  maintenance: { dot: "bg-[#7C3AED]", text: "text-[#6D28D9] bg-[#F5F3FF]", label: "Maintenance" },
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
    operational: "bg-[#16A34A]",
    partial: "bg-[#F59E0B]",
    down: "bg-[#DC2626]",
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
