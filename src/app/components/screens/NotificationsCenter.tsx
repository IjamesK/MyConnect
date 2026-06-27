import {
  listenToUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "../../../lib/notifications";
import { useEffect, useState, type ElementType } from "react";
import { useNavigate } from "react-router";
import { Layout } from "../isp/Layout";
import {
  Wrench,
  CheckCircle,
  Bell,
  Ticket,
  ChevronRight,
  CreditCard,
  Router,
} from "lucide-react";
import type { CustomerProfile } from "../../../lib/auth";

interface Notification {
  id: string;
  icon: ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  action?: string;
}

function getDaysLeft(expiryDate: string) {
  const today = new Date();
  const expiry = new Date(expiryDate);

  const difference = expiry.getTime() - today.getTime();
  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

function formatCurrency(amount: number) {
  return `UGX ${amount.toLocaleString()}`;
}

function buildNotifications(profile: CustomerProfile): Notification[] {
  const daysLeft = getDaysLeft(profile.expiryDate);

  return [
    {
      id: "subscription-reminder",
      icon: CreditCard,
      iconBg: "bg-[#FFFBEB]",
      iconColor: "text-[#B45309]",
      title: daysLeft > 0 ? "Subscription Reminder" : "Subscription Expired",
      body:
        daysLeft > 0
          ? `Your ${profile.packageName} plan expires in ${daysLeft} day${
              daysLeft === 1 ? "" : "s"
            }. Renew ${formatCurrency(profile.packagePrice)} to avoid disconnection.`
          : `Your ${profile.packageName} plan expired on ${profile.expiryDate}. Renew now to restore service.`,
      time: "Today",
      unread: true,
      action: "/renewal",
    },
    {
      id: "router-linked",
      icon: Router,
      iconBg: "bg-[#EBF2FF]",
      iconColor: "text-[#0057B8]",
      title: "Router Linked",
      body: `${profile.routerModel} with serial number ${profile.routerSerial} is linked to your account.`,
      time: "Today",
      unread: true,
      action: "/subscription",
    },
    {
      id: "service-location",
      icon: CheckCircle,
      iconBg: "bg-[#F0FDF4]",
      iconColor: "text-[#16A34A]",
      title: "Service Location Verified",
      body: `Your service location is registered as ${profile.area}, ${profile.district}.`,
      time: "Today",
      unread: false,
      action: "/subscription",
    },
    {
      id: "support-ready",
      icon: Ticket,
      iconBg: "bg-[#FCE7F3]",
      iconColor: "text-[#E5007D]",
      title: "Support Ready",
      body: `Need help with your connection? You can report an issue for customer account ${profile.customerNumber}.`,
      time: "Earlier",
      unread: false,
      action: "/report-issue",
    },
    {
      id: "maintenance-note",
      icon: Wrench,
      iconBg: "bg-[#F1F5F9]",
      iconColor: "text-[#475569]",
      title: "Network Status",
      body: `We will show outage or maintenance updates affecting ${profile.area} here when available.`,
      time: "Earlier",
      unread: false,
      action: "/service-status",
    },
  ];
}

export function NotificationsCenter() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
  const savedProfile = localStorage.getItem("customerProfile");

  if (!savedProfile) {
    navigate("/", { replace: true });
    return;
  }

  try {
    const parsedProfile = JSON.parse(savedProfile) as CustomerProfile;
    setProfile(parsedProfile);

    const unsubscribe = listenToUserNotifications(
      parsedProfile.uid,
      setNotifications
    );

    return () => unsubscribe();
  } catch (error) {
    console.error("Failed to load customer profile:", error);
    localStorage.removeItem("customerProfile");
    navigate("/", { replace: true });
  }
}, [navigate]);

const handleMarkAllRead = async () => {
  if (!profile) return;
  await markAllNotificationsRead(profile.uid);
};

  if (!profile) {
    return (
      <Layout showBack backTo="/dashboard" title="Notifications">
        <div className="px-4 py-10 text-center text-[#64748B] text-sm">
          Loading notifications...
        </div>
      </Layout>
    );
  }

  const unreadCount = notifications.filter((n) => n.unread).length;
  const todayItems = notifications.filter((n) => n.time === "Today");
  const earlierItems = notifications.filter((n) => n.time !== "Today");

  return (
    <Layout
      showBack
      backTo="/dashboard"
      title="Notifications"
      notificationCount={unreadCount}
    >
      <div className="px-4 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1
              style={{
                fontFamily: "'Inter Tight', system-ui, sans-serif",
                fontWeight: 800,
              }}
              className="text-[#0F172A] text-2xl"
            >
              Notifications
            </h1>

            {unreadCount > 0 ? (
              <p className="text-[#64748B] text-sm mt-0.5">
                {unreadCount} unread
              </p>
            ) : (
              <p className="text-[#64748B] text-sm mt-0.5">
                All caught up
              </p>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-[#0057B8] text-xs font-semibold"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Today */}
        {todayItems.length > 0 && (
          <div>
            <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wide mb-2">
              Today
            </p>

            <div className="space-y-2">
              {todayItems.map(
                ({
                  id,
                  icon: Icon,
                  iconBg,
                  iconColor,
                  title,
                  body,
                  time,
                  unread,
                  action,
                }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      markRead(id);
                      if (action) navigate(action);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                      unread
                        ? "bg-white border-[#BFDBFE] shadow-sm"
                        : "bg-white border-[#E2E8F0]"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon size={18} className={iconColor} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[#0F172A] text-sm font-semibold">
                          {title}
                        </p>

                        {unread && (
                          <span className="w-2 h-2 rounded-full bg-[#0057B8] flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-[#64748B] text-xs mt-0.5 leading-relaxed">
                        {body}
                      </p>

                      <p className="text-[#94A3B8] text-[10px] mt-1.5">
                        {time}
                      </p>
                    </div>

                    {action && (
                      <ChevronRight
                        size={14}
                        className="text-[#CBD5E1] mt-1 flex-shrink-0"
                      />
                    )}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Earlier */}
        {earlierItems.length > 0 && (
          <div>
            <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wide mb-2">
              Earlier
            </p>

            <div className="space-y-2">
              {earlierItems.map(
                ({
                  id,
                  icon: Icon,
                  iconBg,
                  iconColor,
                  title,
                  body,
                  time,
                  action,
                }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={async () => {
                        await markNotificationRead(id);
                        if (action) navigate(action);
                    }}
                    className="w-full text-left p-4 rounded-2xl border bg-white border-[#E2E8F0] flex items-start gap-3"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 opacity-70`}
                    >
                      <Icon size={18} className={iconColor} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[#475569] text-sm font-medium">
                        {title}
                      </p>

                      <p className="text-[#94A3B8] text-xs mt-0.5 leading-relaxed">
                        {body}
                      </p>

                      <p className="text-[#CBD5E1] text-[10px] mt-1.5">
                        {time}
                      </p>
                    </div>

                    {action && (
                      <ChevronRight
                        size={14}
                        className="text-[#E2E8F0] mt-1 flex-shrink-0"
                      />
                    )}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Notification preferences */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[#475569] text-sm font-medium">
              Notification Settings
            </p>

            <p className="text-[#94A3B8] text-xs">
              SMS reminders will be sent to {profile.phone}
            </p>
          </div>

          <button
            type="button"
            className="text-[#0057B8] text-xs font-semibold"
          >
            Manage
          </button>
        </div>
      </div>
    </Layout>
  );
}
