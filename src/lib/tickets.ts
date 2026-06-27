import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { CustomerProfile } from "./auth";
import { createCustomerNotification } from "./notifications";

export type TicketStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed";

export type TicketPriority = "low" | "medium" | "high";

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
  assignedTo?: string | null;
  photoCount?: number;
  locationNote?: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
};

export async function createTicket(
  profile: CustomerProfile,
  data: {
    category: string;
    title: string;
    description: string;
    priority: TicketPriority;
    photoCount?: number;
    locationNote?: string;
  }
) {
  const ticketRef = await addDoc(collection(db, "tickets"), {
    customerUid: profile.uid,
    customerName: profile.fullName,
    customerNumber: profile.customerNumber,
    phone: profile.phone,
    area: profile.area,
    district: profile.district,
    address: profile.address,
    routerSerial: profile.routerSerial,
    packageName: profile.packageName,

    category: data.category,
    title: data.title,
    description: data.description,
    priority: data.priority,
    photoCount: data.photoCount ?? 0,
    locationNote: data.locationNote ?? "",

    status: "open",
    assignedTo: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await createCustomerNotification({
    customerUid: profile.uid,
    type: "ticket",
    title: "Ticket Created",
    body: `Your ticket has been submitted. Reference: ${ticketRef.id}`,
    action: `/ticket/${ticketRef.id}`,
    relatedId: ticketRef.id,
  });

  return ticketRef.id;
}

export async function updateTicketStatus(data: {
  ticketId: string;
  customerUid: string;
  status: TicketStatus;
  note?: string;
  assignedTo?: string;
}) {
  await updateDoc(doc(db, "tickets", data.ticketId), {
    status: data.status,
    assignedTo: data.assignedTo ?? null,
    lastNote: data.note ?? "",
    updatedAt: serverTimestamp(),
  });

  await createCustomerNotification({
    customerUid: data.customerUid,
    type: "ticket",
    title: "Ticket Updated",
    body: data.note
      ? data.note
      : `Your ticket status changed to ${data.status.replace("_", " ")}.`,
    action: `/ticket/${data.ticketId}`,
    relatedId: data.ticketId,
  });
}

export function listenToCustomerTickets(
  customerUid: string,
  callback: (tickets: CustomerTicket[]) => void
) {
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

export function listenToAllTickets(callback: (tickets: CustomerTicket[]) => void) {
  const ticketsQuery = query(collection(db, "tickets"), orderBy("createdAt", "desc"));

  return onSnapshot(ticketsQuery, (snapshot) => {
    callback(
      snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as CustomerTicket[]
    );
  });
}
