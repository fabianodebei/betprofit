import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'https://esm.sh/@react-email/components@0.0.22';
import * as React from 'https://esm.sh/react@18.3.1';

interface PasswordResetEmailProps {
  fullName: string;
  resetLink: string;
}

export const PasswordResetEmail = ({ fullName, resetLink }: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset della password per il tuo account BetProfit</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reset Password 🔐</Heading>
        
        <Text style={text}>
          Ciao <strong>{fullName}</strong>,
        </Text>
        
        <Text style={text}>
          Abbiamo ricevuto una richiesta per reimpostare la password del tuo account BetProfit.
        </Text>
        
        <Section style={warningBox}>
          <Text style={warningText}>
            ⏰ <strong>Questo link è valido per 1 ora</strong>
          </Text>
        </Section>
        
        <Section style={buttonSection}>
          <Link
            href={resetLink}
            target="_blank"
            style={button}
          >
            Reimposta Password
          </Link>
        </Section>
        
        <Text style={text}>
          Se il pulsante non funziona, copia e incolla questo link nel tuo browser:
        </Text>
        
        <Section style={linkBox}>
          <Text style={linkText}>{resetLink}</Text>
        </Section>
        
        <Section style={securityNotice}>
          <Text style={securityText}>
            🛡️ <strong>Nota di sicurezza:</strong> Se non hai richiesto questo reset, 
            ignora questa email. La tua password rimarrà invariata e il tuo account è sicuro.
          </Text>
        </Section>
        
        <Text style={greetings}>
          Cordiali saluti,<br />
          Il Team di BetProfit
        </Text>
        
        <Section style={footer}>
          <Text style={footerText}>
            Questa è un'email automatica, per favore non rispondere.
          </Text>
          <Text style={footerText}>
            <Link href="https://betprofit.app" style={footerLink}>
              BetProfit
            </Link>
            {' '}- La tua piattaforma di betting analytics
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default PasswordResetEmail;

// Styles
const main = {
  backgroundColor: '#0a0a0a',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
  backgroundColor: '#1a1a1a',
};

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const logo = {
  margin: '0 auto',
};

const h1 = {
  color: '#D4AF37',
  fontSize: '28px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

const text = {
  color: '#e5e5e5',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px',
};

const warningBox = {
  backgroundColor: '#2a2a2a',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  borderLeft: '4px solid #ff9800',
};

const warningText = {
  color: '#ff9800',
  fontSize: '15px',
  margin: 0,
  textAlign: 'center' as const,
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#D4AF37',
  borderRadius: '6px',
  color: '#000000',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 40px',
};

const linkBox = {
  backgroundColor: '#2a2a2a',
  borderRadius: '6px',
  padding: '16px',
  margin: '16px 0 24px',
  wordBreak: 'break-all' as const,
};

const linkText = {
  color: '#D4AF37',
  fontSize: '13px',
  margin: 0,
};

const securityNotice = {
  backgroundColor: '#1e3a1e',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  borderLeft: '4px solid #4caf50',
};

const securityText = {
  color: '#a5d6a7',
  fontSize: '14px',
  lineHeight: '22px',
  margin: 0,
};

const greetings = {
  color: '#e5e5e5',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '32px 0 16px',
};

const footer = {
  borderTop: '1px solid #333333',
  marginTop: '32px',
  paddingTop: '24px',
};

const footerText = {
  color: '#888888',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '8px 0',
  textAlign: 'center' as const,
};

const footerLink = {
  color: '#D4AF37',
  textDecoration: 'none',
};
