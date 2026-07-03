import { StaffLayout } from "../isp/StaffLayout";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Gauge,
  MapPin,
  Router,
  ServerCog,
  Ticket,
  WifiOff,
} from "lucide-react";

const ticketTrendData = [
  { day: "Mon", opened: 42, resolved: 31 },
  { day: "Tue", opened: 48, resolved: 39 },
  { day: "Wed", opened: 37, resolved: 34 },
  { day: "Thu", opened: 56, resolved: 41 },
  { day: "Fri", opened: 61, resolved: 52 },
  { day: "Sat", opened: 34, resolved: 29 },
  { day: "Sun", opened: 28, resolved: 24 },
];

const issueCategoryData = [
  { name: "No Internet", value: 34, color: "var(--color-danger)" },
  { name: "Slow Speed", value: 26, color: "var(--color-warning)" },
  { name: "LOS Red", value: 18, color: "var(--color-primary)" },
  { name: "Payment", value: 12, color: "var(--color-success)" },
  { name: "Other", value: 10, color: "var(--color-muted)" },
];

const areaData = [
  { area: "Kira", tickets: 46 },
  { area: "Mukono", tickets: 39 },
  { area: "Seeta", tickets: 34 },
  { area: "Ntinda", tickets: 28 },
  { area: "Namugongo", tickets: 22 },
];

const evidenceData = [
  { label: "Speed tests attached", value: 73 },
  { label: "Router lights captured", value: 61 },
  { label: "Photos attached", value: 28 },
  { label: "Location notes added", value: 44 },
];

const operationalMetrics = [
  {
    label: "Open Tickets",
    value: "128",
    sub: "Currently awaiting action",
    icon: Ticket,
    tone: "primary",
  },
  {
    label: "Resolved Today",
    value: "52",
    sub: "Closed by support teams",
    icon: CheckCircle,
    tone: "success",
  },
  {
    label: "Pending Reviews",
    value: "17",
    sub: "Incident reports awaiting approval",
    icon: AlertTriangle,
    tone: "warning",
  },
  {
    label: "Avg. Response Time",
    value: "18m",
    sub: "From customer report to first update",
    icon: Clock,
    tone: "muted",
  },
];

const topOperationalIssues = [
  {
    issue: "No Internet",
    count: 84,
    detail: "Most reports include router-light evidence",
  },
  {
    issue: "Slow speed / buffering",
    count: 63,
    detail: "Speed result attached during ticket submission",
  },
  {
    issue: "LOS red or blinking",
    count: 42,
    detail: "Likely field/OSP escalation",
  },
  {
    issue: "Payment not reflected",
    count: 31,
    detail: "Customer care or finance review",
  },
  {
    issue: "Wi-Fi password / router help",
    count: 26,
    detail: "Can be reduced through Self Help",
  },
];

function toneClasses(tone: string) {
  if (tone === "success") {
    return {
      bg: "bg-[var(--color-success)]/10",
      text: "text-[var(--color-success)]",
      border: "border-[var(--color-success)]/20",
    };
  }

  if (tone === "warning") {
    return {
      bg: "bg-[var(--color-warning)]/10",
      text: "text-[var(--color-warning)]",
      border: "border-[var(--color-warning)]/20",
    };
  }

  if (tone === "primary") {
    return {
      bg: "bg-[var(--color-primary)]/10",
      text: "text-[var(--color-primary)]",
      border: "border-[var(--color-primary)]/20",
    };
  }

  return {
    bg: "bg-[var(--color-surface-soft)]",
    text: "text-[var(--color-muted)]",
    border: "border-[var(--color-border)]",
  };
}

