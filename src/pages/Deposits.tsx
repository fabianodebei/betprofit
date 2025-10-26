import { useState, useMemo } from 'react';
import { Plus, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { useTransactions } from '@/contexts/TransactionContext';
import { useAccounts } from '@/contexts/AccountContext';
import { useWallets } from '@/contexts/WalletContext';
import { formatCurrency } from '@/utils/currency';
import { formatDateTime } from '@/utils/dates';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Deposits() {
  const { transactions, deleteTransaction } = useTransactions();
  const { accounts } = useAccounts();
  const { wallets } = useWallets();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  
  // Filter states
  const [filterMetodo, setFilterMetodo] = useState('');
  const [filterConto, setFilterConto] = useState('');
  const [filterAddebito, setFilterAddebito] = useState('');
  const [filterAccredito, setFilterAccredito] = useState('');
  const [filterWallet, setFilterWallet] = useState('');
  const [filterDescrizione, setFilterDescrizione] = useState('');

  // Get active accounts
  const activeAccounts = useMemo(() => {
    return accounts.filter(acc => acc.stato === 'Abilitato');
  }, [accounts]);

  // Calculate balance by bookmaker
  const bookmakerStats = useMemo(() => {
    const statsByBook: Record<string, { depositi: number; prelievi: number; bilancio: number; conto: string; intestatario: string }> = {};
    
    transactions.forEach(t => {
      if (!statsByBook[t.conto]) {
        const account = accounts.find(acc => acc.conto === t.conto);
        statsByBook[t.conto] = {
          depositi: 0,
          prelievi: 0,
          bilancio: 0,
          conto: t.conto,
          intestatario: account?.intestatario || ''
        };
      }
      
      if (t.metodo === 'Deposito') {
        statsByBook[t.conto].depositi += (t.addebito || 0);
      } else if (t.metodo === 'Prelievo') {
        statsByBook[t.conto].prelievi += (t.accredito || 0);
      }
    });
    
    // Calculate bilancio for each bookmaker
    Object.values(statsByBook).forEach(stat => {
      stat.bilancio = stat.prelievi - stat.depositi;
    });
    
    return Object.values(statsByBook).sort((a, b) => b.bilancio - a.bilancio);
  }, [transactions, accounts]);

  // Calculate overall balance
  const balanceStats = useMemo(() => {
    const totalDepositi = transactions
      .filter(t => t.metodo === 'Deposito')
      .reduce((sum, t) => sum + (t.addebito || 0), 0);
    
    const totalPrelievi = transactions
      .filter(t => t.metodo === 'Prelievo')
      .reduce((sum, t) => sum + (t.accredito || 0), 0);
    
    const bilancio = totalPrelievi - totalDepositi;
    
    return {
      totalDepositi,
      totalPrelievi,
      bilancio,
      isWinning: bilancio > 0
    };
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      if (filterMetodo && filterMetodo !== 'all' && transaction.metodo !== filterMetodo) return false;
      if (filterConto && filterConto !== 'all' && transaction.conto !== filterConto) return false;
      if (filterAddebito && transaction.addebito && !transaction.addebito.toString().includes(filterAddebito)) return false;
      if (filterAccredito && transaction.accredito && !transaction.accredito.toString().includes(filterAccredito)) return false;
      if (filterWallet && transaction.wallet && !transaction.wallet.toLowerCase().includes(filterWallet.toLowerCase())) return false;
      if (filterDescrizione && transaction.descrizione && !transaction.descrizione.toLowerCase().includes(filterDescrizione.toLowerCase())) return false;
      return true;
    });
  }, [transactions, filterMetodo, filterConto, filterAddebito, filterAccredito, filterWallet, filterDescrizione]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-4 text-3xl font-bold text-foreground">Depositi/Prelievi</h1>
      
      <Button onClick={() => setShowTransactionForm(true)} className="mb-6">
        <Plus className="mr-2 h-4 w-4" />
        Nuovo Movimento
      </Button>

      {transactions.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Totale Depositi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(balanceStats.totalDepositi)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Totale Prelievi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {formatCurrency(balanceStats.totalPrelievi)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Bilancio Totale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${balanceStats.bilancio >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(balanceStats.bilancio)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Situazione</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={balanceStats.isWinning ? "success" : "destructive"}>
                  {balanceStats.isWinning ? '🎉 Tu stai vincendo' : '📊 Il book sta vincendo'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {bookmakerStats.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Bilancio per Bookmaker</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3 text-left text-sm font-semibold">Bookmaker</th>
                        <th className="p-3 text-right text-sm font-semibold">Depositi</th>
                        <th className="p-3 text-right text-sm font-semibold">Prelievi</th>
                        <th className="p-3 text-right text-sm font-semibold">Bilancio</th>
                        <th className="p-3 text-center text-sm font-semibold">Stato</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookmakerStats.map((stat) => (
                        <tr key={stat.conto} className="border-b hover:bg-muted/20">
                          <td className="p-3">
                            <div className="font-medium">{stat.conto}</div>
                            {stat.intestatario && <div className="text-sm text-muted-foreground">{stat.intestatario}</div>}
                          </td>
                          <td className="p-3 text-right font-semibold text-destructive">
                            {formatCurrency(stat.depositi)}
                          </td>
                          <td className="p-3 text-right font-semibold text-success">
                            {formatCurrency(stat.prelievi)}
                          </td>
                          <td className={`p-3 text-right font-bold ${stat.bilancio >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {formatCurrency(stat.bilancio)}
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant={stat.bilancio >= 0 ? "success" : "destructive"}>
                              {stat.bilancio >= 0 ? '✓ In Vincita' : '✗ In Perdita'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="mb-4 text-sm text-muted-foreground">
        Visualizzo 1-{filteredTransactions.length} di {transactions.length} elementi.
      </div>

      <Card>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={ArrowRightLeft}
                title="Nessun movimento registrato"
                description="Inizia a tracciare i tuoi depositi, prelievi e spese."
                action={
                  <Button onClick={() => setShowTransactionForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuovo Movimento
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left text-xs font-semibold">#</th>
                    <th className="p-3 text-left text-xs font-semibold">Metodo</th>
                    <th className="p-3 text-left text-xs font-semibold">Registrato</th>
                    <th className="p-3 text-left text-xs font-semibold">Conto</th>
                    <th className="p-3 text-left text-xs font-semibold">Addebito</th>
                    <th className="p-3 text-left text-xs font-semibold">Accredito</th>
                    <th className="p-3 text-left text-xs font-semibold">Wallet</th>
                    <th className="p-3 text-left text-xs font-semibold">Addebito</th>
                    <th className="p-3 text-left text-xs font-semibold">Accredito</th>
                    <th className="p-3 text-left text-xs font-semibold">Descrizione</th>
                    <th className="p-3 text-left text-xs font-semibold">Opzioni</th>
                  </tr>
                  <tr className="border-b bg-muted/30">
                    <th className="p-2"></th>
                    <th className="p-2">
                      <Select value={filterMetodo} onValueChange={setFilterMetodo}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Seleziona Metodo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tutti</SelectItem>
                          <SelectItem value="Deposito">Deposito</SelectItem>
                          <SelectItem value="Prelievo">Prelievo</SelectItem>
                          <SelectItem value="Ricarica">Ricarica</SelectItem>
                          <SelectItem value="Riconciliazione">Riconciliazione</SelectItem>
                          <SelectItem value="Spesa">Spesa</SelectItem>
                          <SelectItem value="Trasferimenti">Trasferimenti</SelectItem>
                        </SelectContent>
                      </Select>
                    </th>
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
                      <Input
                        placeholder=""
                        value={filterAddebito}
                        onChange={(e) => setFilterAddebito(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </th>
                    <th className="p-2">
                      <Input
                        placeholder=""
                        value={filterAccredito}
                        onChange={(e) => setFilterAccredito(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </th>
                    <th className="p-2">
                      <Input
                        placeholder="Filtra"
                        value={filterWallet}
                        onChange={(e) => setFilterWallet(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </th>
                    <th className="p-2">
                      <Input
                        placeholder=""
                        className="h-8 text-xs"
                        disabled
                      />
                    </th>
                    <th className="p-2">
                      <Input
                        placeholder=""
                        className="h-8 text-xs"
                        disabled
                      />
                    </th>
                    <th className="p-2">
                      <Input
                        placeholder=""
                        value={filterDescrizione}
                        onChange={(e) => setFilterDescrizione(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction, idx) => {
                    const account = accounts.find(acc => acc.conto === transaction.conto);
                    const wallet = wallets.find(w => 
                      w.nome === transaction.wallet && 
                      w.intestatario === transaction.intestatario
                    );
                    return (
                      <tr key={transaction.id} className="border-b hover:bg-muted/20">
                        <td className="p-3 text-sm">{idx + 1}</td>
                        <td className="p-3 text-sm">{transaction.metodo}</td>
                        <td className="p-3 text-sm">{formatDateTime(transaction.registrato)}</td>
                        <td className="p-3 text-sm">{transaction.conto}{account && ` - ${account.intestatario}`}</td>
                        <td className={`p-3 text-sm font-semibold ${transaction.addebito && transaction.addebito < 0 ? 'text-destructive' : transaction.addebito ? 'text-success' : ''}`}>
                          {transaction.addebito ? formatCurrency(transaction.addebito) : ''}
                        </td>
                        <td className={`p-3 text-sm font-semibold ${transaction.accredito && transaction.accredito < 0 ? 'text-destructive' : transaction.accredito ? 'text-success' : ''}`}>
                          {transaction.accredito ? formatCurrency(transaction.accredito) : ''}
                        </td>
                        <td className="p-3 text-sm">{transaction.wallet ? (wallet ? `${wallet.nome} - ${wallet.intestatario}` : transaction.wallet) : ''}</td>
                        <td className={`p-3 text-sm font-semibold ${transaction.addebito && transaction.addebito < 0 ? 'text-destructive' : transaction.addebito ? 'text-success' : ''}`}>
                          {transaction.addebito ? formatCurrency(-transaction.addebito) : ''}
                        </td>
                        <td className={`p-3 text-sm font-semibold ${transaction.accredito && transaction.accredito < 0 ? 'text-destructive' : transaction.accredito ? 'text-success' : ''}`}>
                          {transaction.accredito ? formatCurrency(-transaction.accredito) : ''}
                        </td>
                        <td className="p-3 text-sm">{transaction.descrizione || ''}</td>
                        <td className="p-3">
                          <Button size="sm" variant="destructive" onClick={() => deleteTransaction(transaction.id)}>
                            Elimina
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionForm open={showTransactionForm} onOpenChange={setShowTransactionForm} />
    </div>
  );
}
