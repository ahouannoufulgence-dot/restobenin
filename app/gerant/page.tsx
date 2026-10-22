import type { Metadata } from 'next'
import { ManagerApp } from '@/components/gerant/manager-app'

export const metadata: Metadata = {
  title: 'Espace Gérant – RestoBen',
  description: 'Tableau de bord du gérant : commandes, tables, menu, rapports et stocks de votre restaurant.',
}

export default function GerantPage() {
  return <ManagerApp />
}
