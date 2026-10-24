import type { Metadata } from 'next'
import { SuperAdminLogin } from '@/components/superadmin/login'

export const metadata: Metadata = { title: 'Connexion – RestoBen Super Admin' }

export default function SuperAdminConnexionPage() {
  return <SuperAdminLogin />
}
