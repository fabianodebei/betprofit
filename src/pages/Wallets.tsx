import { useState } from 'react';
import { Plus, Wallet as WalletIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { useWallets } from '@/contexts/WalletContext';
import { formatCurrency } from '@/utils/currency';

export default function Wallets() {
  const { wallets, getTotalBalance } = useWallets();
  const [activeTab, setActiveTab] = useState<'nuovo' | 'trasferisci' | 'ricarica'>('nuovo');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Wallets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Saldo Corrente: <span className="font-semibold text-foreground">{formatCurrency(getTotalBalance())}</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b">
        <Button
          variant={activeTab === 'nuovo' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('nuovo')}
          className="rounded-b-none"
        >
          Nuovo Wallet
        </Button>
        <Button
          variant={activeTab === 'trasferisci' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('trasferisci')}
          className="rounded-b-none"
        >
          Trasferisci
        </Button>
        <Button
          variant={activeTab === 'ricarica' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('ricarica')}
          className="rounded-b-none"
        >
          Ricarica/Spesa
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista Wallets</CardTitle>
        </CardHeader>
        <CardContent>
          {wallets.length === 0 ? (
            <EmptyState
              icon={WalletIcon}
              title="Nessun wallet presente"
              description="Clicca 'Nuovo Wallet' per iniziare a gestire i tuoi portafogli."
              action={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuovo Wallet
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-xs font-semibold uppercase">Intestatario</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Nome</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Descrizione</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Saldo Attuale</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Stato</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((wallet, idx) => (
                    <tr key={wallet.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="p-3 text-sm">{wallet.intestatario}</td>
                      <td className="p-3 text-sm font-medium">{wallet.nome}</td>
                      <td className="p-3 text-sm">{wallet.descrizione || '-'}</td>
                      <td className="p-3 text-sm font-semibold">{formatCurrency(wallet.saldoAttuale)}</td>
                      <td className="p-3">
                        <Badge variant={wallet.stato === 'Abilitato' ? 'success' : 'secondary'}>
                          {wallet.stato}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Button size="sm" variant="outline">
                          Modifica
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-sm text-muted-foreground">
                Visualizzo 1-{wallets.length} di {wallets.length} elementi
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
