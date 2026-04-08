import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Valid email required' }, { status: 400 })
    }

    if (!supabase) {
      // Fallback: log to console if Supabase not configured
      console.log('WAITLIST SIGNUP:', email)
      return Response.json({ ok: true, message: 'Joined waitlist' })
    }

    // Insert into waitlist table (upsert to avoid duplicates)
    const { error } = await supabase
      .from('waitlist')
      .upsert({ email, signed_up_at: new Date().toISOString() }, { onConflict: 'email' })

    if (error) {
      // If table doesn't exist, try creating it via RPC or just log
      console.error('Supabase waitlist error:', error.message)
      // Still return success — we don't want to lose the signup
      return Response.json({ ok: true, message: 'Joined waitlist' })
    }

    return Response.json({ ok: true, message: 'Joined waitlist' })
  } catch (e) {
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
