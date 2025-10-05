import { Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { useBets } from '@/contexts/BetContext';
import { formatCurrency } from '@/utils/currency';
import { formatDateTime } from '@/utils/dates';

export default function QuickBets() {
  const { getQuickBets } = useBets();
  const quickBets = getQuickBets();

  const totalQuickBets = quickBets.reduce((sum, bet) => sum + bet.stake, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Giocate Rapide</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Saldo Giocate Rapide: <span className="font-semibold text-foreground">{formatCurrency(totalQuickBets)}</span>
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuova Giocata
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista Giocate Rapide</CardTitle>
        </CardHeader>
        <CardContent>
          {quickBets.length === 0 ? (
            <EmptyState
              icon={Zap}
              title="Nessuna giocata rapida registrata"
              description="Le giocate rapide permettono di tracciare velocemente le tue puntate."
              action={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuova Giocata
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-xs font-semibold uppercase">#</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Registrato</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Conto</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Metodo</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Tag</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Note</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Movimento</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {quickBets.map((bet, idx) => (
                    <tr key={bet.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="p-3 text-sm">{idx + 1}</td>
                      <td className="p-3 text-sm">{formatDateTime(bet.createdAt)}</td>
                      <td className="p-3 text-sm">{bet.conto}</td>
                      <td className="p-3 text-sm">{bet.metodo || '-'}</td>
                      <td className="p-3 text-sm">{bet.tag || '-'}</td>
                      <td className="p-3 text-sm">{bet.note || '-'}</td>
                      <td className="p-3 text-sm font-semibold">{formatCurrency(bet.stake)}</td>
                      <td className="p-3">
                        <Button size="sm" variant="destructive">
                          Elimina
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-sm text-muted-foreground">
                Visualizzo 1-{quickBets.length} di {quickBets.length} elementi
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