export function AnalyticsDashboard() {
  return (
    <StaffLayout
      title="Analytics"
      subtitle="Operational insights from customer reports, tickets, and self-service activity"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {operationalMetrics.map(({ label, value, sub, icon: Icon, tone }) => {
            const classes = toneClasses(tone);

            return (
              <div
                key={label}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5"
              >
                <div
                  className={`w-10 h-10 rounded-xl border ${classes.bg} ${classes.border} flex items-center justify-center mb-4`}
                >
                  <Icon size={19} className={classes.text} />
                </div>

                <p className="text-[var(--color-muted)] text-xs font-medium uppercase tracking-wide">
                  {label}
                </p>

                <p
                  style={{
                    fontFamily: "'Inter Tight', system-ui, sans-serif",
                    fontWeight: 800,
                  }}
                  className="text-[var(--color-text)] text-3xl mt-2"
                >
                  {value}
                </p>

                <p className="text-[var(--color-muted)] text-xs mt-1.5">
                  {sub}
                </p>
              </div>
            );
          })}
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-[var(--color-text)] text-sm font-semibold">
                Ticket Operations This Week
              </p>
              <p className="text-[var(--color-muted)] text-xs mt-0.5">
                Opened vs resolved tickets across customer-care and network teams
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--color-muted)]">
              <Activity size={14} />
              Live data later from Firestore
            </div>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={ticketTrendData}>
              <defs>
                <linearGradient id="openedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0.18}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0}
                  />
                </linearGradient>

                <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-success)"
                    stopOpacity={0.18}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-success)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
              />

              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: "var(--color-muted)" }}
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tick={{ fontSize: 10, fill: "var(--color-muted)" }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                contentStyle={{
                  background: "var(--color-text)",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "white",
                }}
              />

              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />

              <Area
                type="monotone"
                dataKey="opened"
                name="Opened"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#openedGrad)"
                dot={false}
              />

              <Area
                type="monotone"
                dataKey="resolved"
                name="Resolved"
                stroke="var(--color-success)"
                strokeWidth={2}
                fill="url(#resolvedGrad)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
            <p className="text-[var(--color-text)] text-sm font-semibold mb-1">
              Customer Complaint Categories
            </p>
            <p className="text-[var(--color-muted)] text-xs mb-4">
              Shows which issue types are taking most support attention
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={issueCategoryData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {issueCategoryData.map(({ name, color }) => (
                      <Cell key={name} fill={color} />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={{
                      background: "var(--color-text)",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "white",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex-1 space-y-2">
                {issueCategoryData.map(({ name, value, color }) => (
                  <div key={name} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />

                    <span className="text-[var(--color-muted)] text-xs flex-1">
                      {name}
                    </span>

                    <span className="text-[var(--color-text)] text-xs font-semibold">
                      {value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
            <p className="text-[var(--color-text)] text-sm font-semibold mb-1">
              Top Affected Areas
            </p>
            <p className="text-[var(--color-muted)] text-xs mb-4">
              Helps staff identify locations with repeated customer reports
            </p>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={areaData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                />

                <XAxis
                  dataKey="area"
                  tick={{ fontSize: 10, fill: "var(--color-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{ fontSize: 10, fill: "var(--color-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  contentStyle={{
                    background: "var(--color-text)",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "white",
                  }}
                />

                <Bar
                  dataKey="tickets"
                  name="Tickets"
                  fill="var(--color-primary)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
            <p className="text-[var(--color-text)] text-sm font-semibold mb-4">
              Evidence Captured Before Escalation
            </p>

            <div className="space-y-4">
              {evidenceData.map(({ label, value }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[var(--color-muted)] text-xs">
                      {label}
                    </span>

                    <span className="text-[var(--color-text)] text-xs font-semibold">
                      {value}%
                    </span>
                  </div>

                  <div className="w-full h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-primary)] rounded-full"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 bg-[var(--color-surface-soft)] border border-[var(--color-border)] rounded-xl p-3 flex items-start gap-2">
              <ServerCog
                size={15}
                className="text-[var(--color-primary)] mt-0.5 shrink-0"
              />

              <p className="text-[var(--color-muted)] text-xs leading-relaxed">
                Future GVA Admin integration can attach optical signal, BNG
                session, provisioning status, Wi-Fi state, and Salesforce ticket
                reference automatically.
              </p>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
            <p className="text-[var(--color-text)] text-sm font-semibold mb-4">
              Top Operational Issues
            </p>

            <div className="space-y-3">
              {topOperationalIssues.map(({ issue, count, detail }, index) => (
                <div
                  key={issue}
                  className="border border-[var(--color-border)] rounded-xl p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className="text-[var(--color-muted)] text-xs font-mono w-5">
                        {index + 1}.
                      </span>

                      <div>
                        <p className="text-[var(--color-text)] text-xs font-semibold">
                          {issue}
                        </p>

                        <p className="text-[var(--color-muted)] text-xs mt-0.5">
                          {detail}
                        </p>
                      </div>
                    </div>

                    <span className="text-[var(--color-primary)] text-xs font-bold">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center">
              <Router size={19} className="text-[var(--color-primary)]" />
            </div>

            <div className="flex-1">
              <p className="text-[var(--color-text)] text-sm font-semibold">
                Recommended Admin View Direction
              </p>

              <p className="text-[var(--color-muted)] text-xs mt-1 leading-relaxed">
                This analytics page should help staff see where tickets are
                coming from, which issues are repeating, and whether customer-side
                evidence is being captured before escalation.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-3">
                  <WifiOff size={16} className="text-[var(--color-danger)] mb-2" />
                  <p className="text-[var(--color-text)] text-xs font-semibold">
                    No Internet
                  </p>
                  <p className="text-[var(--color-muted)] text-xs mt-0.5">
                    Prioritize router-light evidence.
                  </p>
                </div>

                <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-3">
                  <Gauge size={16} className="text-[var(--color-warning)] mb-2" />
                  <p className="text-[var(--color-text)] text-xs font-semibold">
                    Slow Speed
                  </p>
                  <p className="text-[var(--color-muted)] text-xs mt-0.5">
                    Attach speed result during submission.
                  </p>
                </div>

                <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-3">
                  <MapPin size={16} className="text-[var(--color-success)] mb-2" />
                  <p className="text-[var(--color-text)] text-xs font-semibold">
                    Area Trends
                  </p>
                  <p className="text-[var(--color-muted)] text-xs mt-0.5">
                    Identify repeated issues by location.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
