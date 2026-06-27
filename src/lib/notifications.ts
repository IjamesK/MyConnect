import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type NotificationType =
  | "maintenance"
  | "incident"
  | "ticket"
  | "billing"
  | "account";

export type AppNotification = {
  id: string;
  customerUid: string;
  type: NotificationType;
  title: string;
  body: string;
  unread: boolean;
  action?: string;
  relatedId?: string;
  createdAt?: Timestamp | null;
};

export function listenToUserNotifications(
  customerUid: string,
  callback: (notifications: AppNotification[]) => void
) {
  const notificationsQuery = query(
    collection(db, "notifications"),
    where("customerUid", "==", customerUid)
  );

  return onSnapshot(notificationsQuery, (snapshot) => {
    const notifications = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();

      return {
        id: docSnap.id,
        customerUid: data.customerUid,
        type: data.type,
        title: data.title,
        body: data.body,
        unread: Boolean(data.unread),
        action: data.action,
        relatedId: data.relatedId,
        createdAt: data.createdAt ?? null,
      } as AppNotification;
    });

    notifications.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() ?? 0;
      const bTime = b.createdAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    });

    callback(notifications);
  });
}

export function listenToUnreadNotificationCount(
  customerUid: string,
  callback: (count: number) => void
) {
  const unreadQuery = query(
    collection(db, "notifications"),
    where("customerUid", "==", customerUid),
    where("unread", "==", true)
  );

  return onSnapshot(unreadQuery, (snapshot) => {
    callback(snapshot.size);
  });
}

export async function createCustomerNotification(data: {
  customerUid: string;
  type: NotificationType;
  title: string;
  body: string;
  action?: string;
  relatedId?: string;
}) {
  await addDoc(collection(db, "notifications"), {
    customerUid: data.customerUid,
    type: data.type,
    title: data.title,
    body: data.body,
    action: data.action ?? null,
    relatedId: data.relatedId ?? null,
    unread: true,
    createdAt: serverTimestamp(),
  });
}

export async function markNotificationRead(notificationId: string) {
  await updateDoc(doc(db, "notifications", notificationId), {
    unread: false,
  });
}

export async function markAllNotificationsRead(customerUid: string) {
  const unreadQuery = query(
    collection(db, "notifications"),
    where("customerUid", "==", customerUid),
    where("unread", "==", true)
  );

  const snapshot = await getDocs(unreadQuery);

  await Promise.all(
    snapshot.docs.map((docSnap) =>
      updateDoc(doc(db, "notifications", docSnap.id), {
        unread: false,
      })
    )
  );
}
