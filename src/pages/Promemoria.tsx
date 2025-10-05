import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';

export default function Promemoria() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Promemoria</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Promemoria e Notifiche</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Clock}
            title="Nessun promemoria attivo"
            description="Questa sezione sarà disponibile per gestire promemoria e notifiche."
          />
        </CardContent>
      </Card>
    </div>
  );
}
