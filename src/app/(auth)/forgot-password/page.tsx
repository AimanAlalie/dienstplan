import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import Link from 'next/link'

export const metadata = { title: 'Passwort vergessen | Dienstplan' }

export default function ForgotPasswordPage() {
  return (
    <>
      <h2 className="text-xl font-semibold text-slate-900 mb-1">Passwort zurücksetzen</h2>
      <p className="text-slate-500 text-sm mb-6">
        Wir senden Ihnen einen Link zum Zurücksetzen per E-Mail
      </p>
      <ForgotPasswordForm />
      <p className="text-center text-sm text-slate-500 mt-6">
        <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Zurück zur Anmeldung
        </Link>
      </p>
    </>
  )
}
