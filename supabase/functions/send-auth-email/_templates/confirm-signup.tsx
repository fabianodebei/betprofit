import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface ConfirmSignupEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
}

export const ConfirmSignupEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
}: ConfirmSignupEmailProps) => {
  const verifyUrl = `${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`
  return (
    <Html>
      <Head />
      <Preview>Conferma la tua email per completare la registrazione</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Conferma indirizzo email</Heading>
          <Text style={text}>
            Grazie per esserti registrato a Centurion. Per completare la registrazione, conferma il tuo indirizzo email cliccando qui sotto:
          </Text>
          <Section style={{ margin: '20px 0' }}>
            <Link href={verifyUrl} target="_blank" style={button}>
              Conferma Email
            </Link>
          </Section>
          <Text style={{ ...text, marginTop: 24 }}>
            In alternativa, puoi copiare e incollare questo codice temporaneo:
          </Text>
          <code style={code}>{token}</code>

          <Hr style={hr} />

          <Text style={muted}>
            Se non hai richiesto questa registrazione, puoi ignorare questa email.
          </Text>
          <Text style={footer}>© {new Date().getFullYear()} Centurion • Tutti i diritti riservati</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default ConfirmSignupEmail

const main = {
  backgroundColor: '#ffffff',
}

const container = {
  padding: '24px',
  margin: '0 auto',
  maxWidth: '560px',
  border: '1px solid #eee',
  borderRadius: '8px',
}

const h1 = {
  color: '#111827',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '8px 0 12px 0',
  padding: 0,
}

const button = {
  backgroundColor: '#111827',
  color: '#ffffff',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  textDecoration: 'none',
  padding: '12px 20px',
  borderRadius: '6px',
  display: 'inline-block',
}

const text = {
  color: '#374151',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  lineHeight: '1.5',
}

const muted = {
  ...text,
  color: '#6B7280',
}

const footer = {
  ...muted,
  fontSize: '12px',
}

const hr = {
  borderColor: '#eee',
  margin: '22px 0',
}

const code = {
  display: 'inline-block',
  padding: '12px 4.5%',
  width: '90.5%',
  backgroundColor: '#f4f4f4',
  borderRadius: '5px',
  border: '1px solid #eee',
  color: '#333',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
} as const
