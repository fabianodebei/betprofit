import { useMemo, useState } from 'react';
import { Scale } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransactions } from '@/contexts/TransactionContext';
import { useAccounts } from '@/contexts/AccountContext';
import { useYear } from '@/contexts/YearContext';
import { formatCurrency } from '@/utils/currency';

type MonthlyData = {
  [key: number]: {
    entrate: number;
    uscite: number;
    netto: number;
  };
};

type RedditometroEntry = {
  intestatario: string;
  conto: string;
  monthly: MonthlyData;
  totalEntrate: number;
  totalUscite: number;
  totalNetto: number;
};

type IntestatarioSummary = {
  intestatario: string;
  monthly: MonthlyData;
  totalEntrate: number;
  totalUscite: number;
  totalNetto: number;
};

export default function Redditometro() {
  const { transactions } = useTransactions();
  const { accounts } = useAccounts();
  const { selectedYear } = useYear();
  
  const [filterIntestatario, setFilterIntestatario] = useState('');
  const [filterConto, setFilterConto] = useState('');
  const [filterIntestatarioDetail, setFilterIntestatarioDetail] = useState('');

  // Calculate redditometro data from transactions
  const redditometroData = useMemo(() => {
    const filteredTransactions = transactions.filter(transaction => 
      transaction.registrato.getFullYear() === selectedYear
    );
    
    // Group by intestatario and conto
    const grouped = new Map<string, RedditometroEntry>();
    
    filteredTransactions.forEach(transaction => {
      const accountInfo = accounts.find(acc => acc.conto === transaction.conto);
      if (!accountInfo) return;
      
      const key = `${accountInfo.intestatario}|${transaction.conto}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          intestatario: accountInfo.intestatario,
          conto: transaction.conto,
          monthly: {},
          totalEntrate: 0,
          totalUscite: 0,
          totalNetto: 0,
        });
      }
      
      const entry = grouped.get(key)!;
      const month = transaction.registrato.getMonth();
      
      if (!entry.monthly[month]) {
        entry.monthly[month] = { entrate: 0, uscite: 0, netto: 0 };
      }
      
      const accredito = transaction.accredito || 0;
      const addebito = transaction.addebito || 0;
      
      entry.monthly[month].entrate += accredito;
      entry.monthly[month].uscite += addebito;
      entry.monthly[month].netto += (accredito - addebito);
      
      entry.totalEntrate += accredito;
      entry.totalUscite += addebito;
      entry.totalNetto += (accredito - addebito);
    });
    
    return Array.from(grouped.values());
  }, [transactions, accounts, selectedYear]);

  // Calculate intestatario summary
  const intestatarioSummary = useMemo(() => {
    const summary = new Map<string, IntestatarioSummary>();
    
    redditometroData.forEach(entry => {
      if (!summary.has(entry.intestatario)) {
        summary.set(entry.intestatario, {
          intestatario: entry.intestatario,
          monthly: {},
          totalEntrate: 0,
          totalUscite: 0,
          totalNetto: 0,
        });
      }
      
      const sum = summary.get(entry.intestatario)!;
      Object.entries(entry.monthly).forEach(([month, data]) => {
        const m = parseInt(month);
        if (!sum.monthly[m]) {
          sum.monthly[m] = { entrate: 0, uscite: 0, netto: 0 };
        }
        sum.monthly[m].entrate += data.entrate;
        sum.monthly[m].uscite += data.uscite;
        sum.monthly[m].netto += data.netto;
      });
      sum.totalEntrate += entry.totalEntrate;
      sum.totalUscite += entry.totalUscite;
      sum.totalNetto += entry.totalNetto;
    });
    
    return Array.from(summary.values());
  }, [redditometroData]);

  // Calculate total redditometro
  const totalRedditometro = useMemo(() => {
    return {
      entrate: redditometroData.reduce((sum, entry) => sum + entry.totalEntrate, 0),
      uscite: redditometroData.reduce((sum, entry) => sum + entry.totalUscite, 0),
      netto: redditometroData.reduce((sum, entry) => sum + entry.totalNetto, 0),
    };
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
    <div className="container mx-auto px-4 py-8 max-w-[1600px]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">Redditometro</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Entrate Totali</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalRedditometro.entrate)}</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Uscite Totali</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalRedditometro.uscite)}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Netto</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalRedditometro.netto)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="sommario" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="sommario">Sommario</TabsTrigger>
          <TabsTrigger value="dettaglio">Dettaglio</TabsTrigger>
        </TabsList>

        <TabsContent value="sommario" className="mt-6">
          <Card className="border-2">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Sommario per Conto</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {filteredSommario.length} di {redditometroData.length} elementi
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="p-4 text-left text-sm font-semibold sticky left-0 bg-muted/20 z-10" rowSpan={2}>Intestatario</th>
                      <th className="p-4 text-left text-sm font-semibold sticky left-[180px] bg-muted/20 z-10" rowSpan={2}>Conto</th>
                      {months.map(month => (
                        <th key={month} colSpan={3} className="p-4 text-center text-sm font-semibold whitespace-nowrap border-l">{month}</th>
                      ))}
                      <th colSpan={3} className="p-4 text-center text-sm font-semibold whitespace-nowrap border-l bg-muted/30">Totale Anno</th>
                    </tr>
                    <tr className="border-b bg-muted/10">
                      {months.map((_, idx) => (
                        <>
                          <th key={`${idx}-e`} className="p-3 text-center text-xs font-medium text-green-600 border-l">E</th>
                          <th key={`${idx}-u`} className="p-3 text-center text-xs font-medium text-red-600">U</th>
                          <th key={`${idx}-n`} className="p-3 text-center text-xs font-medium text-blue-600">N</th>
                        </>
                      ))}
                      <th className="p-3 text-center text-xs font-medium text-green-600 border-l bg-muted/30">E</th>
                      <th className="p-3 text-center text-xs font-medium text-red-600 bg-muted/30">U</th>
                      <th className="p-3 text-center text-xs font-medium text-blue-600 bg-muted/30">N</th>
                    </tr>
                    <tr className="border-b">
                      <th className="p-3 sticky left-0 bg-background z-10">
                        <Input
                          placeholder="Cerca intestatario..."
                          value={filterIntestatario}
                          onChange={(e) => setFilterIntestatario(e.target.value)}
                          className="h-10 rounded-lg"
                        />
                      </th>
                      <th className="p-3 sticky left-[180px] bg-background z-10">
                        <Input
                          placeholder="Cerca conto..."
                          value={filterConto}
                          onChange={(e) => setFilterConto(e.target.value)}
                          className="h-10 rounded-lg"
                        />
                      </th>
                      {months.map((_, idx) => (
                        <>
                          <th key={`${idx}-e`} className="p-2 border-l"></th>
                          <th key={`${idx}-u`} className="p-2"></th>
                          <th key={`${idx}-n`} className="p-2"></th>
                        </>
                      ))}
                      <th className="p-2 border-l"></th>
                      <th className="p-2"></th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSommario.map((entry, idx) => (
                      <tr key={`${entry.intestatario}-${entry.conto}-${idx}`} className="border-b hover:bg-muted/10 transition-colors">
                        <td className="p-4 text-sm font-medium sticky left-0 bg-background">{entry.intestatario}</td>
                        <td className="p-4 text-sm sticky left-[180px] bg-background">{entry.conto}</td>
                        {months.map((_, monthIdx) => {
                          const data = entry.monthly[monthIdx] || { entrate: 0, uscite: 0, netto: 0 };
                          return (
                            <>
                              <td key={`${monthIdx}-e`} className="p-3 text-sm text-center whitespace-nowrap border-l">
                                {renderValue(data.entrate)}
                              </td>
                              <td key={`${monthIdx}-u`} className="p-3 text-sm text-center whitespace-nowrap">
                                {renderValue(-data.uscite)}
                              </td>
                              <td key={`${monthIdx}-n`} className="p-3 text-sm text-center whitespace-nowrap">
                                {renderValue(data.netto)}
                              </td>
                            </>
                          );
                        })}
                        <td className="p-3 text-sm font-bold text-center whitespace-nowrap border-l bg-muted/20">
                          {renderValue(entry.totalEntrate)}
                        </td>
                        <td className="p-3 text-sm font-bold text-center whitespace-nowrap bg-muted/20">
                          {renderValue(-entry.totalUscite)}
                        </td>
                        <td className="p-3 text-sm font-bold text-center whitespace-nowrap bg-muted/20">
                          {renderValue(entry.totalNetto)}
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
          <Card className="border-2">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Dettaglio per Intestatario</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {filteredDettaglio.length} di {intestatarioSummary.length} elementi
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="p-4 text-left text-sm font-semibold" rowSpan={2}>Intestatario</th>
                      {months.map(month => (
                        <th key={month} colSpan={3} className="p-4 text-center text-sm font-semibold whitespace-nowrap border-l">{month}</th>
                      ))}
                      <th colSpan={3} className="p-4 text-center text-sm font-semibold whitespace-nowrap border-l bg-muted/30">Totale Anno</th>
                    </tr>
                    <tr className="border-b bg-muted/10">
                      {months.map((_, idx) => (
                        <>
                          <th key={`${idx}-e`} className="p-3 text-center text-xs font-medium text-green-600 border-l">E</th>
                          <th key={`${idx}-u`} className="p-3 text-center text-xs font-medium text-red-600">U</th>
                          <th key={`${idx}-n`} className="p-3 text-center text-xs font-medium text-blue-600">N</th>
                        </>
                      ))}
                      <th className="p-3 text-center text-xs font-medium text-green-600 border-l bg-muted/30">E</th>
                      <th className="p-3 text-center text-xs font-medium text-red-600 bg-muted/30">U</th>
                      <th className="p-3 text-center text-xs font-medium text-blue-600 bg-muted/30">N</th>
                    </tr>
                    <tr className="border-b">
                      <th className="p-3">
                        <Input
                          placeholder="Cerca intestatario..."
                          value={filterIntestatarioDetail}
                          onChange={(e) => setFilterIntestatarioDetail(e.target.value)}
                          className="h-10 rounded-lg"
                        />
                      </th>
                      {months.map((_, idx) => (
                        <>
                          <th key={`${idx}-e`} className="p-2 border-l"></th>
                          <th key={`${idx}-u`} className="p-2"></th>
                          <th key={`${idx}-n`} className="p-2"></th>
                        </>
                      ))}
                      <th className="p-2 border-l"></th>
                      <th className="p-2"></th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDettaglio.map((entry, idx) => (
                      <tr key={`${entry.intestatario}-${idx}`} className="border-b hover:bg-muted/10 transition-colors">
                        <td className="p-4 text-sm font-medium">{entry.intestatario}</td>
                        {months.map((_, monthIdx) => {
                          const data = entry.monthly[monthIdx] || { entrate: 0, uscite: 0, netto: 0 };
                          return (
                            <>
                              <td key={`${monthIdx}-e`} className="p-3 text-sm text-center whitespace-nowrap border-l">
                                {renderValue(data.entrate)}
                              </td>
                              <td key={`${monthIdx}-u`} className="p-3 text-sm text-center whitespace-nowrap">
                                {renderValue(-data.uscite)}
                              </td>
                              <td key={`${monthIdx}-n`} className="p-3 text-sm text-center whitespace-nowrap">
                                {renderValue(data.netto)}
                              </td>
                            </>
                          );
                        })}
                        <td className="p-3 text-sm font-bold text-center whitespace-nowrap border-l bg-muted/20">
                          {renderValue(entry.totalEntrate)}
                        </td>
                        <td className="p-3 text-sm font-bold text-center whitespace-nowrap bg-muted/20">
                          {renderValue(-entry.totalUscite)}
                        </td>
                        <td className="p-3 text-sm font-bold text-center whitespace-nowrap bg-muted/20">
                          {renderValue(entry.totalNetto)}
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
