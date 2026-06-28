import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import type { CustomerProfile } from "./auth";
import { createCustomerNotification } from "./notifications";

export type TicketStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "monitoring"
  | "resolved"
  | "closed";

export type TicketPriority = "low" | "medium" | "high";

export type TicketWorkType =
  | "remote_support"
  | "technician"
  | "monitoring";

export type CustomerTicket = {
  id: string;

  customerUid: string;
  customerName: string;
  customerNumber: string;
  phone: string;
  area: string;
  district: string;
  address: string;
  routerSerial: string;
  packageName: string;

  category: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  workType: TicketWorkType;

  assignedTo?: string | null;
  assignedTechnicianName?: string | null;
  assignedTechnicianPhone?: string | null;
  eta?: string | null;

  photoCount?: number;
  locationNote?: string;

  updates?: TicketUpdate[];

  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type TicketUpdate = {
  text: string;
  by: string;
  status?: TicketStatus;
  createdAt?: Timestamp;
};

function inferWorkType(category: string): TicketWorkType {
  if (category === "password_reset" || category === "payment_not_reflected") {
    return "remote_support";
  }

  if (
    category === "no_internet" ||
    category === "los_light" ||
    category === "router_issue"
  ) {
    return "technician";
  }

  return "monitoring";
}

export async function updateTicketStatus(data: {
  ticketId: string;
  customerUid: string;
  status: TicketStatus;
  note?: string;
  assignedTo?: string;
  assignedTechnicianName?: string;
  assignedTechnicianPhone?: string;
  eta?: string;
  workType?: TicketWorkType;
}) {
  const cleanStatus = data.status.replace("_", " ");

  const updatePayload: Record<string, unknown> = {
    status: data.status,
    updatedAt: serverTimestamp(),
    updates: arrayUnion({
      text: data.note || `Ticket status changed to ${cleanStatus}.`,
      by: "Support Team",
      status: data.status,
      createdAt: Timestamp.now(),
    }),
  };

  if (data.assignedTo !== undefined) {
    updatePayload.assignedTo = data.assignedTo;
  }

  if (data.assignedTechnicianName !== undefined) {
    updatePayload.assignedTechnicianName = data.assignedTechnicianName;
  }

  if (data.assignedTechnicianPhone !== undefined) {
    updatePayload.assignedTechnicianPhone = data.assignedTechnicianPhone;
  }

  if (data.eta !== undefined) {
    updatePayload.eta = data.eta;
  }

  if (data.workType !== undefined) {
    updatePayload.workType = data.workType;
  }

  await updateDoc(doc(db, "tickets", data.ticketId), updatePayload);

  await createCustomerNotification({
    customerUid: data.customerUid,
    type: "ticket",
    title: "Ticket Updated",
    body: data.note || `Your ticket status changed to ${cleanStatus}.`,
    action: `/ticket/${data.ticketId}`,
    relatedId: data.ticketId,
  });
}

  return ticketRef.id;
}

export function listenToTicket(
  ticketId: string,
  callback: (ticket: CustomerTicket | null) => void
): Unsubscribe {
  const ticketRef = doc(db, "tickets", ticketId);

  return onSnapshot(ticketRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    callback({
      id: snapshot.id,
      ...snapshot.data(),
    } as CustomerTicket);
  });
}

export function listenToCustomerTickets(
  customerUid: string,
  callback: (tickets: CustomerTicket[]) => void
): Unsubscribe {
  const ticketsQuery = query(
    collection(db, "tickets"),
    where("customerUid", "==", customerUid),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(ticketsQuery, (snapshot) => {
    callback(
      snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as CustomerTicket[]
    );
  });
}

export function listenToAllTickets(
  callback: (tickets: CustomerTicket[]) => void
): Unsubscribe {
  const ticketsQuery = query(
    collection(db, "tickets"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(ticketsQuery, (snapshot) => {
    callback(
      snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as CustomerTicket[]
    );
  });
}

export async function updateTicketStatus(data: {
  ticketId: string;
  customerUid: string;
  status: TicketStatus;
  note?: string;
  assignedTo?: string;
  assignedTechnicianName?: string;
  assignedTechnicianPhone?: string;
  eta?: string;
  workType?: TicketWorkType;
}) {
  const cleanStatus = data.status.replace("_", " ");

  await updateDoc(doc(db, "tickets", data.ticketId), {
    status: data.status,
    assignedTo: data.assignedTo ?? null,
    assignedTechnicianName: data.assignedTechnicianName ?? null,
    assignedTechnicianPhone: data.assignedTechnicianPhone ?? null,
    eta: data.eta ?? null,
    ...(data.workType ? { workType: data.workType } : {}),
    updatedAt: serverTimestamp(),
    updates: arrayUnion({
      text: data.note || `Ticket status changed to ${cleanStatus}.`,
      by: "Support Team",
      status: data.status,
      createdAt: Timestamp.now(),
    }),
  });

  await createCustomerNotification({
    customerUid: data.customerUid,
    type: "ticket",
    title: "Ticket Updated",
    body: data.note || `Your ticket status changed to ${cleanStatus}.`,
    action: `/ticket/${data.ticketId}`,
    relatedId: data.ticketId,
  });
}

export async function addTicketCustomerComment(data: {
  ticketId: string;
  by: string;
  text: string;
}) {
  await updateDoc(doc(db, "tickets", data.ticketId), {
    updatedAt: serverTimestamp(),
    updates: arrayUnion({
      text: data.text,
      by: data.by,
      createdAt: Timestamp.now(),
    }),
  });
}
