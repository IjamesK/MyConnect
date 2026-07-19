import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  limit,
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
import type { SpeedTestResult } from "./speedTest";
import type { RouterLightCheck } from "./routerTypes";
import type { MoveEligibilityCheck } from "./eligibility";

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
  | "monitoring"
  | "site_survey";

export type TicketUpdate = {
  text: string;
  by: string;
  status?: TicketStatus;
  createdAt?: Timestamp;
};

export type TicketSpeedTest = SpeedTestResult;
export type TicketRouterLightCheck = RouterLightCheck;
export type TicketEligibilityCheck = MoveEligibilityCheck;

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
  speedTest?: TicketSpeedTest | null;
  routerLightCheck?: TicketRouterLightCheck | null;
  eligibilityCheck?: TicketEligibilityCheck | null;

  updates?: TicketUpdate[];

  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export type RelatedTicketBlock = {
  ticket: CustomerTicket;
  title: string;
  message: string;
  suggestedUpdate: string;
};

function ticketStatusLabel(status: TicketStatus) {
  if (status === "in_progress") return "in progress";
  return status.replace("_", " ");
}

function inferWorkType(category: string): TicketWorkType {
  if (category === "password_reset" || category === "payment_not_reflected" || category === "wrong_router_payment") {
    return "remote_support";
  }

  if (category === "move_eligibility") {
    return "site_survey";
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

const CLOSED_TICKET_STATUSES = new Set(["resolved", "closed", "cancelled"]);
const INTERNET_TICKET_CATEGORIES = new Set([
  "no_internet",
  "los_light",
  "router_issue",
  "slow_speed",
]);
const PAYMENT_TICKET_CATEGORIES = new Set([
  "payment_not_reflected",
  "wrong_router_payment",
]);

function ticketCategoryLabel(category: string) {
  if (category === "no_internet") return "No Internet";
  if (category === "los_light") return "LOS Light Red";
  if (category === "router_issue") return "Router / Wi-Fi Issue";
  if (category === "slow_speed") return "Slow Speed";
  if (category === "payment_not_reflected") return "Payment Not Reflected";
  if (category === "wrong_router_payment") return "Paid on Wrong Router";
  if (category === "password_reset") return "Wi-Fi Password Reset";
  if (category === "move_eligibility") return "Moving / Location Check";
  if (category === "other") return "Other Account Issue";
  return "Customer Issue";
}

function isActiveTicket(status: string) {
  return !CLOSED_TICKET_STATUSES.has(status);
}

function isRelatedTicket(existingCategory: string, newCategory: string) {
  if (INTERNET_TICKET_CATEGORIES.has(existingCategory) && INTERNET_TICKET_CATEGORIES.has(newCategory)) {
    return true;
  }

  if (PAYMENT_TICKET_CATEGORIES.has(existingCategory) && PAYMENT_TICKET_CATEGORIES.has(newCategory)) {
    return existingCategory === newCategory;
  }

  if (newCategory === "move_eligibility") {
    return existingCategory === "move_eligibility";
  }

  if (newCategory === "password_reset") {
    return existingCategory === "password_reset";
  }

  return existingCategory === newCategory && newCategory !== "other";
}

function buildRelatedTicketBlock(ticket: CustomerTicket, newCategory: string): RelatedTicketBlock {
  const existingLabel = ticketCategoryLabel(ticket.category);
  const newLabel = ticketCategoryLabel(newCategory);

  if (INTERNET_TICKET_CATEGORIES.has(ticket.category) && INTERNET_TICKET_CATEGORIES.has(newCategory)) {
    const restoredCopy = ticket.status === "monitoring"
      ? "Your connection is still under monitoring, so this should be added as an update to the current ticket."
      : "Please track the current ticket or add an update if anything has changed.";

    return {
      ticket,
      title: "Open connection ticket found",
      message: `You already have an open ${existingLabel} ticket. A new ${newLabel} ticket will not be created because it is related to the same connection issue. ${restoredCopy}`,
      suggestedUpdate: `Customer tried to report ${newLabel}.`,
    };
  }

  if (PAYMENT_TICKET_CATEGORIES.has(ticket.category) && PAYMENT_TICKET_CATEGORIES.has(newCategory)) {
    return {
      ticket,
      title: "Open payment ticket found",
      message: `You already have an open ${existingLabel} ticket. Please add any new payment details to the existing ticket instead of creating another one.`,
      suggestedUpdate: `Customer has additional details for ${newLabel}.`,
    };
  }

  if (newCategory === "move_eligibility") {
    return {
      ticket,
      title: "Open move request found",
      message: "You already have an open move/location request. Please track that request or add an update if the new location details changed.",
      suggestedUpdate: "Customer has additional details for the move/location request.",
    };
  }

  if (newCategory === "password_reset") {
    return {
      ticket,
      title: "Open password request found",
      message: "You already have an open Wi-Fi password request. Please track that ticket or add an update if support needs more information.",
      suggestedUpdate: "Customer has additional details for the Wi-Fi password request.",
    };
  }

  return {
    ticket,
    title: "Open related ticket found",
    message: `You already have an open ${existingLabel} ticket. Please track the existing ticket or add an update instead of creating another one.`,
    suggestedUpdate: `Customer tried to report ${newLabel}.`,
  };
}

export async function findActiveRelatedTicket(
  customerUid: string,
  newCategory: string,
): Promise<RelatedTicketBlock | null> {
  const ticketsQuery = query(
    collection(db, "tickets"),
    where("customerUid", "==", customerUid),
    orderBy("createdAt", "desc"),
    limit(30),
  );

  const snapshot = await getDocs(ticketsQuery);

  const relatedTicket = snapshot.docs
    .map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }) as CustomerTicket)
    .find((ticket) =>
      isActiveTicket(ticket.status) && isRelatedTicket(ticket.category, newCategory),
    );

  return relatedTicket ? buildRelatedTicketBlock(relatedTicket, newCategory) : null;
}

