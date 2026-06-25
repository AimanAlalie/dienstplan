'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { forgotPassword } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, Loader2 } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
})

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email }: { email: string }) => {
    const result = await forgotPassword(email)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center py-4">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="font-medium text-slate-900">E-Mail gesendet</p>
        <p className="text-sm text-slate-500 mt-1">
          Prüfen Sie Ihren Posteingang und folgen Sie dem Link.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-slate-700">E-Mail-Adresse</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@beispiel.de"
          className={errors.email ? 'border-red-400' : ''}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11"
      >
        {isSubmitting ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Senden...</>
        ) : (
          'Link senden'
        )}
      </Button>
    </form>
  )
}
