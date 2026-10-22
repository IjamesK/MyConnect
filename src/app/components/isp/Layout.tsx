import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Settings, Home, Activity, Headphones, User, Bell, LogOut,
  ArrowLeft, Wifi, Wrench, ChevronRight,
} from "lucide-react";
import type { CustomerProfile } from "../../../lib/auth";
import { signOut } from "../../../lib/auth";
import { listenToUnreadNotificationCount } from "../../../lib/notifications";
import { useTranslation } from "../../../lib/useTranslation";
import { AIChatWidget } from "./AIChatWidget";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  backTo?: string;
  notificationCount?: number;
}

export function Layout({
  children, title, showBack = false, backTo, notificationCount,
}: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const navItems = [
    { icon: Home, label: t.home, path: "/dashboard" },
    { icon: Activity, label: t.status, path: "/service-status" },
    { icon: Headphones, label: t.report, path: "/report-issue" },
    { icon: User, label: t.account, path: "/subscription" },
  ];
  const desktopNavItems = [...navItems, { icon: Wrench, label: "Self help", path: "/self-help" }];
  const [liveNotificationCount, setLiveNotificationCount] = useState(0);

  useEffect(() => {
    const savedProfile = localStorage.getItem("customerProfile");
    if (!savedProfile) {
      setLiveNotificationCount(0);
      return;
    }
    try {
      const profile = JSON.parse(savedProfile) as CustomerProfile;
      if (!profile.uid) return;
      return listenToUnreadNotificationCount(profile.uid, setLiveNotificationCount);
    } catch (error) {
      console.error("Failed to load notification count:", error);
      setLiveNotificationCount(0);
    }
  }, []);

  const displayedNotificationCount = notificationCount ?? liveNotificationCount;
  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/", { replace: true });
    } catch (error) { console.error("Logout failed:", error); }
  };
  const handleBack = () => backTo ? navigate(backTo) : navigate(-1);
  const isActive = (path: string) => location.pathname === path ||
    (path === "/dashboard" && location.pathname === "/");
  const currentPage = title || desktopNavItems.find(({path}) => isActive(path))?.label || "Customer portal";

  return (
    <div className="min-h-[100dvh] bg-[#F7F8FC] text-[#0F172A]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1440px] bg-[#F7F8FC] lg:border-x lg:border-[#E9EDF3]">
        {/* Desktop navigation replaces the narrow phone-width container. */}
        <aside className="sticky top-0 hidden h-[100dvh] w-60 shrink-0 flex-col border-r border-[#E9EDF3] bg-white lg:flex xl:w-64">
          <div className="flex items-center gap-3 border-b border-[#F1F3F7] px-6 py-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5007D] text-white"><Wifi size={21} /></div>
            <div className="min-w-0">
              <p className="text-base font-extrabold tracking-tight">MyConnect</p>
              <p className="text-[11px] font-medium text-[#64748B]">CanalBox customer portal</p>
            </div>
          </div>
          <nav aria-label="Main navigation" className="flex-1 space-y-1 px-3 py-6">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#94A3B8]">Menu</p>
            {desktopNavItems.map(({icon: Icon, label, path}) => (
              <button key={path} type="button" onClick={() => navigate(path)}
                aria-current={isActive(path) ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E5007D] ${isActive(path) ? "bg-[#FFF0F8] text-[#C30068]" : "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]"}`}>
                <Icon size={19} className="shrink-0" /> <span className="flex-1 truncate">{label}</span>
                {isActive(path) && <ChevronRight size={15} className="shrink-0" />}
              </button>
            ))}
          </nav>
          <div className="border-t border-[#F1F3F7] p-4">
            <button type="button" onClick={() => navigate("/settings")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#64748B] hover:bg-[#F8FAFC]"><Settings size={18} /> Settings</button>
            <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#64748B] hover:bg-[#F8FAFC]"><LogOut size={18} /> Sign out</button>
          </div>
        </aside>

        <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#E9EDF3] bg-white px-4 sm:px-6 lg:h-[76px] lg:px-8">
            <div className="flex min-w-0 items-center gap-2.5">
              {showBack && <button type="button" onClick={handleBack} aria-label="Go back" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#64748B] hover:bg-[#F1F5F9]"><ArrowLeft size={19}/></button>}
              <div className="flex min-w-0 items-center gap-2.5">
                {!showBack && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E5007D] text-white lg:hidden"><Wifi size={17}/></div>}
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-[#0F172A] sm:text-base">{showBack ? currentPage : <><span className="lg:hidden">MyConnect</span><span className="hidden lg:inline">{currentPage}</span></>}</p>
                  <p className="hidden text-[11px] text-[#94A3B8] lg:block">Customer self-service</p>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <button type="button" onClick={() => navigate("/settings")} aria-label="Settings" title="Settings" className="flex h-9 w-9 items-center justify-center rounded-full text-[#64748B] hover:bg-[#F1F5F9] lg:hidden"><Settings size={18}/></button>
              <button type="button" onClick={() => navigate("/notifications")} aria-label="Notifications" title="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#64748B] hover:bg-[#F1F5F9]"><Bell size={19}/>{displayedNotificationCount > 0 && <span className="absolute right-0 top-0 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#DC2626] px-1 text-[9px] font-bold text-white">{displayedNotificationCount > 99 ? "99+" : displayedNotificationCount}</span>}</button>
              <button type="button" onClick={handleLogout} aria-label="Sign out" title="Sign out" className="flex h-9 w-9 items-center justify-center rounded-full text-[#64748B] hover:bg-[#F1F5F9] lg:hidden"><LogOut size={18}/></button>
            </div>
          </header>

          <main className="min-w-0 flex-1 pb-28 lg:pb-10">
            <div className="mx-auto w-full max-w-4xl min-w-0">{children}</div>
          </main>
          <AIChatWidget />

          {/* Phone and tablet bottom tabs; desktop uses the sidebar. */}
          <nav aria-label="Bottom navigation" className="fixed inset-x-0 bottom-0 z-[9999] border-t border-[#E9EDF3] bg-white/95 backdrop-blur lg:hidden">
            <div className="mx-auto flex max-w-3xl items-stretch">
              {navItems.map(({icon: Icon, label, path}) => (
                <button key={path} type="button" onClick={() => navigate(path)} aria-current={isActive(path) ? "page" : undefined}
                  className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-3 text-[11px] font-semibold transition-colors ${isActive(path) ? "text-[#E5007D]" : "text-[#64748B]"}`}>
                  <Icon size={20} strokeWidth={isActive(path) ? 2.4 : 1.75}/><span className="max-w-full truncate">{label}</span>
                </button>
              ))}
            </div>
            <div className="h-[env(safe-area-inset-bottom)]" />
          </nav>
        </div>
      </div>
    </div>
  );
}
