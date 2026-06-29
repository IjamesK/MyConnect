import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
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

export function listenToPublicIncident(
  incidentId: string,
  callback: (incident: PublicIncident | null) => void,
) {
  const incidentRef = doc(db, "incidents", incidentId);

  return onSnapshot(incidentRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    callback({
      id: snapshot.id,
      ...snapshot.data(),
    } as PublicIncident);
  });
}

export type IncidentReportStatus = "pending_review" | "approved" | "rejected";

export type IncidentStatus =
  "scheduled" | "active" | "monitoring" | "resolved" | "cancelled";

export type IncidentType =
  | "outage"
  | "fiber_cut"
  | "knocked_pole"
  | "damaged_cabinet"
  | "maintenance"
  | "upgrade"
  | "area_outage"
  | "other";

export type IncidentSeverity = "low" | "medium" | "high";

export type IncidentReport = {
  id: string;
  reporterUid: string;
  reporterName: string;
  phone: string;
  customerNumber: string;
  area: string;
  district: string;
  address: string;
  routerSerial: string;
  type: IncidentType;
  title: string;
  description: string;
  photoCount?: number;
  locationNote?: string;
  status: IncidentReportStatus;
  linkedIncidentId?: string | null;
  createdAt?: Timestamp | null;
  seenAt?: Timestamp | null;
  seenBy?: string | null;
  seenByName?: string | null;
  reviewedAt?: Timestamp | null;
  reviewedBy?: string | null;
};

export type PublicIncident = {
  id: string;
  title: string;
  description: string;
  type: IncidentType;
  status: IncidentStatus;
  severity: IncidentSeverity;
  affectedAreas: string[];
  affectedDistricts: string[];
  affectedAreaKeys: string[];
  sourceReportId?: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  startsAt?: Timestamp | null;
  estimatedResolution?: string;
};

function areaKey(district: string, area: string) {
  return `${district.trim().toLowerCase()}/${area.trim().toLowerCase()}`;
}

