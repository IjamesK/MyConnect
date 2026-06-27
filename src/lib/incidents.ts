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

export type IncidentReportStatus = "pending_review" | "approved" | "rejected";

export type IncidentStatus =
  | "scheduled"
  | "active"
  | "monitoring"
  | "resolved"
  | "cancelled";

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

export async function createIncidentReport(
  profile: CustomerProfile,
  data: {
    type: IncidentType;
    title: string;
    description: string;
    photoCount?: number;
    locationNote?: string;
  }
) {
  const reportRef = await addDoc(collection(db, "incidentReports"), {
    reporterUid: profile.uid,
    reporterName: profile.fullName,
    phone: profile.phone,
    customerNumber: profile.customerNumber,
    area: profile.area,
    district: profile.district,
    address: profile.address,
    routerSerial: profile.routerSerial,

    type: data.type,
    title: data.title,
    description: data.description,
    photoCount: data.photoCount ?? 0,
    locationNote: data.locationNote ?? "",

    status: "pending_review",
    linkedIncidentId: null,
    createdAt: serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null,
  });

  return reportRef.id;
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
    data.affectedAreas.map((area) => areaKey(district, area))
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
    data.affectedAreas.map((area) => areaKey(district, area))
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

  return incidentRef.id;
}

export function listenToRelevantIncidents(
  profile: CustomerProfile,
  callback: (incidents: PublicIncident[]) => void
) {
  const customerAreaKey = areaKey(profile.district, profile.area);

  const incidentsQuery = query(
    collection(db, "incidents"),
    where("affectedAreaKeys", "array-contains", customerAreaKey),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(incidentsQuery, (snapshot) => {
    callback(
      snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as PublicIncident[]
    );
  });
}

export function listenToPendingIncidentReports(
  callback: (reports: IncidentReport[]) => void
) {
  const reportsQuery = query(
    collection(db, "incidentReports"),
    where("status", "==", "pending_review"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(reportsQuery, (snapshot) => {
    callback(
      snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as IncidentReport[]
    );
  });
}
export function listenToPublicIncidents(
  callback: (incidents: PublicIncident[]) => void
) {
  const incidentsQuery = query(
    collection(db, "incidents"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(incidentsQuery, (snapshot) => {
    callback(
      snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as PublicIncident[]
    );
  });
}
