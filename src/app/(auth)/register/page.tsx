import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata = { title: 'Konto erstellen | Dienstplan' }

export default function RegisterPage() {
  return (
    <>
      <h2 className="text-xl font-semibold text-slate-900 mb-1">Konto erstellen</h2>
      <p className="text-slate-500 text-sm mb-6">Erstellen Sie Ihr persönliches Konto</p>
      <RegisterForm />
    </>
  )
}