function incidentNotificationType(type: IncidentType) {
  if (type === "maintenance" || type === "upgrade") return "maintenance";
  return "incident";
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function isNetworkWideIncident(affectedAreaKeys: string[]) {
  return (
    affectedAreaKeys.includes("all/all") ||
    affectedAreaKeys.includes("network/all")
  );
}

async function getAffectedCustomerUids(affectedAreaKeys: string[]) {
  const usersSnapshot = await getDocs(collection(db, "users"));

  return usersSnapshot.docs
    .filter((userDoc) => {
      const user = userDoc.data();

      const role = String(user.role ?? "")
        .trim()
        .toLowerCase();
      if (role && role !== "customer") return false;

      if (isNetworkWideIncident(affectedAreaKeys)) return true;

      const customerAreaKey = areaKey(
        String(user.district ?? ""),
        String(user.area ?? ""),
      );

      return affectedAreaKeys.includes(customerAreaKey);
    })
    .map((userDoc) => userDoc.id);
}

async function notifyAffectedCustomers(data: {
  incidentId: string;
  type: IncidentType;
  title: string;
  body: string;
  affectedAreaKeys: string[];
}) {
  const customerUids = await getAffectedCustomerUids(data.affectedAreaKeys);

  await Promise.all(
    customerUids.map((customerUid) =>
      createCustomerNotification({
        customerUid,
        type: incidentNotificationType(data.type),
        title: data.title,
        body: data.body,
        action: "/service-status",
        relatedId: data.incidentId,
      }),
    ),
  );

  return customerUids.length;
}

export async function createIncidentReport(
  profile: CustomerProfile,
  data: {
    type: IncidentType;
    title: string;
    description: string;
    photoCount?: number;
    locationNote?: string;
  },
) {
  const reportRef = await addDoc(collection(db, "incidentReports"), {
    reporterUid: profile.uid,
    reporterName: profile.fullName,
    phone: profile.phone ?? "",
    customerNumber: profile.customerNumber ?? "",
    area: profile.area ?? "",
    district: profile.district ?? "",
    address: profile.address ?? "",
    routerSerial: profile.routerSerial ?? "",

    type: data.type,
    title: data.title,
    description: data.description,
    photoCount: data.photoCount ?? 0,
    locationNote: data.locationNote ?? "",

    status: "pending_review",
    linkedIncidentId: null,
    createdAt: serverTimestamp(),

    seenAt: null,
    seenBy: null,
    seenByName: null,

    reviewedAt: null,
    reviewedBy: null,
  });

  return reportRef.id;
}

export async function markIncidentReportSeen(data: {
  reportId: string;
  seenBy: string;
  seenByName?: string;
}) {
  await updateDoc(doc(db, "incidentReports", data.reportId), {
    seenAt: serverTimestamp(),
    seenBy: data.seenBy,
    seenByName: data.seenByName ?? data.seenBy,
  });
}

export async function approveIncidentReport(data: {
  reportId: string;
  reviewedBy: string;
  title: string;
  description: string;
  type: IncidentType;
  severity: IncidentSeverity;
  affectedAreas: string[];
  affectedDistricts: string[];
}) {
  const affectedAreaKeys = data.affectedDistricts.flatMap((district) =>
    data.affectedAreas.map((area) => areaKey(district, area)),
  );

  const incidentRef = await addDoc(collection(db, "incidents"), {
    title: data.title,
    description: data.description,
    type: data.type,
    severity: data.severity,
    status: "active",
    affectedAreas: data.affectedAreas,
    affectedDistricts: data.affectedDistricts,
    affectedAreaKeys,
    sourceReportId: data.reportId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "incidentReports", data.reportId), {
    status: "approved",
    linkedIncidentId: incidentRef.id,
    reviewedAt: serverTimestamp(),
    reviewedBy: data.reviewedBy,
  });

  await notifyAffectedCustomers({
    incidentId: incidentRef.id,
    type: data.type,
    title:
      data.type === "maintenance"
        ? "Maintenance Notice"
        : "Network Incident Confirmed",
    body: data.description,
    affectedAreaKeys,
  });

  return incidentRef.id;
}

export async function rejectIncidentReport(data: {
  reportId: string;
  reviewedBy: string;
  reason?: string;
}) {
  await updateDoc(doc(db, "incidentReports", data.reportId), {
    status: "rejected",
    rejectionReason: data.reason ?? "",
    reviewedAt: serverTimestamp(),
    reviewedBy: data.reviewedBy,
  });
}

export async function createPlannedIncident(data: {
  title: string;
  description: string;
  type: "maintenance" | "upgrade";
  severity: IncidentSeverity;
  status: "scheduled" | "active";
  affectedAreas: string[];
  affectedDistricts: string[];
  estimatedResolution?: string;
  createdBy: string;
}) {
  const affectedAreaKeys = data.affectedDistricts.flatMap((district) =>
    data.affectedAreas.map((area) => areaKey(district, area)),
  );

  const incidentRef = await addDoc(collection(db, "incidents"), {
    title: data.title,
    description: data.description,
    type: data.type,
    severity: data.severity,
    status: data.status,
    affectedAreas: data.affectedAreas,
    affectedDistricts: data.affectedDistricts,
    affectedAreaKeys,
    estimatedResolution: data.estimatedResolution ?? "",
    createdBy: data.createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await notifyAffectedCustomers({
    incidentId: incidentRef.id,
    type: data.type,
    title:
      data.type === "upgrade"
        ? "Scheduled Network Upgrade"
        : "Planned Maintenance",
    body: data.description,
    affectedAreaKeys,
  });

  return incidentRef.id;
}

export function listenToRelevantIncidents(
  profile: CustomerProfile,
  callback: (incidents: PublicIncident[]) => void,
) {
  const customerAreaKey = areaKey(profile.district ?? "", profile.area ?? "");

  return listenToPublicIncidents((items) => {
    callback(
      items.filter((incident) => {
        const keys = incident.affectedAreaKeys ?? [];

        return (
          keys.includes(customerAreaKey) ||
          keys.includes("all/all") ||
          keys.includes("network/all")
        );
      }),
    );
  });
}

export function listenToPendingIncidentReports(
  callback: (reports: IncidentReport[]) => void,
) {
  const reportsQuery = query(
    collection(db, "incidentReports"),
    where("status", "==", "pending_review"),
  );

  return onSnapshot(reportsQuery, (snapshot) => {
    const reports = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as IncidentReport[];

    reports.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() ?? 0;
      const bTime = b.createdAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    });

    callback(reports);
  });
}
export function listenToPublicIncidents(
  callback: (incidents: PublicIncident[]) => void,
) {
  const incidentsQuery = query(
    collection(db, "incidents"),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(incidentsQuery, (snapshot) => {
    callback(
      snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as PublicIncident[],
    );
  });
}
export async function updateIncidentStatus(data: {
  incidentId: string;
  status: IncidentStatus;
  updatedBy: string;
  note?: string;
  estimatedResolution?: string;
}) {
  const incidentRef = doc(db, "incidents", data.incidentId);

  await updateDoc(incidentRef, {
    status: data.status,
    statusNote: data.note ?? "",
    estimatedResolution: data.estimatedResolution ?? "",
    updatedBy: data.updatedBy,
    updatedAt: serverTimestamp(),
  });

  const incidentSnap = await getDoc(incidentRef);

  if (!incidentSnap.exists()) {
    return;
  }

  const incident = {
    id: incidentSnap.id,
    ...incidentSnap.data(),
  } as PublicIncident;

  let title = "Network Update";

  if (data.status === "resolved") title = "Network Issue Resolved";
  if (data.status === "monitoring") title = "Network Under Monitoring";
  if (data.status === "active") title = "Network Incident Active";
  if (data.status === "cancelled") title = "Network Update Cancelled";

  await notifyAffectedCustomers({
    incidentId: data.incidentId,
    type: incident.type,
    title,
    body:
      data.note ||
      `${incident.title} status changed to ${data.status.replace("_", " ")}.`,
    affectedAreaKeys: incident.affectedAreaKeys ?? [],
  });
}

export async function createActiveIncident(data: {
  title: string;
  description: string;
  type: Exclude<IncidentType, "maintenance" | "upgrade">;
  severity: IncidentSeverity;
  affectedAreas: string[];
  affectedDistricts: string[];
  estimatedResolution?: string;
  createdBy: string;
}) {
  const affectedAreaKeys = data.affectedDistricts.flatMap((district) =>
    data.affectedAreas.map((area) => areaKey(district, area)),
  );

  const incidentRef = await addDoc(collection(db, "incidents"), {
    title: data.title,
    description: data.description,
    type: data.type,
    severity: data.severity,
    status: "active",
    affectedAreas: data.affectedAreas,
    affectedDistricts: data.affectedDistricts,
    affectedAreaKeys,
    estimatedResolution: data.estimatedResolution ?? "",
    createdBy: data.createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await notifyAffectedCustomers({
    incidentId: incidentRef.id,
    type: data.type,
    title:
      data.severity === "high" ? "Full Outage Alert" : "Network Incident Alert",
    body: data.description,
    affectedAreaKeys,
  });

  return incidentRef.id;
}
