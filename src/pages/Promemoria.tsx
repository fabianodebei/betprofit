import { useState } from 'react';
import { Plus, Clock, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { useReminders } from '@/contexts/ReminderContext';
import { ReminderForm } from '@/components/forms/ReminderForm';
import { formatDateTime } from '@/utils/dates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
export default function Promemoria() {
  const {
    reminders,
    deleteReminder,
    updateReminder
  } = useReminders();
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [filterMetodo, setFilterMetodo] = useState('all');
  const [filterConto, setFilterConto] = useState('all');
  const [filterStato, setFilterStato] = useState('all');
  const [testing, setTesting] = useState(false);
  const {
    toast
  } = useToast();
  const filteredReminders = reminders.filter(reminder => {
    if (filterMetodo !== 'all' && reminder.metodo !== filterMetodo) return false;
    if (filterConto !== 'all' && filterConto && reminder.conto && !reminder.conto.toLowerCase().includes(filterConto.toLowerCase())) return false;
    if (filterStato !== 'all' && reminder.stato !== filterStato) return false;
    return true;
  });
  const handleMarkAsRead = async (id: string) => {
    await updateReminder(id, {
      stato: 'Letto'
    });
  };
  const handleTestNotifications = async () => {
    setTesting(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('test-notifications', {
        body: {}
      });
      if (error) throw error;
      toast({
        title: 'Test completato',
        description: 'Controlla il tuo Telegram per le notifiche!'
      });
      console.log('Test result:', data);
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message || 'Errore durante il test delle notifiche',
        variant: 'destructive'
      });
      console.error('Test error:', error);
    } finally {
      setTesting(false);
    }
  };
  return <div className="container mx-auto px-4 py-8">
      <h1 className="mb-4 text-3xl font-bold text-foreground">Promemoria</h1>
      
      <div className="mb-6 flex gap-2">
        <Button onClick={() => setShowReminderForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Promemoria
        </Button>
        
      </div>

      <Card>
        <CardContent className="p-0">
          {reminders.length === 0 ? <div className="p-8">
              <EmptyState icon={Clock} title="Nessun promemoria attivo" description="Inizia a creare promemoria per le tue attività." action={<Button onClick={() => setShowReminderForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuovo Promemoria
                  </Button>} />
            </div> : <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left text-xs font-semibold">#</th>
                    <th className="p-3 text-left text-xs font-semibold">Data Di Scadenza</th>
                    <th className="p-3 text-left text-xs font-semibold">Metodo</th>
                    <th className="p-3 text-left text-xs font-semibold">Conto</th>
                    <th className="p-3 text-left text-xs font-semibold">Stato</th>
                    <th className="p-3 text-left text-xs font-semibold">Opzioni</th>
                  </tr>
                  <tr className="border-b bg-muted/30">
                    <th className="p-2"></th>
                    <th className="p-2"></th>
                    <th className="p-2">
                      <Select value={filterMetodo} onValueChange={setFilterMetodo}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Seleziona Metodo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tutti</SelectItem>
                          <SelectItem value="Bonus Benvenuto">Bonus Benvenuto</SelectItem>
                          <SelectItem value="Bonus Personale">Bonus Personale</SelectItem>
                          <SelectItem value="Bonus Ricorrente">Bonus Ricorrente</SelectItem>
                          <SelectItem value="Promemoria Generico">Promemoria Generico</SelectItem>
                        </SelectContent>
                      </Select>
                    </th>
                    <th className="p-2">
                      <Select value={filterConto} onValueChange={setFilterConto}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Filtra Conto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tutti</SelectItem>
                        </SelectContent>
                      </Select>
                    </th>
                    <th className="p-2">
                      <Select value={filterStato} onValueChange={setFilterStato}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Seleziona Stato" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tutti</SelectItem>
                          <SelectItem value="Nuovo">Nuovo</SelectItem>
                          <SelectItem value="Letto">Letto</SelectItem>
                        </SelectContent>
                      </Select>
                    </th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReminders.length === 0 ? <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Nessun risultato trovato
                      </td>
                    </tr> : filteredReminders.map((reminder, idx) => <tr key={reminder.id} className="border-b hover:bg-muted/20">
                        <td className="p-3 text-sm">{idx + 1}</td>
                        <td className="p-3 text-sm">{formatDateTime(reminder.dataScadenza)}</td>
                        <td className="p-3 text-sm">{reminder.metodo}</td>
                        <td className="p-3 text-sm">{reminder.conto || '-'}</td>
                        <td className="p-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${reminder.stato === 'Nuovo' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>
                            {reminder.stato}
                          </span>
                        </td>
                        <td className="p-3 space-x-2">
                          {reminder.stato === 'Nuovo' && <Button size="sm" variant="outline" onClick={() => handleMarkAsRead(reminder.id)}>
                              Segna come letto
                            </Button>}
                          <Button size="sm" variant="destructive" onClick={() => deleteReminder(reminder.id)}>
                            Elimina
                          </Button>
                        </td>
                      </tr>)}
                </tbody>
              </table>
            </div>}
        </CardContent>
      </Card>

      <ReminderForm open={showReminderForm} onOpenChange={setShowReminderForm} />
    </div>;
}