📊 Bet Profit — Gestione Scommesse Sportive
Piattaforma completa per gestire puntate, conti bookmaker, wallet e profitti.

🎯 Funzionalità
Dashboard — KPI real-time, grafici trend, ROI per bookmaker, win rate, streak, insights automatici

Wallet & Conti — Wallet multipli, depositi/prelievi, storico transazioni, bilancio consolidato

Puntate — Singole/multiple, lay betting, casino, matched betting calculator, archiviazione automatica

Notifiche — Reminder personalizzabili, alert Telegram automatici

Configurazione — Bookmaker, intestatari, tag, filtri, anno fiscale, import/export

Admin — Gestione utenti/ruoli, audit log, analytics, widget drag & drop

🛠️ Stack
Layer	Tecnologie
Frontend	React 18, TypeScript, Vite, Tailwind, shadcn/ui, TanStack Query, Recharts
Backend	Supabase (PostgreSQL, RLS, Edge Functions, Auth)
🔐 Sicurezza
RLS su tutte le tabelle · JWT & HMAC · Rate limiting · Validazione Zod · Audit log admin · Protected routes

🚀 Quick Start
bash
git clone <YOUR_GIT_URL>
cd bet-profit && npm install
npm run dev  # → http://localhost:5173
Build: npm run build && npm run preview

🌍 Deploy
Vercel, Netlify, Cloudflare Pages — configura le variabili d'ambiente Supabase prima del deploy.

🔧 Setup Telegram & Admin
Crea bot → ottieni token → recupera chat ID → configura in Impostazioni → Telegram

Primo utente = admin. Per promuovere altri:

sql
UPDATE user_roles SET role = 'admin' WHERE user_id = '<USER_UUID>';
📄 Licenza & Supporto
Proprietaria © 2025 Centurion Club · fabianodebei@gmail.com
