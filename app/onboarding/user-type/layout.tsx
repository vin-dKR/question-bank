import { getAuthContext } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    // Was `sessionClaims.metadata.onboardingComplete`, a Clerk publicMetadata
    // field with no AuthKit equivalent. Now a DB read (doc §6).
    const ctx = await getAuthContext()

    if (ctx?.onboardingComplete) {
        redirect('/dashboard')
    }

    return <>{children}</>
}
