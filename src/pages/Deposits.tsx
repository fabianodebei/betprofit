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
                        <td className="p-3 text-sm font-semibold" style={{ color: transaction.addebito && transaction.addebito < 0 ? '#ef4444' : transaction.addebito ? '#22c55e' : undefined }}>
                          {transaction.addebito ? formatCurrency(transaction.addebito) : ''}
                        </td>
                        <td className="p-3 text-sm font-semibold" style={{ color: transaction.accredito && transaction.accredito < 0 ? '#ef4444' : transaction.accredito ? '#22c55e' : undefined }}>
                          {transaction.accredito ? formatCurrency(transaction.accredito) : ''}
                        </td>
                        <td className="p-3 text-sm">{transaction.wallet ? (wallet ? `${wallet.nome} - ${wallet.intestatario}` : transaction.wallet) : ''}</td>
                        <td className="p-3 text-sm font-semibold" style={{ color: transaction.addebito && transaction.addebito < 0 ? '#ef4444' : transaction.addebito ? '#22c55e' : undefined }}>
                          {transaction.addebito ? formatCurrency(-transaction.addebito) : ''}
                        </td>
                        <td className="p-3 text-sm font-semibold" style={{ color: transaction.accredito && transaction.accredito < 0 ? '#ef4444' : transaction.accredito ? '#22c55e' : undefined }}>
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
