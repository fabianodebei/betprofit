import { useState } from 'react';
import { Plus, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { useTransactions } from '@/contexts/TransactionContext';
import { formatCurrency } from '@/utils/currency';
import { formatDateTime } from '@/utils/dates';

export default function Deposits() {
  const { transactions, deleteTransaction } = useTransactions();
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Depositi/Prelievi</h1>
        <Button onClick={() => setShowTransactionForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Movimento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimenti Registrati</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
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
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-xs font-semibold uppercase">#</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Metodo</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Registrato</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Conto</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Addebito</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Accredito</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Wallet</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Descrizione</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, idx) => (
                    <tr key={transaction.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="p-3 text-sm">{idx + 1}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            transaction.metodo === 'Deposito'
                              ? 'success'
                              : transaction.metodo === 'Prelievo'
                              ? 'info'
                              : 'warning'
                          }
                        >
                          {transaction.metodo}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">{formatDateTime(transaction.registrato)}</td>
                      <td className="p-3 text-sm">{transaction.conto}</td>
                      <td className="p-3 text-sm font-semibold text-success">
                        {transaction.addebito ? formatCurrency(transaction.addebito) : '-'}
                      </td>
                      <td className="p-3 text-sm font-semibold text-destructive">
                        {transaction.accredito ? formatCurrency(transaction.accredito) : '-'}
                      </td>
                      <td className="p-3 text-sm">{transaction.wallet || '-'}</td>
                      <td className="p-3 text-sm">{transaction.descrizione || '-'}</td>
                      <td className="p-3">
                        <Button size="sm" variant="destructive" onClick={() => deleteTransaction(transaction.id)}>
                          Elimina
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-sm text-muted-foreground">
                Visualizzo 1-{transactions.length} di {transactions.length} elementi
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionForm open={showTransactionForm} onOpenChange={setShowTransactionForm} />
    </div>
  );
}
