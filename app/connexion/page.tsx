import type { Metadata } from 'next'
import { LoginForm } from '@/components/connexion/login-form'

export const metadata: Metadata = {
  title: 'Se connecter – RestoBen',
  description: 'Accédez à votre tableau de bord RestoBen.',
}

export default function ConnexionPage() {
  return <LoginForm />
}
