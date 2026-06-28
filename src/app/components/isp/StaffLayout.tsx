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
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar */}
      <div className="w-60 shrink-0 bg-[#0F172A] flex flex-col min-h-screen sticky top-0">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0057B8] flex items-center justify-center">
              <Wifi size={16} className="text-white" />
            </div>
            <div>
              <div style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 700 }} className="text-white text-sm">
                MyConnect
              </div>
              <div className="text-[10px] text-[#64748B] font-medium tracking-wide uppercase">Staff Portal</div>
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
                    ? "bg-[#0057B8] text-white"
                    : "text-[#94A3B8] hover:text-white hover:bg-white/5"
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
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0057B8] flex items-center justify-center text-white text-xs font-semibold">
             {staffInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">{staffName}</div>
              <div className="text-[#64748B] text-[10px]">{staffRole}</div>
            </div>
            <button onClick={() => navigate("/")} className="text-[#64748B] hover:text-white">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <div className="bg-white border-b border-[#E2E8F0] px-8 h-16 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <div>
            <h1 style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 700 }} className="text-[#0F172A] text-lg">
              {title}
            </h1>
            {subtitle && <p className="text-[#64748B] text-xs mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#64748B]">Last updated: just now</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F0FDF4] rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
              <span className="text-[11px] text-[#15803D] font-medium">Live</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
