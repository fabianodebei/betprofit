import { Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { useAccounts } from '@/contexts/AccountContext';
import { useWallets } from '@/contexts/WalletContext';
import { useBets } from '@/contexts/BetContext';
import { useLayBets } from '@/contexts/LayBetContext';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/dates';
import { useMemo } from 'react';

export default function Balance() {
  const { accounts, getTotalBalance: getAccountsBalance } = useAccounts();
  const { getTotalBalance: getWalletsBalance } = useWallets();
  const { getTotalStakeInCorso, getOngoingBets } = useBets();
  const { layBets } = useLayBets();

  const saldoBookmakers = getAccountsBalance();
  const saldoWallets = getWalletsBalance();
  
  // Calcola puntate in corso includendo le liability delle bancate
  const puntateInCorso = useMemo(() => {
    const stakeInCorso = getTotalStakeInCorso();
    const ongoingBets = getOngoingBets();
    const ongoingBetIds = new Set(ongoingBets.map(b => b.id));
    
    // Somma le liability delle bancate associate a puntate in corso
    const liabilityBancate = layBets
      .filter(lb => lb.metodo === 'Banca' && ongoingBetIds.has(lb.parentBetId))
      .reduce((sum, lb) => sum + (lb.stake * (lb.quotaBanca - 1)), 0);
    
    return stakeInCorso + liabilityBancate;
  }, [getTotalStakeInCorso, getOngoingBets, layBets]);
  
  const saldoTotale = saldoBookmakers + saldoWallets;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Bilancio</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground uppercase">Saldo Bookmakers</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(saldoBookmakers)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground uppercase">Saldo Wallets</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(saldoWallets)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground uppercase">Puntate In Corso</p>
            <p className="mt-2 text-2xl font-bold text-warning">{formatCurrency(puntateInCorso)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground uppercase">Saldo Totale</p>
            <p className={`mt-2 text-2xl font-bold ${saldoTotale >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(saldoTotale)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dettaglio Bilancio per Conto</CardTitle>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <EmptyState
              icon={Scale}
              title="Nessun conto presente"
              description="Crea il tuo primo conto per iniziare a visualizzare il bilancio."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-xs font-semibold uppercase">#</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Creato Il</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Intestatario</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Conto</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Bilancio Giocate</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Bilancio Giocate Rapide</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Saldo Disponibile</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Profitto</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account, idx) => {
                    const profitto = account.bilancioGiocate + account.bilancioGiocateRapide;
                    const saldoDisponibile = account.saldoAttuale + profitto;
                    return (
                      <tr key={account.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                        <td className="p-3 text-sm">{idx + 1}</td>
                        <td className="p-3 text-sm">{formatDate(account.createdAt)}</td>
                        <td className="p-3 text-sm">{account.intestatario}</td>
                        <td className="p-3 text-sm font-medium">{account.conto}</td>
                        <td className="p-3 text-sm">{formatCurrency(account.bilancioGiocate)}</td>
                        <td className="p-3 text-sm">{formatCurrency(account.bilancioGiocateRapide)}</td>
                        <td className="p-3 text-sm font-semibold">{formatCurrency(saldoDisponibile)}</td>
                        <td className="p-3">
                          <span className={`font-semibold ${profitto >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {formatCurrency(profitto)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4 text-sm text-muted-foreground">
                Visualizzo 1-{accounts.length} di {accounts.length} elementi
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
