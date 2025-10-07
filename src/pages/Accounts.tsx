import { useState } from 'react';
import { Plus, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccountForm } from '@/components/forms/AccountForm';
import { TransactionForm } from '@/components/forms/TransactionForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { useAccounts } from '@/contexts/AccountContext';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/dates';
import { Account } from '@/types';

export default function Accounts() {
  const { accounts } = useAccounts();
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setShowAccountForm(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Conti</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Esporta Conti
          </Button>
          <Button onClick={() => setShowAccountForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Conto
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista Conti Bookmaker</CardTitle>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nessun conto presente"
              description="Aggiungi il tuo primo conto bookmaker per iniziare a tracciare le tue puntate."
              action={
                <Button onClick={() => setShowAccountForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuovo Conto
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-xs font-semibold uppercase">#</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Creato</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Intestatario</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Conto</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Descrizione</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Saldo Attuale</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Stato</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account, idx) => (
                    <tr key={account.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="p-3 text-sm">{idx + 1}</td>
                      <td className="p-3 text-sm">{formatDate(account.createdAt)}</td>
                      <td className="p-3 text-sm">{account.intestatario}</td>
                      <td className="p-3 text-sm font-medium">{account.conto}</td>
                      <td className="p-3 text-sm">{account.descrizione || '-'}</td>
                      <td className="p-3 text-sm font-semibold">{formatCurrency(account.saldoAttuale)}</td>
                      <td className="p-3">
                        <Badge variant={account.stato === 'Abilitato' ? 'success' : 'secondary'}>
                          {account.stato}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setShowTransactionForm(true)}>
                            Nuovo Movimento
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(account)}>
                            Modifica
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-sm text-muted-foreground">
                Visualizzo 1-{accounts.length} di {accounts.length} elementi
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AccountForm 
        open={showAccountForm} 
        onOpenChange={(open) => {
          setShowAccountForm(open);
          if (!open) setEditingAccount(null);
        }} 
        editingAccount={editingAccount}
      />
      <TransactionForm open={showTransactionForm} onOpenChange={setShowTransactionForm} />
    </div>
  );
}