export async function createTicket(
  profile: CustomerProfile,
  data: {
    category: string;
    title: string;
    description: string;
    priority: TicketPriority;
    workType?: TicketWorkType;
    photoCount?: number;
    locationNote?: string;
    speedTest?: TicketSpeedTest | null;
    routerLightCheck?: TicketRouterLightCheck | null;
    eligibilityCheck?: TicketEligibilityCheck | null;
  }
) {
  const workType = data.workType ?? inferWorkType(data.category);

  const ticketRef = await addDoc(collection(db, "tickets"), {
    customerUid: profile.uid,
    customerName: profile.fullName,
    customerNumber: profile.customerNumber ?? "",
    phone: profile.phone ?? "",
    area: profile.area ?? "",
    district: profile.district ?? "",
    address: profile.address ?? "",
    routerSerial: profile.routerSerial ?? "",
    packageName: profile.packageName ?? "",

    category: data.category,
    title: data.title,
    description: data.description,
    priority: data.priority,
    workType,

    status: "open",
    assignedTo: null,
    assignedTechnicianName: null,
    assignedTechnicianPhone: null,
    eta: null,

    photoCount: data.photoCount ?? 0,
    locationNote: data.locationNote ?? "",
    speedTest: data.speedTest ?? null,
    routerLightCheck: data.routerLightCheck ?? null,
    eligibilityCheck: data.eligibilityCheck ?? null,

    updates: [
      {
        text: "Ticket submitted successfully.",
        by: "System",
        status: "open",
        createdAt: Timestamp.now(),
      },
    ],

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await createCustomerNotification({
    customerUid: profile.uid,
    type: "ticket",
    title: data.category === "move_eligibility" ? "Move Request Created" : "Ticket Created",
    body:
      data.category === "move_eligibility"
        ? `Your move request has been submitted with location details. Reference: ${ticketRef.id}`
        : `Your ticket has been submitted. Reference: ${ticketRef.id}`,
    action: `/ticket/${ticketRef.id}`,
    relatedId: ticketRef.id,
  });

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
  const cleanStatus = ticketStatusLabel(data.status);

  const updatePayload: Record<string, unknown> = {
    status: data.status,
    updatedAt: serverTimestamp(),
    updates: arrayUnion({
      text: data.note || `Ticket is now ${cleanStatus}.`,
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
    body: data.note || `Your ticket is now ${cleanStatus}. We’ll keep you updated.`,
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
