import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = { title: 'Anmelden | Dienstplan' }

export default function LoginPage() {
  return (
    <>
      <h2 className="text-xl font-semibold text-slate-900 mb-1">Willkommen zurück</h2>
      <p className="text-slate-500 text-sm mb-6">Melden Sie sich mit Ihren Zugangsdaten an</p>
      <LoginForm />
      <p className="text-center text-sm text-slate-500 mt-4">
        Noch kein Konto?{' '}
        <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Jetzt registrieren
        </Link>
      </p>
    </>
  )
}
