import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Settings,
  Home,
  Activity,
  Headphones,
  User,
  Bell,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import type { CustomerProfile } from "../../../lib/auth";
import { signOut } from "../../../lib/auth";
import { listenToUnreadNotificationCount } from "../../../lib/notifications";
import { useTranslation } from "../../../lib/useTranslation";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  backTo?: string;
  notificationCount?: number;
}

export function Layout({
  children,
  title,
  showBack = false,
  backTo,
  notificationCount,
}: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { icon: Home, label: t.home, path: "/dashboard" },
    { icon: Activity, label: t.status, path: "/service-status" },
    { icon: Headphones, label: "Report", path: "/report-issue" },
    { icon: User, label: t.account, path: "/subscription" },
  ];

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
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center">
      <div className="w-full max-w-sm bg-[var(--color-bg)] min-h-screen flex flex-col relative">
        {/* Top bar */}
        <div className="sticky top-0 z-50 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 h-14 flex items-center justify-between shrink-0">
          {/* Left side */}
          {showBack ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-bg)]"
                title="Back"
              >
                <ArrowLeft size={18} className="text-[var(--color-muted)]" />
              </button>

              {title && (
                <span
                  style={{
                    fontFamily: "'Inter Tight', system-ui, sans-serif",
                    fontWeight: 700,
                  }}
                  className="text-[var(--color-text)] text-sm"
                >
                  {title}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
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
                className="text-[var(--color-text)] text-sm"
              >
                MyConnect
              </span>
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => navigate("/settings")}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-bg)]"
              title="Settings"
            >
              <Settings size={17} className="text-[var(--color-muted)]" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/notifications")}
              className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-bg)]"
              title="Notifications"
            >
              <Bell size={18} className="text-[var(--color-muted)]" />

              {displayedNotificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--color-danger)] rounded-full text-white text-[10px] flex items-center justify-center font-medium">
                  {displayedNotificationCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[var(--color-bg)]"
              title="Logout"
            >
              <LogOut size={17} className="text-[var(--color-muted)]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-28">{children}</div>

        {/* Bottom nav */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm z-[9999] bg-[var(--color-surface)] border-t border-[var(--color-border)] pointer-events-auto">
          <div className="flex pointer-events-auto">
            {navItems.map(({ icon: Icon, label, path }) => {
              const active =
                location.pathname === path ||
                (path === "/dashboard" && location.pathname === "/");

              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => navigate(path)}
                  className="flex-1 flex flex-col items-center py-3 gap-0.5 pointer-events-auto active:bg-[var(--color-bg)]"
                >
                  <Icon
                    size={20}
                    className={
                      active
                        ? "text-[var(--color-primary)]"
                        : "text-[var(--color-muted)]"
                    }
                    strokeWidth={active ? 2.5 : 1.5}
                  />

                  <span
                    className={`text-[10px] font-medium ${
                      active
                        ? "text-[var(--color-primary)]"
                        : "text-[var(--color-muted)]"
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
