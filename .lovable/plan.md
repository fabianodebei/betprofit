

## Problema

La scommessa Sisal rapida nel database ha `stake = -40` e `risultato = -40`. Nel calcolo del ROI in `bookmakerStats` (Dashboard.tsx, riga 188-191):

```
s.stake += bet.stake;    // -40
s.profitto += bet.risultato; // -40
ROI = profitto / stake = -40 / -40 = +100%  ← SBAGLIATO
```

Quando sia stake che profitto sono negativi (giocate rapide in perdita), il ROI risulta positivo per errore matematico di segno.

## Soluzione

In `src/pages/Dashboard.tsx`, nel `bookmakerStats` useMemo (riga 188), cambiare l'accumulo dello stake a `Math.abs(bet.stake)` per tutte le bet. In questo modo:

- Sisal: stake = 40 (abs), profitto = -40, ROI = -40/40 = **-100%** (corretto, barra rossa sotto)
- Per bet normali (stake sempre positivo), `Math.abs` non cambia nulla

Stessa correzione va applicata anche alla sezione lay bets (riga 210) dove `s.stake += lb.stake` dovrebbe usare `Math.abs(lb.stake)`.

Inoltre, nella funzione `getBetEarning` (riga 299), le quick bets usano `bet.stake` come earning. Per coerenza con il fatto che `risultato` è già salvato, usare `bet.risultato || 0` anche per le rapide, e lo stesso per gli altri punti dove `quickBets` usano `bet.stake` anziché `bet.risultato` (righe 130, 144, 158).

### File da modificare
- `src/pages/Dashboard.tsx`: 
  1. Riga 188: `s.stake += Math.abs(bet.stake)`
  2. Riga 210: `s.stake += Math.abs(lb.stake)` (già positivo, ma per sicurezza)
  3. Righe 130, 144, 158, 299: quick bets usano `bet.risultato || 0` anziché `bet.stake`

