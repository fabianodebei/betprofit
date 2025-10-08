import { useMemo, useState } from 'react';
import { Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBets } from '@/contexts/BetContext';
import { useAccounts } from '@/contexts/AccountContext';
import { useYear } from '@/contexts/YearContext';
import { formatCurrency } from '@/utils/currency';

type MonthlyData = {
  [key: number]: number; // month (0-11) => amount
};

type RedditometroEntry = {
  intestatario: string;
  conto: string;
  monthly: MonthlyData;
  total: number;
};

type IntestatarioSummary = {
  intestatario: string;
  monthly: MonthlyData;
  total: number;
};

export default function Redditometro() {
  const { bets } = useBets();
  const { accounts } = useAccounts();
  const { selectedYear } = useYear();
  
  const [filterIntestatario, setFilterIntestatario] = useState('');
  const [filterConto, setFilterConto] = useState('');
  const [filterIntestatarioDetail, setFilterIntestatarioDetail] = useState('');

  // Calculate redditometro data from archived bets
  const redditometroData = useMemo(() => {
    const data: RedditometroEntry[] = [];
    const archivedBets = bets.filter(bet => 
      bet.stato === 'Archiviata' && 
      bet.risultato !== undefined &&
      bet.dataEvento.getFullYear() === selectedYear
    );
    
    // Group by intestatario and conto
    const grouped = new Map<string, RedditometroEntry>();
    
    archivedBets.forEach(bet => {
      const accountInfo = accounts.find(acc => acc.conto === bet.conto);
      if (!accountInfo) return;
      
      const key = `${accountInfo.intestatario}|${bet.conto}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          intestatario: accountInfo.intestatario,
          conto: bet.conto,
          monthly: {},
          total: 0,
        });
      }
      
      const entry = grouped.get(key)!;
      const month = bet.dataEvento.getMonth();
      entry.monthly[month] = (entry.monthly[month] || 0) + (bet.risultato || 0);
      entry.total += bet.risultato || 0;
    });
    
    return Array.from(grouped.values());
  }, [bets, accounts, selectedYear]);

  // Calculate intestatario summary
  const intestatarioSummary = useMemo(() => {
    const summary = new Map<string, IntestatarioSummary>();
    
    redditometroData.forEach(entry => {
      if (!summary.has(entry.intestatario)) {
        summary.set(entry.intestatario, {
          intestatario: entry.intestatario,
          monthly: {},
          total: 0,
        });
      }
      
      const sum = summary.get(entry.intestatario)!;
      Object.entries(entry.monthly).forEach(([month, value]) => {
        const m = parseInt(month);
        sum.monthly[m] = (sum.monthly[m] || 0) + value;
      });
      sum.total += entry.total;
    });
    
    return Array.from(summary.values());
  }, [redditometroData]);

  // Calculate total redditometro
  const totalRedditometro = useMemo(() => {
    return redditometroData.reduce((sum, entry) => sum + entry.total, 0);
  }, [redditometroData]);

  // Filter data for sommario
  const filteredSommario = useMemo(() => {
    return redditometroData.filter(entry => {
      if (filterIntestatario && !entry.intestatario.toLowerCase().includes(filterIntestatario.toLowerCase())) return false;
      if (filterConto && !entry.conto.toLowerCase().includes(filterConto.toLowerCase())) return false;
      return true;
    });
  }, [redditometroData, filterIntestatario, filterConto]);

  // Filter data for dettaglio
  const filteredDettaglio = useMemo(() => {
    return intestatarioSummary.filter(entry => {
      if (filterIntestatarioDetail && !entry.intestatario.toLowerCase().includes(filterIntestatarioDetail.toLowerCase())) return false;
      return true;
    });
  }, [intestatarioSummary, filterIntestatarioDetail]);

  const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

  const renderValue = (value: number) => {
    if (value === 0) return '0,00 €';
    return (
      <span style={{ color: value < 0 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
        {formatCurrency(value)}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="rounded-full bg-yellow-500 p-3">
          <Scale className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Redditometro</h1>
          <p className="text-sm text-muted-foreground mt-1">
            TOTALE REDDITOMETRO: <span className="font-bold text-foreground">{formatCurrency(totalRedditometro)}</span>
          </p>
        </div>
      </div>

      <Tabs defaultValue="sommario" className="w-full">
        <TabsList>
          <TabsTrigger value="sommario">Sommario</TabsTrigger>
          <TabsTrigger value="dettaglio">Dettaglio</TabsTrigger>
        </TabsList>

        <TabsContent value="sommario" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="p-4 text-sm text-muted-foreground">
                Visualizzo 1-{filteredSommario.length} di {redditometroData.length} elementi.
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="p-3 text-left text-xs font-semibold sticky left-0 bg-muted/30 z-10">Intestatario</th>
                      <th className="p-3 text-left text-xs font-semibold sticky left-[150px] bg-muted/30 z-10">Conto</th>
                      {months.map(month => (
                        <th key={month} className="p-3 text-left text-xs font-semibold whitespace-nowrap">{month}</th>
                      ))}
                      <th className="p-3 text-left text-xs font-semibold whitespace-nowrap">Totale Anno</th>
                    </tr>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 sticky left-0 bg-muted/50 z-10">
                        <Input
                          placeholder="Filtra Intestatario"
                          value={filterIntestatario}
                          onChange={(e) => setFilterIntestatario(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </th>
                      <th className="p-2 sticky left-[150px] bg-muted/50 z-10">
                        <Input
                          placeholder="Filtra Conto"
                          value={filterConto}
                          onChange={(e) => setFilterConto(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </th>
                      {months.map((_, idx) => (
                        <th key={idx} className="p-2"></th>
                      ))}
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSommario.map((entry, idx) => (
                      <tr key={`${entry.intestatario}-${entry.conto}-${idx}`} className="border-b hover:bg-muted/20">
                        <td className="p-3 text-sm sticky left-0 bg-background">{entry.intestatario}</td>
                        <td className="p-3 text-sm sticky left-[150px] bg-background">{entry.conto}</td>
                        {months.map((_, monthIdx) => (
                          <td key={monthIdx} className="p-3 text-sm whitespace-nowrap">
                            {renderValue(entry.monthly[monthIdx] || 0)}
                          </td>
                        ))}
                        <td className="p-3 text-sm font-semibold whitespace-nowrap">
                          {renderValue(entry.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dettaglio" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Redditometro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-muted-foreground">
                Visualizzo 1-{filteredDettaglio.length} di {intestatarioSummary.length} elementi.
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="p-3 text-left text-xs font-semibold">Intestatario</th>
                      {months.map(month => (
                        <th key={month} className="p-3 text-left text-xs font-semibold whitespace-nowrap">{month}</th>
                      ))}
                      <th className="p-3 text-left text-xs font-semibold whitespace-nowrap">Totale Anno</th>
                    </tr>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2">
                        <Input
                          placeholder="Filtra Intestatario"
                          value={filterIntestatarioDetail}
                          onChange={(e) => setFilterIntestatarioDetail(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </th>
                      {months.map((_, idx) => (
                        <th key={idx} className="p-2"></th>
                      ))}
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDettaglio.map((entry, idx) => (
                      <tr key={`${entry.intestatario}-${idx}`} className="border-b hover:bg-muted/20">
                        <td className="p-3 text-sm">{entry.intestatario}</td>
                        {months.map((_, monthIdx) => (
                          <td key={monthIdx} className="p-3 text-sm whitespace-nowrap">
                            {renderValue(entry.monthly[monthIdx] || 0)}
                          </td>
                        ))}
                        <td className="p-3 text-sm font-semibold whitespace-nowrap">
                          {renderValue(entry.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
