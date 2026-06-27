import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Search,
  Ticket,
  User,
  WifiOff,
} from "lucide-react";
import { StaffLayout } from "../isp/StaffLayout";
import {
  listenToAllTickets,
  updateTicketStatus,
  type CustomerTicket,
  type TicketStatus,
} from "../../../lib/tickets";

function statusBadgeClass(status: TicketStatus) {
  if (status === "open") {
    return "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]";
  }

  if (status === "assigned") {
    return "bg-[#EBF2FF] text-[#0057B8] border-[#BFDBFE]";
  }

  if (status === "in_progress") {
    return "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]";
  }

  if (status === "resolved") {
    return "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]";
  }

  return "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]";
}

function priorityBadgeClass(priority?: string) {
  if (priority === "high") return "bg-[#FEF2F2] text-[#DC2626]";
  if (priority === "medium") return "bg-[#FFF7ED] text-[#EA580C]";
  return "bg-[#F0FDF4] text-[#15803D]";
}

function formatTimeAgo(ticket: CustomerTicket) {
  const date = ticket.createdAt?.toDate?.();

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

function formatLocation(ticket: CustomerTicket) {
  if (ticket.area && ticket.district) {
    return `${ticket.area}, ${ticket.district}`;
  }

  if (ticket.area) return ticket.area;
  if (ticket.district) return ticket.district;

  return "Location not set";
}

export function StaffTickets() {
  const [tickets, setTickets] = useState<CustomerTicket[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TicketStatus>("all");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = listenToAllTickets(setTickets);

    return () => unsubscribe();
  }, []);

  const filteredTickets = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;

      const matchesSearch =
        cleanSearch.length === 0 ||
        ticket.customerName?.toLowerCase().includes(cleanSearch) ||
        ticket.customerNumber?.toLowerCase().includes(cleanSearch) ||
        ticket.phone?.toLowerCase().includes(cleanSearch) ||
        ticket.title?.toLowerCase().includes(cleanSearch) ||
        ticket.description?.toLowerCase().includes(cleanSearch) ||
        ticket.area?.toLowerCase().includes(cleanSearch) ||
        ticket.district?.toLowerCase().includes(cleanSearch);

      return matchesStatus && matchesSearch;
    });
  }, [tickets, search, statusFilter]);

  const openTickets = useMemo(() => {
    return tickets.filter(
      (ticket) =>
        ticket.status !== "resolved" &&
        ticket.status !== "closed"
    );
  }, [tickets]);

  const highPriorityTickets = useMemo(() => {
    return openTickets.filter((ticket) => ticket.priority === "high");
  }, [openTickets]);

  const resolvedTickets = useMemo(() => {
    return tickets.filter((ticket) => ticket.status === "resolved");
  }, [tickets]);

  const handleStatusChange = async (
    ticket: CustomerTicket,
    status: TicketStatus
  ) => {
    const note = window.prompt(
      `Optional note to customer for marking this ticket as ${status.replace(
        "_",
        " "
      )}:`
    );

    try {
      await updateTicketStatus({
        ticketId: ticket.id,
        customerUid: ticket.customerUid,
        status,
        note: note ?? "",
      });

      setMessage(`Ticket updated to ${status.replace("_", " ")}.`);
    } catch (error) {
      console.error("Failed to update ticket:", error);
      setMessage("Failed to update ticket. Please try again.");
    }
  };

  return (
    <StaffLayout
      title="Customer Tickets"
      subtitle="Manage private customer support issues and service requests"
    >
      <div className="space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
            <p className="text-[#94A3B8] text-xs">Total Tickets</p>
            <p className="text-[#0F172A] text-2xl font-bold mt-1">
              {tickets.length}
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
            <p className="text-[#94A3B8] text-xs">Open</p>
            <p className="text-[#DC2626] text-2xl font-bold mt-1">
              {openTickets.length}
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
            <p className="text-[#94A3B8] text-xs">High Priority</p>
            <p className="text-[#B45309] text-2xl font-bold mt-1">
              {highPriorityTickets.length}
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
            <p className="text-[#94A3B8] text-xs">Resolved</p>
            <p className="text-[#16A34A] text-2xl font-bold mt-1">
              {resolvedTickets.length}
            </p>
          </div>
        </div>

        {message && (
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#475569]">
            {message}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by customer, phone, area, issue..."
                className="w-full pl-9 pr-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder:text-[#CBD5E1] outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 transition"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | TicketStatus)
              }
              className="px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 transition"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Ticket list */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
            <div>
              <p className="text-[#0F172A] text-sm font-semibold">
                Support Tickets
              </p>
              <p className="text-[#94A3B8] text-xs mt-0.5">
                Personal customer issues. These are not public network incidents.
              </p>
            </div>

            <span className="text-[#64748B] text-xs">
              {filteredTickets.length} shown
            </span>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="p-8 text-center">
              <Ticket size={30} className="text-[#94A3B8] mx-auto mb-2" />
              <p className="text-[#64748B] text-sm">
                No tickets found.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          ticket.priority === "high"
                            ? "bg-[#FEF2F2]"
                            : ticket.priority === "medium"
                              ? "bg-[#FFF7ED]"
                              : "bg-[#EBF2FF]"
                        }`}
                      >
                        {ticket.priority === "high" ? (
                          <WifiOff size={21} className="text-[#DC2626]" />
                        ) : (
                          <AlertCircle size={21} className="text-[#0057B8]" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[#0F172A] text-sm font-bold">
                            {ticket.title || ticket.category || "Customer Issue"}
                          </p>

                          <span
                            className={`px-2 py-1 rounded-full border text-[10px] font-semibold ${statusBadgeClass(
                              ticket.status
                            )}`}
                          >
                            {ticket.status.replace("_", " ")}
                          </span>

                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-semibold ${priorityBadgeClass(
                              ticket.priority
                            )}`}
                          >
                            {ticket.priority} priority
                          </span>
                        </div>

                        <p className="text-[#64748B] text-xs mt-2 leading-relaxed">
                          {ticket.description}
                        </p>

                        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 mt-3">
                          <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                            <User size={12} />
                            <span>{ticket.customerName}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                            <Phone size={12} />
                            <span>{ticket.phone}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                            <MapPin size={12} />
                            <span>{formatLocation(ticket)}</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[#64748B] text-xs">
                            <Clock size={12} />
                            <span>{formatTimeAgo(ticket)}</span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-3 text-[#94A3B8] text-xs">
                          <span>Customer No: {ticket.customerNumber}</span>
                          <span>Router: {ticket.routerSerial}</span>
                          <span>Package: {ticket.packageName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0 min-w-[140px]">
                      {ticket.status !== "assigned" && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ticket, "assigned")}
                          className="px-3 py-2 bg-[#EBF2FF] text-[#0057B8] rounded-xl text-xs font-semibold"
                        >
                          Assign
                        </button>
                      )}

                      {ticket.status !== "in_progress" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusChange(ticket, "in_progress")
                          }
                          className="px-3 py-2 bg-[#FFFBEB] text-[#B45309] rounded-xl text-xs font-semibold"
                        >
                          In Progress
                        </button>
                      )}

                      {ticket.status !== "resolved" && (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(ticket, "resolved")}
                          className="px-3 py-2 bg-[#F0FDF4] text-[#15803D] rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                        >
                          <CheckCircle size={13} />
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StaffLayout>
  );
}
