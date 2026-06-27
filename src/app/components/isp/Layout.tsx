import { ReactNode, useEffect, useState } from "react";
import type { CustomerProfile } from "../../../lib/auth";
import { listenToUnreadNotificationCount } from "../../../lib/notifications";
import { useNavigate, useLocation } from "react-router";
import {
  Home,
  Activity,
  Headphones,
  User,
  Bell,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { signOut } from "../../../lib/auth";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  backTo?: string;
  notificationCount?: number;
}

const navItems = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Activity, label: "Status", path: "/service-status" },
  { icon: Headphones, label: "Support", path: "/ticket/3021" },
  { icon: User, label: "Account", path: "/subscription" },
];

export function Layout({
  children,
  title,
  showBack = false,
  backTo,
  notificationCount,
}: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [liveNotificationCount, setLiveNotificationCount] = useState(0);

useEffect(() => {
  const savedProfile = localStorage.getItem("customerProfile");

  if (!savedProfile) {
    setLiveNotificationCount(0);
    return;
  }

  try {
    const profile = JSON.parse(savedProfile) as CustomerProfile;

    const unsubscribe = listenToUnreadNotificationCount(
      profile.uid,
      setLiveNotificationCount
    );

    return () => unsubscribe();
  } catch (error) {
    console.error("Failed to load notification count:", error);
    setLiveNotificationCount(0);
  }
}, []);

const displayedNotificationCount =
  notificationCount ?? liveNotificationCount;

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleBack = () => {
    if (backTo) navigate(backTo);
    else navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center">
      <div className="w-full max-w-sm bg-[#F8FAFC] min-h-screen flex flex-col relative">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-white border-b border-[#E2E8F0] px-4 h-14 flex items-center justify-between shrink-0">
          {/* Left side */}
          {showBack ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F1F5F9]"
                title="Back"
              >
                <ArrowLeft size={18} className="text-[#475569]" />
              </button>

              {title && (
                <span
                  style={{
                    fontFamily: "'Inter Tight', system-ui, sans-serif",
                    fontWeight: 700,
                  }}
                  className="text-[#0F172A] text-sm"
                >
                  {title}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0057B8] flex items-center justify-center">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <line
                    x1="12"
                    y1="20"
                    x2="12.01"
                    y2="20"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <span
                style={{
                  fontFamily: "'Inter Tight', system-ui, sans-serif",
                  fontWeight: 700,
                }}
                className="text-[#0F172A] text-sm"
              >
                MyConnect
              </span>
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => navigate("/notifications")}
              className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F1F5F9]"
              title="Notifications"
            >
              <Bell size={18} className="text-[#475569]" />
                {displayedNotificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#DC2626] rounded-full text-white text-[10px] flex items-center justify-center font-medium">
                  {displayedNotificationCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F1F5F9]"
              title="Logout"
            >
              <LogOut size={17} className="text-[#64748B]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-20">{children}</div>

        {/* Bottom nav */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm z-20 bg-white border-t border-[#E2E8F0]">
          <div className="flex">
            {navItems.map(({ icon: Icon, label, path }) => {
              const active =
                location.pathname === path ||
                (path === "/dashboard" && location.pathname === "/");

              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => navigate(path)}
                  className="flex-1 flex flex-col items-center py-3 gap-0.5"
                >
                  <Icon
                    size={20}
                    className={active ? "text-[#0057B8]" : "text-[#94A3B8]"}
                    strokeWidth={active ? 2.5 : 1.5}
                  />

                  <span
                    className={`text-[10px] font-medium ${
                      active ? "text-[#0057B8]" : "text-[#94A3B8]"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="h-safe-area-bottom" />
        </div>
      </div>
    </div>
  );
}
