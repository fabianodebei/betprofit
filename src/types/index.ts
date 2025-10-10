export interface Wallet {
  id: string;
  intestatario: string;
  nome: string;
  descrizione?: string;
  saldoAttuale: number;
  stato: 'Abilitato' | 'Disabilitato';
  createdAt: Date;
}

export interface Account {
  id: string;
  intestatario: string;
  conto: string;
  descrizione?: string;
  saldoAttuale: number;
  bilancioGiocate: number;
  bilancioGiocateRapide: number;
  stato: 'Abilitato' | 'Disabilitato';
  walletId?: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  metodo: 'Deposito' | 'Spesa' | 'Prelievo' | 'Riconciliazione';
  conto: string;
  intestatario?: string;
  wallet?: string;
  addebito?: number;
  accredito?: number;
  descrizione?: string;
  registrato: Date; // Include time
}

export interface BetLeg {
  id: string;
  betId: string;
  userId?: string;
  evento: string;
  competizione?: string;
  mercato?: string;
  selezione: string;
  quota: number;
  stato: 'In Corso' | 'Vinta' | 'Persa' | 'Void';
  risultato?: string;
  dataEvento: Date;
  createdAt: Date;
}

export interface Bet {
  id: string;
  tipo: 'Singola' | 'Multipla' | 'Casino' | 'Rapida';
  conto: string;
  stake: number;
  quota?: number;
  evento?: string;
  dataEvento: Date; // Include time
  metodo?: string;
  tipoBonus?: 'Nessuno' | 'Bonus' | 'Rimborso' | 'Free Bet';
  bonus?: number;
  rimborso?: number;
  stato: 'Bozza' | 'In Corso' | 'Vinta' | 'Persa' | 'Archiviata';
  risultato?: number;
  tag?: string;
  walletId?: string;
  note?: string;
  mercato?: string;
  competizione?: string;
  urlEvento?: string;
  nomeGioco?: string;
  quotaPunta?: number;
  percentualeBonus?: number;
  numeroMinimoSelezioni?: number;
  quotaCombinata?: number;
  vincitaPotenziale?: number;
  createdAt: Date; // Include time
}

export interface DashboardStats {
  currentMonthEarnings: number;
  currentMonthChange: number;
  monthlyAverage: number;
  monthlyAverageChange: number;
  bestMonth: number;
  bestMonthPercentage: number;
  totalYear: number;
  totalYearChange: number;
}

export interface ChartData {
  month: string;
  earnings: number;
}

export interface Reminder {
  id: string;
  metodo: string;
  conto: string;
  descrizione: string;
  dataScadenza: Date;
  notificaPeriodo: string;
  stato: 'Nuovo' | 'Letto';
  createdAt: Date;
}

export interface LayBet {
  id: string;
  parentBetId: string;
  metodo: 'Punta' | 'Banca';
  evento: string;
  dataEvento: Date;
  mercato: string;
  conto: string;
  stake: number;
  quotaBanca: number;
  quotaPunta: number;
  tassePercentuale: number;
  urlEvento?: string;
  createdAt: Date;
}
