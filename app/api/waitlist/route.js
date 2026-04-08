export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Valid email required' }, { status: 400 })
    }

    // Send notification email via Resend
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'MyFortuneTracker <onboarding@resend.dev>',
          to: 'support@myfortunetracker.ai',
          subject: `New waitlist signup: ${email}`,
          text: `New waitlist signup!\n\nEmail: ${email}\nTime: ${new Date().toISOString()}`
        })
      })
    }

    return Response.json({ ok: true, message: 'Joined waitlist' })
  } catch (e) {
    console.error('Waitlist error:', e)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
