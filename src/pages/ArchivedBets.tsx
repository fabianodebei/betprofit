import { Archive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/ui/button';
import { useBets } from '@/contexts/BetContext';
import { useYear } from '@/contexts/YearContext';
import { formatCurrency } from '@/utils/currency';
import { formatDate } from '@/utils/dates';

export default function ArchivedBets() {
  const { getArchivedBets, reopenBet, deleteBet } = useBets();
  const { selectedYear } = useYear();
  const allArchivedBets = getArchivedBets();
  const archivedBets = allArchivedBets.filter(bet => bet.dataEvento.getFullYear() === selectedYear);

  const totalArchived = archivedBets.reduce((sum, bet) => sum + (bet.risultato || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Giocate Archiviate</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Totale: <span className="font-semibold text-foreground">{formatCurrency(totalArchived)}</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Storico Puntate</CardTitle>
        </CardHeader>
        <CardContent>
          {archivedBets.length === 0 ? (
            <EmptyState
              icon={Archive}
              title="Nessuna giocata archiviata"
              description="Le puntate completate appariranno qui una volta archiviate."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-xs font-semibold uppercase">ID</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Data Evento</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Evento</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Tipo Bonus</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Conto</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Tag</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Note</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Totale GM</th>
                    <th className="p-3 text-left text-xs font-semibold uppercase">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {archivedBets.map((bet, idx) => (
                    <tr key={bet.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="p-3 text-sm font-medium">{bet.id}</td>
                      <td className="p-3 text-sm">{formatDate(bet.dataEvento)}</td>
                      <td className="p-3 text-sm">{bet.evento || bet.nomeGioco || '-'}</td>
                      <td className="p-3">
                        <Badge variant="secondary">{bet.tipoBonus || 'Nessuno'}</Badge>
                      </td>
                      <td className="p-3 text-sm">{bet.conto}</td>
                      <td className="p-3">
                        {bet.tag && <Badge variant="outline">{bet.tag}</Badge>}
                      </td>
                      <td className="p-3 text-sm">{bet.note || '-'}</td>
                      <td className="p-3">
                        <span className={`font-semibold ${bet.risultato && bet.risultato > 0 ? 'text-success' : bet.risultato && bet.risultato < 0 ? 'text-destructive' : ''}`}>
                          {formatCurrency(bet.risultato || 0)}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => reopenBet(bet.id)}>Riapri</Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteBet(bet.id)}>Elimina</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-sm text-muted-foreground">
                Visualizzo 1-{archivedBets.length} di {archivedBets.length} elementi
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
