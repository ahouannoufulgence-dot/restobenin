import type { Metadata } from 'next'
import { SuperAdminPage } from '@/components/superadmin/page-shell'
import { SuperAdminDashboard } from '@/components/superadmin/dashboard'

export const metadata: Metadata = { title: 'Tableau de bord – RestoBen Super Admin' }

export default function SuperAdminHomePage() {
  return (
    <SuperAdminPage title="Tableau de bord Super Admin" current="dashboard">
      <SuperAdminDashboard />
    </SuperAdminPage>
  )
}
