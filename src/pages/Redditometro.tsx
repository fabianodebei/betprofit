import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTransactions } from '@/contexts/TransactionContext';
import { useAccounts } from '@/contexts/AccountContext';
import { useYear } from '@/contexts/YearContext';
import { formatCurrency } from '@/utils/currency';

type MonthlyData = {
  [key: number]: number; // Solo il netto per ogni mese
};

type IntestatarioSummary = {
  intestatario: string;
  monthly: MonthlyData;
  totalNetto: number;
};

export default function Redditometro() {
  const navigate = useNavigate();
  const { transactions } = useTransactions();
  const { accounts } = useAccounts();
  const { selectedYear } = useYear();
  
  const [filterIntestatario, setFilterIntestatario] = useState('');

  // Calculate intestatario summary - raggruppa per intestatario
  const intestatarioSummary = useMemo(() => {
    const filteredTransactions = transactions.filter(transaction => 
      transaction.registrato.getFullYear() === selectedYear
    );
    
    const summary = new Map<string, IntestatarioSummary>();
    
    filteredTransactions.forEach(transaction => {
      const accountInfo = accounts.find(acc => acc.conto === transaction.conto);
      if (!accountInfo) return;
      
      if (!summary.has(accountInfo.intestatario)) {
        summary.set(accountInfo.intestatario, {
          intestatario: accountInfo.intestatario,
          monthly: {},
          totalNetto: 0,
        });
      }
      
      const entry = summary.get(accountInfo.intestatario)!;
      const month = transaction.registrato.getMonth();
      
      if (!entry.monthly[month]) {
        entry.monthly[month] = 0;
      }
      
      const accredito = transaction.accredito || 0;
      const addebito = transaction.addebito || 0;
      // Per il redditometro: depositi (addebito) sono negativi, prelievi (accredito) sono positivi
      const netto = addebito - accredito;
      
      entry.monthly[month] += netto;
      entry.totalNetto += netto;
    });
    
    return Array.from(summary.values());
  }, [transactions, accounts, selectedYear]);

  // Calculate total redditometro
  const totalRedditometro = useMemo(() => {
    return intestatarioSummary.reduce((sum, entry) => sum + entry.totalNetto, 0);
  }, [intestatarioSummary]);

  // Filter data
  const filteredData = useMemo(() => {
    return intestatarioSummary.filter(entry => {
      if (filterIntestatario && !entry.intestatario.toLowerCase().includes(filterIntestatario.toLowerCase())) return false;
      return true;
    });
  }, [intestatarioSummary, filterIntestatario]);

  const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

  const renderValue = (value: number) => {
    if (value === 0) return <span className="text-muted-foreground">0,00 €</span>;
    return (
      <span className={value < 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
        {formatCurrency(value)}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-yellow-500 p-3">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Redditometro</h1>
            <p className="text-muted-foreground mt-2">
              Totale Anno: <span className="font-bold text-foreground">{renderValue(totalRedditometro)}</span>
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/impostazioni')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alle Impostazioni
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riepilogo per Intestatario</CardTitle>
          <p className="text-sm text-muted-foreground">
            Visualizzo {filteredData.length} di {intestatarioSummary.length} intestatari
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Cerca intestatario..."
              value={filterIntestatario}
              onChange={(e) => setFilterIntestatario(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left text-sm font-semibold sticky left-0 bg-muted/50 z-10">Intestatario</th>
                  {months.map((month, idx) => (
                    <th key={idx} className="p-4 text-center text-sm font-semibold whitespace-nowrap border-l">
                      {month}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((entry, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/10 transition-colors">
                    <td className="p-4 text-sm font-medium sticky left-0 bg-background">{entry.intestatario}</td>
                    {months.map((_, monthIdx) => {
                      const value = entry.monthly[monthIdx] || 0;
                      return (
                        <td key={monthIdx} className="p-4 text-sm text-center whitespace-nowrap border-l">
                          {renderValue(value)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
