import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  CreditCard,
  MessageSquare,
  Wrench,
} from "lucide-react";
import { Layout } from "../isp/Layout";
import type { CustomerProfile } from "../../../lib/auth";
import {
  listenToUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "../../../lib/notifications";

type NotificationFilter = "all" | "unread" | "tickets" | "network";

function getNotificationIcon(type: AppNotification["type"]) {
  if (type === "ticket") return MessageSquare;
  if (type === "incident") return AlertTriangle;
  if (type === "maintenance") return Wrench;
  if (type === "billing") return CreditCard;
  return Bell;
}

function getNotificationColor(type: AppNotification["type"]) {
  if (type === "ticket") return "bg-[#EBF2FF] text-[#0057B8]";
  if (type === "incident") return "bg-[#FEF2F2] text-[#DC2626]";
  if (type === "maintenance") return "bg-[#FFFBEB] text-[#B45309]";
  if (type === "billing") return "bg-[#FCE7F3] text-[#E5007D]";
  return "bg-[#F8FAFC] text-[#64748B]";
}

function formatNotificationTime(notification: AppNotification) {
  const date = notification.createdAt?.toDate?.();

  if (!date) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function displayNotificationBody(
  notification: AppNotification,
  profile: CustomerProfile | null
) {
  const area = profile?.area || "your area";
  const body = notification.body || "";
  const lower = body.toLowerCase();

  if (lower.includes("status changed to resolved")) {
    return `Maintenance in ${area} has been resolved. Your service should be back to normal.`;
  }

  if (lower.includes("status changed to active")) {
    return `Scheduled maintenance in ${area} is now active. Please follow the ETA shown on Network Status.`;
  }

  if (lower.includes("status changed to monitoring")) {
    return `Our team is monitoring the network update in ${area}. We will notify you when it is resolved.`;
  }

  if (lower.includes("your ticket status changed to")) {
    return body
      .replace("Your ticket status changed to", "Your ticket is now")
      .replace(".", ". We’ll keep you updated.");
  }

  return body;
}

export function NotificationsCenter() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationFilter>("all");

  useEffect(() => {
    const savedProfile = localStorage.getItem("customerProfile");

    if (!savedProfile) {
      navigate("/", { replace: true });
      return;
    }

    try {
      const parsedProfile = JSON.parse(savedProfile) as CustomerProfile;
      setProfile(parsedProfile);

      const unsubscribe = listenToUserNotifications(parsedProfile.uid, (items) => {
        setNotifications(items);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Failed to load customer profile:", error);
      localStorage.removeItem("customerProfile");
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleNotificationClick = async (notification: AppNotification) => {
    await markNotificationRead(notification.id);

    if (notification.action) {
      navigate(notification.action);
      return;
    }

    if (notification.type === "ticket" && notification.relatedId) {
      navigate(`/ticket/${notification.relatedId}`);
      return;
    }

    if (notification.type === "incident" || notification.type === "maintenance") {
      navigate("/service-status");
      return;
    }

    if (notification.type === "billing") {
      navigate("/renewal");
    }
  };

  const handleMarkAllRead = async () => {
    if (!profile) return;
    await markAllNotificationsRead(profile.uid);
  };

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  const filteredNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((notification) => notification.unread);
    }

    if (filter === "tickets") {
      return notifications.filter((notification) => notification.type === "ticket");
    }

    if (filter === "network") {
      return notifications.filter(
        (notification) =>
          notification.type === "incident" || notification.type === "maintenance"
      );
    }

    return notifications;
  }, [filter, notifications]);

  const filterTabs: { key: NotificationFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "tickets", label: "Tickets" },
    { key: "network", label: "Network" },
  ];

  return (
    <Layout showBack backTo="/dashboard" title="Notifications" notificationCount={unreadCount}>
      <div className="px-4 py-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
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

            <p className="text-[#64748B] text-sm mt-1">
              Ticket updates, network incidents, maintenance, and account notices.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-3 py-2 rounded-xl bg-[#EBF2FF] text-[#0057B8] text-xs font-semibold"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
            <p className="text-[#94A3B8] text-xs">Unread</p>
            <p className="text-[#0F172A] text-2xl font-bold mt-1">
              {unreadCount}
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
            <p className="text-[#94A3B8] text-xs">Total</p>
            <p className="text-[#0F172A] text-2xl font-bold mt-1">
              {notifications.length}
            </p>
          </div>
        </div>

        {notifications.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                  filter === tab.key
                    ? "bg-[#E5007D] text-white border-[#E5007D]"
                    : "bg-white text-[#64748B] border-[#E2E8F0]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 text-center text-[#64748B] text-sm">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={26} className="text-[#16A34A]" />
            </div>

            <h3 className="text-[#0F172A] text-base font-bold">
              No notifications yet
            </h3>

            <p className="text-[#64748B] text-sm mt-1">
              Ticket and network updates will appear here.
            </p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 text-center text-[#64748B] text-sm">
            No notifications in this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left bg-white border rounded-2xl p-4 flex items-start gap-3 transition-all ${
                    notification.unread
                      ? "border-[#0057B8] shadow-sm"
                      : "border-[#E2E8F0] hover:border-[#CBD5E1]"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getNotificationColor(
                      notification.type
                    )}`}
                  >
                    <Icon size={19} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[#0F172A] text-sm font-semibold">
                        {notification.title}
                      </p>

                      {notification.unread && (
                        <span className="w-2 h-2 rounded-full bg-[#E5007D] shrink-0 mt-1.5" />
                      )}
                    </div>

                    <p className="text-[#64748B] text-xs mt-1 leading-relaxed">
                      {displayNotificationBody(notification, profile)}
                    </p>

                    <div className="flex items-center gap-1.5 text-[#94A3B8] text-xs mt-2">
                      <Clock size={11} />
                      <span>{formatNotificationTime(notification)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
