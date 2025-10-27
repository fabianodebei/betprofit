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

interface ConfirmationEmailProps {
  fullName: string;
  confirmationLink: string;
}

export const ConfirmationEmail = ({ fullName, confirmationLink }: ConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Conferma il tuo account BetProfit</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img
            src="https://kykcanyioyzqctagrhud.supabase.co/storage/v1/object/public/assets/logo_centurion.png"
            width="120"
            height="120"
            alt="BetProfit Logo"
            style={logo}
          />
        </Section>
        
        <Heading style={h1}>Conferma la tua Email ✉️</Heading>
        
        <Text style={text}>
          Ciao <strong>{fullName}</strong>,
        </Text>
        
        <Text style={text}>
          Grazie per esserti registrato su <strong>BetProfit</strong>! 
          Sei ad un passo dal completare la tua registrazione.
        </Text>
        
        <Text style={text}>
          Per attivare il tuo account e iniziare a utilizzare tutte le funzionalità 
          della piattaforma, conferma il tuo indirizzo email cliccando sul pulsante qui sotto:
        </Text>
        
        <Section style={buttonSection}>
          <Link
            href={confirmationLink}
            target="_blank"
            style={button}
          >
            Conferma Email
          </Link>
        </Section>
        
        <Text style={text}>
          Se il pulsante non funziona, copia e incolla questo link nel tuo browser:
        </Text>
        
        <Section style={linkBox}>
          <Text style={linkText}>{confirmationLink}</Text>
        </Section>
        
        <Section style={benefitsBox}>
          <Text style={benefitsTitle}>Una volta confermata la tua email potrai:</Text>
          <Text style={benefitItem}>🎯 Accedere a tutte le funzionalità premium</Text>
          <Text style={benefitItem}>🔔 Ricevere notifiche importanti sul tuo account</Text>
          <Text style={benefitItem}>🔐 Recuperare l'accesso in caso di password dimenticata</Text>
          <Text style={benefitItem}>📊 Salvare i tuoi dati in modo sicuro</Text>
        </Section>
        
        <Section style={helpSection}>
          <Text style={helpText}>
            💡 <strong>Hai bisogno di aiuto?</strong> Contattaci in qualsiasi momento!
          </Text>
        </Section>
        
        <Text style={greetings}>
          A presto su BetProfit! 🚀<br />
          Il Team di BetProfit
        </Text>
        
        <Section style={footer}>
          <Text style={footerText}>
            Hai ricevuto questa email perché ti sei registrato su BetProfit.
          </Text>
          <Text style={footerText}>
            Se non hai creato un account, puoi ignorare questa email.
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

export default ConfirmationEmail;

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

const benefitsBox = {
  backgroundColor: '#2a2a2a',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  borderLeft: '4px solid #D4AF37',
};

const benefitsTitle = {
  color: '#D4AF37',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  margin: '0 0 12px',
};

const benefitItem = {
  color: '#e5e5e5',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '6px 0',
};

const helpSection = {
  backgroundColor: '#1e2a3a',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  borderLeft: '4px solid #2196f3',
};

const helpText = {
  color: '#90caf9',
  fontSize: '14px',
  margin: 0,
  textAlign: 'center' as const,
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
