import { useState, ElementType } from "react";
import { useNavigate } from "react-router";
import { Layout } from "../isp/Layout";
import { Wrench, CheckCircle, Bell, Ticket, ChevronRight } from "lucide-react";

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

const initialNotifications: Notification[] = [
  {
    id: "1",
    icon: Wrench,
    iconBg: "bg-[#F5F3FF]",
    iconColor: "text-[#7C3AED]",
    title: "Planned Maintenance",
    body: "Naalya fiber upgrade tonight 2:00–5:00 AM. Expect brief interruptions.",
    time: "2h ago",
    unread: true,
    action: "/service-status",
  },
  {
    id: "2",
    icon: Bell,
    iconBg: "bg-[#FFFBEB]",
    iconColor: "text-[#B45309]",
    title: "Subscription Reminder",
    body: "Your FIT 50Mbps plan expires in 14 days. Renew now to avoid disconnection.",
    time: "3h ago",
    unread: true,
    action: "/renewal",
  },
  {
    id: "3",
    icon: Ticket,
    iconBg: "bg-[#EBF2FF]",
    iconColor: "text-[#0057B8]",
    title: "Ticket Update",
    body: "Engineer Patrick M. has been assigned to ticket #INC-3021. ETA: Tomorrow 10AM.",
    time: "5h ago",
    unread: true,
    action: "/ticket/3021",
  },
  {
    id: "4",
    icon: CheckCircle,
    iconBg: "bg-[#F0FDF4]",
    iconColor: "text-[#16A34A]",
    title: "Service Restored",
    body: "Internet service in Kampala East has been fully restored. Normal speeds expected.",
    time: "Yesterday",
    unread: false,
    action: "/service-status",
  },
  {
    id: "5",
    icon: Wrench,
    iconBg: "bg-[#F1F5F9]",
    iconColor: "text-[#475569]",
    title: "Scheduled Maintenance Complete",
    body: "The Kisaasi fiber route upgrade has been completed successfully.",
    time: "2 days ago",
    unread: false,
  },
];

export function NotificationsCenter() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(initialNotifications);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const unreadCount = notifications.filter(n => n.unread).length;
  const todayItems = notifications.filter(n => !["Yesterday", "2 days ago"].includes(n.time));
  const earlierItems = notifications.filter(n => ["Yesterday", "2 days ago"].includes(n.time));

  return (
    <Layout showBack backTo="/dashboard" title="Notifications">
      <div className="px-4 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1
              style={{ fontFamily: "'Inter Tight', system-ui, sans-serif", fontWeight: 800 }}
              className="text-[#0F172A] text-2xl"
            >
              Notifications
            </h1>
            {unreadCount > 0 && (
              <p className="text-[#64748B] text-sm mt-0.5">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-[#0057B8] text-xs font-semibold">
              Mark all read
            </button>
          )}
        </div>

        {/* Today */}
        {todayItems.length > 0 && (
          <div>
            <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wide mb-2">Today</p>
            <div className="space-y-2">
              {todayItems.map(({ id, icon: Icon, iconBg, iconColor, title, body, time, unread, action }) => (
                <button
                  key={id}
                  onClick={() => { markRead(id); if (action) navigate(action); }}
                  className={`w-full text-left p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                    unread ? "bg-white border-[#BFDBFE] shadow-sm" : "bg-white border-[#E2E8F0]"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} className={iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[#0F172A] text-sm font-semibold">{title}</p>
                      {unread && <span className="w-2 h-2 rounded-full bg-[#0057B8] flex-shrink-0" />}
                    </div>
                    <p className="text-[#64748B] text-xs mt-0.5 leading-relaxed">{body}</p>
                    <p className="text-[#94A3B8] text-[10px] mt-1.5">{time}</p>
                  </div>
                  {action && <ChevronRight size={14} className="text-[#CBD5E1] mt-1 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Earlier */}
        {earlierItems.length > 0 && (
          <div>
            <p className="text-[#94A3B8] text-xs font-semibold uppercase tracking-wide mb-2">Earlier</p>
            <div className="space-y-2">
              {earlierItems.map(({ id, icon: Icon, iconBg, iconColor, title, body, time, unread, action }) => (
                <button
                  key={id}
                  onClick={() => { markRead(id); if (action) navigate(action); }}
                  className="w-full text-left p-4 rounded-2xl border bg-white border-[#E2E8F0] flex items-start gap-3"
                >
                  <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 opacity-70`}>
                    <Icon size={18} className={iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#475569] text-sm font-medium">{title}</p>
                    <p className="text-[#94A3B8] text-xs mt-0.5 leading-relaxed">{body}</p>
                    <p className="text-[#CBD5E1] text-[10px] mt-1.5">{time}</p>
                  </div>
                  {action && <ChevronRight size={14} className="text-[#E2E8F0] mt-1 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notification preferences */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[#475569] text-sm font-medium">Notification Settings</p>
            <p className="text-[#94A3B8] text-xs">SMS, email, and push preferences</p>
          </div>
          <button className="text-[#0057B8] text-xs font-semibold">Manage</button>
        </div>
      </div>
    </Layout>
  );
}
