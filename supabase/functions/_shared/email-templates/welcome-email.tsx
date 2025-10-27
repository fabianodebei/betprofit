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

interface WelcomeEmailProps {
  fullName: string;
  email: string;
}

export const WelcomeEmail = ({ fullName, email }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Benvenuto in BetProfit - Inizia a tracciare le tue scommesse!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Benvenuto in BetProfit! 🎉</Heading>
        
        <Text style={text}>
          Ciao <strong>{fullName}</strong>,
        </Text>
        
        <Text style={text}>
          Grazie per esserti registrato su <strong>BetProfit</strong>, la piattaforma professionale 
          per il tracciamento e l'analisi delle tue scommesse sportive.
        </Text>
        
        <Text style={text}>
          Con BetProfit potrai:
        </Text>
        
        <Section style={benefitsList}>
          <Text style={benefitItem}>✅ Tracciare tutte le tue scommesse in un unico posto</Text>
          <Text style={benefitItem}>📊 Analizzare le tue performance con grafici dettagliati</Text>
          <Text style={benefitItem}>💰 Monitorare profitti e ROI in tempo reale</Text>
          <Text style={benefitItem}>🎯 Gestire bankroll e conti bookmaker</Text>
          <Text style={benefitItem}>📈 Ricevere insights per migliorare le tue strategie</Text>
        </Section>
        
        <Section style={buttonSection}>
          <Link
            href="https://betprofit.app"
            target="_blank"
            style={button}
          >
            Inizia Subito
          </Link>
        </Section>
        
        <Text style={text}>
          Se hai domande o hai bisogno di assistenza, non esitare a contattarci.
        </Text>
        
        <Text style={greetings}>
          Buone scommesse! 🎲<br />
          Il Team di BetProfit
        </Text>
        
        <Section style={footer}>
          <Text style={footerText}>
            Hai ricevuto questa email perché ti sei registrato su BetProfit.
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

export default WelcomeEmail;

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

const benefitsList = {
  margin: '24px 0',
  padding: '20px',
  backgroundColor: '#2a2a2a',
  borderRadius: '8px',
  borderLeft: '4px solid #D4AF37',
};

const benefitItem = {
  color: '#e5e5e5',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '8px 0',
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
