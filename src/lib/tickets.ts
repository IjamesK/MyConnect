import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'

export async function createTicket(data: {
  userId: string
  kamNumber: string
  zone: string
  type: string
  description: string
  diagnosis?: Record<string, boolean>
  priority: 'low' | 'medium' | 'high'
}) {
  const ref = await addDoc(collection(db, 'tickets'), {
    ...data,
    status: 'submitted',
    createdAt: Timestamp.now(),
    updates: [],
  })
  return ref.id
}

export async function updateTicketStatus(
  ticketId: string,
  status: string,
  note: string,
  engineer?: string
) {
  await updateDoc(doc(db, 'tickets', ticketId), {
    status,
    ...(engineer && { assignedEngineer: engineer }),
    updates: [],
    lastUpdated: Timestamp.now(),
    lastNote: note,
  })
}

export function listenToUserTickets(
  userId: string,
  callback: (tickets: any[]) => void
) {
  const q = query(
    collection(db, 'tickets'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snapshot => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export function listenToAllTickets(callback: (tickets: any[]) => void) {
  const q = query(
    collection(db, 'tickets'),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snapshot => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}
