import { Scale, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/ui/button';
import { useAccounts } from '@/contexts/AccountContext';
import { useWallets } from '@/contexts/WalletContext';
import { useBets } from '@/contexts/BetContext';
import { useLayBets } from '@/contexts/LayBetContext';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/dates';
import { useState } from 'react';

export default function Balance() {
  const { accounts, getTotalBalance: getAccountsBalance } = useAccounts();
  const { getTotalBalance: getWalletsBalance } = useWallets();
  const { getTotalStakeInCorso, getOngoingBets } = useBets();
  const { getLayBetsByParentId } = useLayBets();
  const [expandedBets, setExpandedBets] = useState<Set<string>>(new Set());

  const ongoingBets = getOngoingBets();
  const saldoBookmakers = getAccountsBalance();
  const saldoWallets = getWalletsBalance();
  const puntateInCorso = getTotalStakeInCorso();
  const saldoTotale = saldoBookmakers + saldoWallets;

  const toggleLayBets = (betId: string) => {
    setExpandedBets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(betId)) {
        newSet.delete(betId);
      } else {
        newSet.add(betId);
      }
      return newSet;
    });
  };

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
                    <th className="p-3 text-left text-xs font-semibold uppercase">Saldo Reale</th>
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
                        <td className="p-3 text-sm">{formatCurrency(account.saldoAttuale)}</td>
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

      {/* Puntate In Corso con Bancate */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Puntate In Corso</CardTitle>
        </CardHeader>
        <CardContent>
          {ongoingBets.length === 0 ? (
            <EmptyState
              icon={Scale}
              title="Nessuna puntata in corso"
              description="Non ci sono puntate attive al momento."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-xs font-semibold uppercase">Data Evento</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Tipo</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Evento</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Conto</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Stake</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Quota</th>
                  </tr>
                </thead>
                <tbody>
                  {ongoingBets.map((bet, idx) => {
                    const layBets = getLayBetsByParentId(bet.id);
                    const isExpanded = expandedBets.has(bet.id);
                    const hasLayBets = layBets.length > 0;
                    
                    return (
                      <>
                        <tr key={bet.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                          <td className="p-3 text-sm">
                            <div className="flex items-center gap-2">
                              {hasLayBets && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleLayBets(bet.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                              {formatDate(bet.dataEvento)}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="info">{bet.tipo}</Badge>
                              {hasLayBets && (
                                <Badge variant="warning" className="text-xs">
                                  {layBets.length} bancate
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-sm">{bet.evento || bet.nomeGioco || '-'}</td>
                          <td className="p-3 text-sm">{bet.conto}</td>
                          <td className="p-3 text-sm font-semibold">{formatCurrency(bet.stake)}</td>
                          <td className="p-3 text-sm">{bet.quota || bet.quotaCombinata || '-'}</td>
                        </tr>
                        {isExpanded && layBets.map((layBet) => {
                          const liability = layBet.stake * (layBet.quotaBanca - 1);
                          return (
                            <tr key={`lay-${layBet.id}`} className={`${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'} border-l-4 border-l-warning`}>
                              <td className="p-3 text-sm pl-12">
                                <div className="flex items-center gap-2">
                                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                  {formatDate(layBet.dataEvento)}
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge variant="warning">{layBet.metodo}</Badge>
                              </td>
                              <td className="p-3 text-sm">{layBet.evento}</td>
                              <td className="p-3 text-sm">{layBet.conto}</td>
                              <td className="p-3 text-sm">
                                <div className="text-xs">
                                  <div>Stake: {formatCurrency(layBet.stake)}</div>
                                  <div>Bancata: {formatCurrency(liability)}</div>
                                </div>
                              </td>
                              <td className="p-3 text-sm">
                                <div className="text-xs">
                                  <div>Q.Punta: {layBet.quotaPunta}</div>
                                  <div>Q.Banca: {layBet.quotaBanca}</div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
