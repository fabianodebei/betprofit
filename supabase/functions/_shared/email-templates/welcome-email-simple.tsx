import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'https://esm.sh/@react-email/components@0.0.22';
import * as React from 'https://esm.sh/react@18.3.1';

interface WelcomeEmailProps {
  fullName: string;
  email: string;
}

export const WelcomeEmail = ({ fullName, email }: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Benvenuto in BetProfit</Preview>
      <Body style={{ backgroundColor: '#0a0a0a', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ margin: '0 auto', padding: '40px 20px', maxWidth: '600px' }}>
          <Heading style={{ color: '#D4AF37', fontSize: '24px', textAlign: 'center' }}>
            Benvenuto in BetProfit!
          </Heading>
          <Text style={{ color: '#e5e5e5', fontSize: '16px' }}>
            Ciao {fullName},
          </Text>
          <Text style={{ color: '#e5e5e5', fontSize: '16px' }}>
            Grazie per esserti registrato su BetProfit. Sei pronto per iniziare a tracciare le tue scommesse!
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;
