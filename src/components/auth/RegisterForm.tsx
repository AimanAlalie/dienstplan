'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { signUp } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const schema = z.object({
  fullName: z.string().min(2, 'Mindestens 2 Zeichen'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Mindestens 6 Zeichen'),
})

type FormValues = z.infer<typeof schema>

export function RegisterForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    const result = await signUp(values.email, values.password, values.fullName)

    if (!result.success) {
      toast.error(result.error ?? 'Registrierung fehlgeschlagen')
      return
    }

    toast.success('Konto erstellt! Bitte jetzt anmelden.')
    router.push('/login')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="fullName" className="text-slate-700">Vollständiger Name</Label>
        <Input
          id="fullName"
          type="text"
          autoComplete="name"
          placeholder="Max Mustermann"
          className={errors.fullName ? 'border-red-400' : ''}
          {...register('fullName')}
        />
        {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-slate-700">E-Mail-Adresse</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="name@beispiel.de"
          className={errors.email ? 'border-red-400' : ''}
          {...register('email')}
        />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-slate-700">Passwort</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            className={`pr-10 ${errors.password ? 'border-red-400' : ''}`}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 font-medium"
      >
        {isSubmitting
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Konto erstellen...</>
          : 'Konto erstellen'}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Bereits ein Konto?{' '}
        <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Anmelden
        </Link>
      </p>
    </form>
  )
}
