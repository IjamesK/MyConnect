import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { mockUsers } from './users'

export async function seedUsers(): Promise<{ success: number; errors: string[] }> {
  let success = 0
  const errors: string[] = []

  for (const user of mockUsers) {
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        user.email,
        user.password
      )

      await setDoc(doc(db, 'users', credential.user.uid), {
        uid: credential.user.uid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        kamNumber: user.kamNumber,
        zone: user.zone,
        package: user.package,
        packagePrice: user.packagePrice,
        expiryDate: user.expiryDate,
        routerModel: user.routerModel,
        routerSerial: user.routerSerial,
        ontType: user.ontType,
        status: 'active',
        createdAt: new Date().toISOString(),
        role: 'customer',
      })

      success++
      console.log(`✅ Created: ${user.name}`)
    } catch (err: any) {
      errors.push(`${user.name}: ${err.message}`)
      console.error(`❌ Failed: ${user.name} — ${err.message}`)
    }
  }

  return { success, errors }
}
