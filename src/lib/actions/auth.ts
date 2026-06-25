'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ServerActionResult } from '@/types/app'

export async function signUp(
  email: string,
  password: string,
  fullName: string
): Promise<ServerActionResult> {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function signIn(
  email: string,
  password: string
): Promise<ServerActionResult> {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { success: false, error: 'E-Mail oder Passwort falsch.' }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await getSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function forgotPassword(email: string): Promise<ServerActionResult> {
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })

  if (error) {
    return { success: false, error: 'Fehler beim Senden der E-Mail.' }
  }

  return { success: true }
}
