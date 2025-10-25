📊 Bet Profit - Piattaforma di Gestione Scommesse Sportive
Soluzione completa e professionale per gestire puntate, conti bookmaker, wallet e profitti in modo intelligente e sicuro.

🎯 Caratteristiche Principali
Dashboard Avanzata:

KPI in tempo reale con grafici interattivi e sparklines

Analisi mensile e annuale dei guadagni, trend visivi

Metriche dettagliate (win rate, ROI, streak)

ROI per bookmaker, confronti e classifiche

Distribuzione tipi di puntata con grafici circolari

Insights intelligenti generati dai dati

Gestione Finanziaria:

Wallet multipli, separazione fondi

Conti bookmaker con stato e metodi di pagamento

Transazioni dettagliate, categorie e note

Storico trasferimenti tra wallet

Depositi/prelievi tracciati per ogni bookmaker

Bilancio consolidato

Sistema di Puntate:

Puntate singole e multiple con calcolo profitto automatico

Puntate rapide, lay betting con calcolo responsabilità

Casino betting separato

Matched betting calculator

Archiviazione automatica, statistiche

Notifiche e Promemoria:

Reminder personalizzabili, notifiche Telegram

Alert automatici eventi importanti

Configurazione Avanzata:

Gestione bookmaker (abilitato/disabilitato)

Bookmaker pubblici condivisi

Intestatari multipli, tag personalizzati

Filtri avanzati

Selezione anno fiscale

Import/Export per backup/migrazione

Pannello Admin:

Dashboard amministrativa, gestione utenti/ruoli

Widget drag & drop

Analytics utenti, audit log

Grafici KPI admin

🛠️ Stack Tecnologico
Frontend:

React 18.3, TypeScript 5.8, Vite 5.4

Tailwind CSS 3.4, shadcn/ui, Radix UI

React Router, React Hook Form, Zod

TanStack Query, Recharts, date-fns, Lucide React, DND Kit

Backend (Lovable Cloud):

Supabase 2.58, PostgreSQL

Row Level Security

Edge Functions (cron, Telegram, admin-delete-user)

Authentication completa

🗄️ Schema Database
Utenti e Autenticazione:
profiles, user_roles, admin_audit_log

Finanziario:
wallets, wallet_transactions, accounts, transactions

Puntate:
bets, bet_legs, lay_bets

Configurazione:
books, intestatari, tags, reminders

Sistema:
telegram_config, notification_logs

🔐 Sicurezza
RLS su tutte le tabelle utente

SECURITY DEFINER e authorization checks

JWT e HMAC su endpoint sensibili

Rate limiting

Validazione input con Zod

Audit log per operazioni admin

Protected/ Admin routes

Nessun XSS tramite user content

Error logging dettagliato

🚀 Quick Start
Prerequisiti
Node.js >= 18.x

npm >= 9.x (supportato anche bun/pnpm)

Installazione
bash
git clone <YOUR_GIT_URL>
cd bet-profit
npm install
# Variabili Supabase gestite da Lovable Cloud
npm run dev
# → App su http://localhost:5173
Build Produzione
bash
npm run build
npm run preview
📁 Struttura Progetto
text
bet-profit/
├── src/
│   ├── components/ (admin, auth, common, dashboard, dialogs, filters, forms, layout, ui)
│   ├── contexts/
│   ├── hooks/
│   ├── integrations/supabase/
│   ├── pages/
│   ├── types/
│   ├── utils/
│   └── constants/
├── supabase/
│   ├── functions/
│   ├── migrations/
│   └── config.toml
└── public/
🌍 Deploy
Lovable Platform:

Share → Publish nell’editor

Subdomain o dominio personalizzato

Self-hosting:

Vercel, Netlify, Cloudflare Pages, AWS S3 + CloudFront

Configurare variabili d’ambiente

🔧 Telegram & Admin
Crea bot Telegram → ottieni token → invia messaggio → recupera chat ID

Configura in Impostazioni → Telegram

Secret NOTIFICATION_HMAC_SECRET per sicurezza

Il primo utente è admin, promuovi altri via SQL

sql
UPDATE user_roles SET role = 'admin' WHERE user_id = '<USER_UUID>';
📊 Funzionalità Dashboard
KPI Cards con sparkline, confronto annuale/mensile

Grafici: trend mensile, ROI bookmaker, distribuzione puntate, confronto mensile

Quick insights: migliori bookmaker/tipi puntata, alert negativi

Messaggi: nuovo/letto, scadenza, detail

🎨 Design System
shadcn/ui, Dark/Light, ARIA, animazioni fluide

Responsive mobile-first, keyboard navigation

🧪 Testing & Quality
ESLint, strict mode TypeScript, Prettier

Lazy loading, React.memo, code splitting

Asset optimization

🤝 Contributi
Issue su bug/feature

Screenshot, info browser/device/OS

📄 Licenza
Proprietaria © 2025 Centurion Club 

📞 Supporto
Email: fabianodebei@gmail.com

Documentazione, Discord/Telegram
