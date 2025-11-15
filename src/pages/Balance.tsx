import { Scale, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAccounts } from '@/contexts/AccountContext';
import { useWallets } from '@/contexts/WalletContext';
import { useBets } from '@/contexts/BetContext';
import { useLayBets } from '@/contexts/LayBetContext';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/dates';
import { useMemo, useState } from 'react';

export default function Balance() {
  const { accounts, getTotalBalance: getAccountsBalance } = useAccounts();
  const { getTotalBalance: getWalletsBalance } = useWallets();
  const { getTotalStakeInCorso, getOngoingBets } = useBets();
  const { layBets } = useLayBets();
  const [openIntestatari, setOpenIntestatari] = useState<Set<string>>(new Set());
  const [includeEsposizione, setIncludeEsposizione] = useState(true);

  // Calcola l'esposizione totale in corso
  const esitoEsposizioneInCorso = useMemo(() => {
    const stakeInCorso = getTotalStakeInCorso();
    const ongoingBets = getOngoingBets();
    const ongoingBetIds = new Set(ongoingBets.map(b => b.id));
    
    // Somma le liability delle bancate associate a puntate in corso
    const liabilityBancate = layBets
      .filter(lb => lb.metodo === 'Banca' && lb.stato === 'In Corso' && ongoingBetIds.has(lb.parentBetId))
      .reduce((sum, lb) => sum + (lb.stake * (lb.quotaBanca - 1)), 0);
    
    return stakeInCorso + liabilityBancate;
  }, [getTotalStakeInCorso, getOngoingBets, layBets]);

  // Calcola i saldi con o senza esposizione
  const saldoBookmakers = useMemo(() => {
    const balanceWithExposure = getAccountsBalance();
    return includeEsposizione ? balanceWithExposure : balanceWithExposure + esitoEsposizioneInCorso;
  }, [getAccountsBalance, includeEsposizione, esitoEsposizioneInCorso]);

  const saldoWallets = getWalletsBalance();
  const puntateInCorso = includeEsposizione ? esitoEsposizioneInCorso : 0;
  const saldoTotale = saldoBookmakers + saldoWallets;

  // Raggruppa gli account per intestatario
  const accountsByIntestatario = useMemo(() => {
    const grouped = new Map<string, typeof accounts>();
    accounts.forEach(account => {
      const existing = grouped.get(account.intestatario) || [];
      grouped.set(account.intestatario, [...existing, account]);
    });
    return grouped;
  }, [accounts]);

  const toggleIntestatario = (intestatario: string) => {
    setOpenIntestatari(prev => {
      const newSet = new Set(prev);
      if (newSet.has(intestatario)) {
        newSet.delete(intestatario);
      } else {
        newSet.add(intestatario);
      }
      return newSet;
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Bilancio</h1>
        <div className="flex items-center gap-3">
          <Label htmlFor="include-exposure" className="text-sm font-medium">
            Includi esposizione in corso
          </Label>
          <Switch
            id="include-exposure"
            checked={includeEsposizione}
            onCheckedChange={setIncludeEsposizione}
          />
        </div>
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
        {includeEsposizione && (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground uppercase">Puntate In Corso</p>
              <p className="mt-2 text-2xl font-bold text-warning">{formatCurrency(puntateInCorso)}</p>
            </CardContent>
          </Card>
        )}
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
                    <th className="p-3 text-left text-xs font-semibold uppercase w-8"></th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Intestatario</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Conti</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Bilancio Giocate</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Bilancio Giocate Rapide</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Saldo Disponibile</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Profitto</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(accountsByIntestatario.entries()).map(([intestatario, intestatarioAccounts], idx) => {
                    const isOpen = openIntestatari.has(intestatario);
                    const totalBilancioGiocate = intestatarioAccounts.reduce((sum, acc) => sum + acc.bilancioGiocate, 0);
                    const totalBilancioGiocateRapide = intestatarioAccounts.reduce((sum, acc) => sum + acc.bilancioGiocateRapide, 0);
                    const totalSaldo = intestatarioAccounts.reduce((sum, acc) => sum + acc.saldoAttuale, 0);
                    const totalProfitto = totalBilancioGiocate + totalBilancioGiocateRapide;

                    return (
                      <Collapsible
                        key={intestatario}
                        open={isOpen}
                        onOpenChange={() => toggleIntestatario(intestatario)}
                        asChild
                      >
                        <>
                          <CollapsibleTrigger asChild>
                            <tr className={`cursor-pointer hover:bg-muted/30 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                              <td className="p-3">
                                {isOpen ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </td>
                              <td className="p-3 text-sm font-semibold">{intestatario}</td>
                              <td className="p-3 text-sm text-muted-foreground">{intestatarioAccounts.length} {intestatarioAccounts.length === 1 ? 'conto' : 'conti'}</td>
                              <td className="p-3 text-sm font-medium">{formatCurrency(totalBilancioGiocate)}</td>
                              <td className="p-3 text-sm font-medium">{formatCurrency(totalBilancioGiocateRapide)}</td>
                              <td className="p-3 text-sm font-semibold">{formatCurrency(totalSaldo)}</td>
                              <td className="p-3">
                                <span className={`font-semibold ${totalProfitto >= 0 ? 'text-success' : 'text-destructive'}`}>
                                  {formatCurrency(totalProfitto)}
                                </span>
                              </td>
                            </tr>
                          </CollapsibleTrigger>
                          <CollapsibleContent asChild>
                            <>
                              {intestatarioAccounts.map((account) => {
                                const profitto = account.bilancioGiocate + account.bilancioGiocateRapide;
                                return (
                                  <tr key={account.id} className="bg-muted/10 border-l-4 border-primary/20">
                                    <td className="p-3"></td>
                                    <td className="p-3 text-sm pl-8">
                                      <div className="text-xs text-muted-foreground">
                                        Creato il {formatDate(account.createdAt)}
                                      </div>
                                    </td>
                                    <td className="p-3 text-sm font-medium">{account.conto}</td>
                                    <td className="p-3 text-sm">{formatCurrency(account.bilancioGiocate)}</td>
                                    <td className="p-3 text-sm">{formatCurrency(account.bilancioGiocateRapide)}</td>
                                    <td className="p-3 text-sm">{formatCurrency(account.saldoAttuale)}</td>
                                    <td className="p-3">
                                      <span className={`text-sm ${profitto >= 0 ? 'text-success' : 'text-destructive'}`}>
                                        {formatCurrency(profitto)}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4 text-sm text-muted-foreground">
                Visualizzo {accountsByIntestatario.size} intestatar{accountsByIntestatario.size === 1 ? 'io' : 'i'} con {accounts.length} cont{accounts.length === 1 ? 'o' : 'i'} totali
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
