import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useBets } from '@/contexts/BetContext';
import { useTransactions } from '@/contexts/TransactionContext';
import { useAccounts } from '@/contexts/AccountContext';
import { useWallets } from '@/contexts/WalletContext';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/dates';
import { MovementDetailDialog } from '@/components/dialogs/MovementDetailDialog';
import { Bet, Transaction } from '@/types';

type Movement = {
  id: string;
  date: Date;
  conto: string;
  wallet?: string;
  intestatario?: string;
  metodo: string;
  movimento: number;
  type: 'bet' | 'transaction';
  originalData: Bet | Transaction;
};

export default function Transactions() {
  const { bets } = useBets();
  const { transactions } = useTransactions();
  const { accounts } = useAccounts();
  const { wallets } = useWallets();

  const [filterConto, setFilterConto] = useState('all');
  const [filterWallet, setFilterWallet] = useState('all');
  const [filterMetodo, setFilterMetodo] = useState('all');
  const [selectedMovement, setSelectedMovement] = useState<{
    data: Bet | Transaction;
    type: 'bet' | 'transaction';
  } | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const handleShowDetail = (movement: Movement) => {
    setSelectedMovement({
      data: movement.originalData,
      type: movement.type,
    });
    setShowDetail(true);
  };

  // Combine bets and transactions into movements
  const allMovements = useMemo(() => {
    const movements: Movement[] = [];

    // Add bets as movements
    bets.forEach(bet => {
      const accountInfo = accounts.find(acc => acc.conto === bet.conto);
      movements.push({
        id: bet.id,
        date: bet.createdAt,
        conto: accountInfo ? `${bet.conto} ${accountInfo.intestatario}` : bet.conto,
        wallet: undefined,
        intestatario: accountInfo?.intestatario,
        metodo: bet.tipo === 'Rapida' ? 'Giocata Rapida' : 'Giocata',
        movimento: -bet.stake,
        type: 'bet',
        originalData: bet,
      });

      // If archived, add result as separate movement
      if (bet.stato === 'Archiviata' && bet.risultato) {
        movements.push({
          id: `${bet.id}-result`,
          date: bet.dataEvento,
          conto: accountInfo ? `${bet.conto} ${accountInfo.intestatario}` : bet.conto,
          wallet: undefined,
          intestatario: accountInfo?.intestatario,
          metodo: bet.tipo === 'Rapida' ? 'Giocata Rapida' : 'Giocata',
          movimento: bet.risultato,
          type: 'bet',
          originalData: bet,
        });
      }
    });

    // Add transactions as movements
    transactions.forEach(transaction => {
      const accountInfo = accounts.find(acc => acc.conto === transaction.conto);
      movements.push({
        id: transaction.id,
        date: transaction.registrato,
        conto: accountInfo ? `${transaction.conto} ${accountInfo.intestatario}` : transaction.conto,
        wallet: transaction.wallet,
        intestatario: accountInfo?.intestatario,
        metodo: transaction.metodo === 'Deposito' || transaction.metodo === 'Prelievo' 
          ? 'Conto Movimento' 
          : transaction.metodo,
        movimento: transaction.addebito 
          ? -Math.abs(transaction.addebito) 
          : transaction.accredito 
            ? Math.abs(transaction.accredito) 
            : 0,
        type: 'transaction',
        originalData: transaction,
      });
    });

    // Sort by date descending
    return movements.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [bets, transactions, accounts]);

  // Filter movements
  const filteredMovements = useMemo(() => {
    return allMovements.filter(movement => {
      if (filterConto !== 'all' && !movement.conto.includes(filterConto)) return false;
      if (filterWallet !== 'all' && movement.wallet !== filterWallet) return false;
      if (filterMetodo !== 'all' && movement.metodo !== filterMetodo) return false;
      return true;
    });
  }, [allMovements, filterConto, filterWallet, filterMetodo]);

  const activeAccounts = accounts.filter(acc => acc.stato === 'Abilitato');
  const activeWallets = wallets.filter(w => w.stato === 'Abilitato');
  
  // Combine wallets with their intestatari
  const walletOptions = activeWallets.map(wallet => ({
    value: wallet.nome,
    label: `${wallet.nome} ${wallet.intestatario}`,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-foreground">Transazioni</h1>

      <div className="mb-4 text-sm text-muted-foreground">
        Visualizzo 1-{filteredMovements.length} di {allMovements.length} elementi.
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left text-xs font-semibold">#</th>
                  <th className="p-3 text-left text-xs font-semibold">Registrato</th>
                  <th className="p-3 text-left text-xs font-semibold">Conto</th>
                  <th className="p-3 text-left text-xs font-semibold">Wallet</th>
                  <th className="p-3 text-left text-xs font-semibold">Metodo</th>
                  <th className="p-3 text-left text-xs font-semibold">Movimento</th>
                  <th className="p-3 text-left text-xs font-semibold">Opzioni</th>
                </tr>
                <tr className="border-b bg-muted/30">
                  <th className="p-2"></th>
                  <th className="p-2"></th>
                  <th className="p-2">
                    <Select value={filterConto} onValueChange={setFilterConto}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Filtra Conto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti</SelectItem>
                        {activeAccounts.map(account => (
                          <SelectItem key={account.id} value={account.conto}>
                            {account.conto} - {account.intestatario}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </th>
                  <th className="p-2">
                    <Select value={filterWallet} onValueChange={setFilterWallet}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Filtra" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti</SelectItem>
                        {walletOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </th>
                  <th className="p-2">
                    <Select value={filterMetodo} onValueChange={setFilterMetodo}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Filtra Metodo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti</SelectItem>
                        <SelectItem value="Giocata">Giocata</SelectItem>
                        <SelectItem value="Giocata Rapida">Giocata Rapida</SelectItem>
                        <SelectItem value="Conto Movimento">Conto Movimento</SelectItem>
                        <SelectItem value="Deposito">Deposito</SelectItem>
                        <SelectItem value="Prelievo">Prelievo</SelectItem>
                        <SelectItem value="Spesa">Spesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </th>
                  <th className="p-2"></th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map((movement, idx) => (
                  <tr key={movement.id} className="border-b hover:bg-muted/20">
                    <td className="p-3 text-sm">{idx + 1}</td>
                    <td className="p-3 text-sm">{formatDate(movement.date)}</td>
                    <td className="p-3 text-sm">{movement.conto}</td>
                    <td className="p-3 text-sm">{movement.wallet || ''}</td>
                    <td className="p-3 text-sm">{movement.metodo}</td>
                    <td className="p-3 text-sm font-semibold" style={{ 
                      color: movement.movimento < 0 ? '#ef4444' : '#22c55e' 
                    }}>
                      {formatCurrency(movement.movimento)}
                    </td>
                    <td className="p-3">
                      <Button 
                        size="sm" 
                        variant="link" 
                        className="text-teal-600 hover:text-teal-700"
                        onClick={() => handleShowDetail(movement)}
                      >
                        Dettaglio
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <MovementDetailDialog 
        open={showDetail} 
        onOpenChange={setShowDetail}
        movement={selectedMovement}
      />
    </div>
  );
}
