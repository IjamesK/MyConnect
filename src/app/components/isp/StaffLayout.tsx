import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router";
import { LayoutDashboard, AlertTriangle, Ticket, BarChart3, Settings, LogOut, Wifi, ChevronRight } from "lucide-react";

type StaffProfile = {
  uid?: string;
  email?: string;
  fullName?: string;
  role?: "customer" | "staff" | "admin";
  staffId?: string;
  department?: string;
  position?: string;
};

interface StaffLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/staff" },
  { icon: AlertTriangle, label: "Outages", path: "/staff/outages" },
  { icon: Ticket, label: "Tickets", path: "/staff/tickets" },
  { icon: BarChart3, label: "Analytics", path: "/staff/analytics" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function StaffLayout({ children, title, subtitle }: StaffLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  
  useEffect(() => {
    const savedProfile = localStorage.getItem("customerProfile");
  
    if (!savedProfile) return;
  
    try {
      setProfile(JSON.parse(savedProfile) as StaffProfile);
    } catch (error) {
      console.error("Failed to load staff profile:", error);
    }
  }, []);
  
  const staffName =
    profile?.fullName ||
    profile?.email ||
    "Staff User";
  
  const staffRole =
    profile?.position ||
    profile?.department ||
    profile?.role ||
    "Staff";
  
  const staffInitials = staffName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] text-[var(--color-text)] flex">
      {/* Sidebar */}
      <div className="hidden lg:flex w-60 shrink-0 bg-[var(--color-sidebar-bg)] text-[var(--color-sidebar-text)] flex-col h-[100dvh] sticky top-0 border-r border-[var(--color-border)]">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
              <Wifi size={16} className="text-white" />
            </div>
            <div>
              <div style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 700 }} className="text-[var(--color-sidebar-text)] text-sm">
                MyConnect
              </div>
              <div className="text-[10px] text-[var(--color-muted)] font-medium tracking-wide uppercase">Staff Portal</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path + label}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-sidebar-muted)] hover:text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)]"
                }`}
              >
                <Icon size={16} />
                {label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xs font-semibold">
             {staffInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[var(--color-sidebar-text)] text-xs font-medium truncate">{staffName}</div>
              <div className="text-[var(--color-muted)] text-[10px]">{staffRole}</div>
            </div>
            <button onClick={() => navigate("/")} className="text-[var(--color-sidebar-muted)] hover:text-[var(--color-sidebar-text)]">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 sm:px-6 lg:px-8 min-h-16 py-3 flex items-center justify-between gap-2 shrink-0 sticky top-0 z-10">
          <div>
            <h1 style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 700 }} className="text-[var(--color-text)] text-lg">
              {title}
            </h1>
            {subtitle && <p className="text-[var(--color-muted)] text-xs mt-0.5">{subtitle}</p>}
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-success-soft)] rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success-action)] animate-pulse" />
              <span className="text-[11px] text-[var(--color-success-strong)] font-medium">Live</span>
            </div>
          </div>
        </div>

        {/* Small-screen navigation shares the same theme as the desktop sidebar. */}
        <nav aria-label="Staff navigation" className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 lg:hidden">
          {navItems.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path;
            return <button key={path} type="button" aria-current={active ? "page" : undefined} onClick={() => navigate(path)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${active ? "bg-[var(--color-surface-soft)] text-[var(--color-primary-text)]" : "text-[var(--color-muted)] hover:bg-[var(--color-hover)]"}`}>
              <Icon size={15}/>{label}
            </button>;
          })}
        </nav>
        {/* Page content */}
        <div className="flex-1 min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-8 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
