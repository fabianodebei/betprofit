import { serve } from 'https://deno.land/std@0.190.0/http/server.ts'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'https://esm.sh/resend@4.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string

const createEmailHTML = (confirmLink: string, token: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content p {
      color: #333333;
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 20px;
    }
    .button {
      display: inline-block;
      background-color: #667eea;
      color: #ffffff;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      transition: background-color 0.3s ease;
    }
    .button:hover {
      background-color: #5568d3;
    }
    .token-box {
      background-color: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      padding: 16px;
      margin: 20px 0;
      text-align: center;
    }
    .token {
      font-family: 'Courier New', monospace;
      font-size: 20px;
      font-weight: 600;
      color: #667eea;
      letter-spacing: 2px;
    }
    .footer {
      padding: 20px 30px;
      background-color: #f8f9fa;
      border-top: 1px solid #e9ecef;
      text-align: center;
    }
    .footer p {
      color: #6c757d;
      font-size: 14px;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Benvenuto su Centurion!</h1>
    </div>
    <div class="content">
      <p>Ciao,</p>
      <p>Grazie per esserti registrato su <strong>Centurion</strong>. Per completare la registrazione e attivare il tuo account, conferma il tuo indirizzo email.</p>
      <div style="text-align: center;">
        <a href="${confirmLink}" class="button">Conferma Email</a>
      </div>
      <p>Oppure copia e incolla questo codice temporaneo:</p>
      <div class="token-box">
        <div class="token">${token}</div>
      </div>
      <p style="color: #6c757d; font-size: 14px;">Questo link e codice sono validi per 24 ore.</p>
      <p style="color: #6c757d; font-size: 14px;">Se non hai richiesto questa registrazione, puoi ignorare questa email.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Centurion. Tutti i diritti riservati.</p>
    </div>
  </div>
</body>
</html>
`

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('not allowed', { status: 400 })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  const wh = new Webhook(hookSecret)

  try {
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: { email: string }
      email_data: {
        token: string
        token_hash: string
        redirect_to: string
        email_action_type: string
      }
    }

    console.log('Received auth email request:', { email: user.email, action: email_action_type })

    // We only handle signup confirmation here
    if (email_action_type !== 'signup') {
      console.log('Skipping non-signup email type:', email_action_type)
      return new Response(JSON.stringify({ skipped: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const confirmLink = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to)}`
    
    const html = createEmailHTML(confirmLink, token)

    console.log('Sending confirmation email to:', user.email)

    const { error } = await resend.emails.send({
      from: 'Centurion <onboarding@resend.dev>',
      to: [user.email],
      subject: 'Conferma la tua email - Centurion',
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    console.log('Email sent successfully to:', user.email)

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Error in send-auth-email function:', error)
    return new Response(
      JSON.stringify({ error: { code: error.code, message: error.message } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
