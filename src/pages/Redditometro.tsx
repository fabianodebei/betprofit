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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <div className="rounded-full bg-yellow-500 p-3">
          <Scale className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Redditometro</h1>
          <div className="flex gap-4 mt-2 text-sm">
            <p className="text-muted-foreground">
              Entrate: <span className="font-bold text-green-500">{formatCurrency(totalRedditometro.entrate)}</span>
            </p>
            <p className="text-muted-foreground">
              Uscite: <span className="font-bold text-red-500">{formatCurrency(totalRedditometro.uscite)}</span>
            </p>
            <p className="text-muted-foreground">
              Netto: <span className="font-bold text-foreground">{formatCurrency(totalRedditometro.netto)}</span>
            </p>
          </div>
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
                      <th className="p-3 text-left text-xs font-semibold sticky left-0 bg-muted/30 z-10" rowSpan={2}>Intestatario</th>
                      <th className="p-3 text-left text-xs font-semibold sticky left-[150px] bg-muted/30 z-10" rowSpan={2}>Conto</th>
                      {months.map(month => (
                        <th key={month} colSpan={3} className="p-3 text-center text-xs font-semibold whitespace-nowrap border-r">{month}</th>
                      ))}
                      <th colSpan={3} className="p-3 text-center text-xs font-semibold whitespace-nowrap">Totale Anno</th>
                    </tr>
                    <tr className="border-b bg-muted/30">
                      {months.map((_, idx) => (
                        <>
                          <th key={`${idx}-e`} className="p-2 text-center text-xs font-semibold">E</th>
                          <th key={`${idx}-u`} className="p-2 text-center text-xs font-semibold">U</th>
                          <th key={`${idx}-n`} className="p-2 text-center text-xs font-semibold border-r">N</th>
                        </>
                      ))}
                      <th className="p-2 text-center text-xs font-semibold">E</th>
                      <th className="p-2 text-center text-xs font-semibold">U</th>
                      <th className="p-2 text-center text-xs font-semibold">N</th>
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
                        <>
                          <th key={`${idx}-e`} className="p-2"></th>
                          <th key={`${idx}-u`} className="p-2"></th>
                          <th key={`${idx}-n`} className="p-2 border-r"></th>
                        </>
                      ))}
                      <th className="p-2"></th>
                      <th className="p-2"></th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSommario.map((entry, idx) => (
                      <tr key={`${entry.intestatario}-${entry.conto}-${idx}`} className="border-b hover:bg-muted/20">
                        <td className="p-3 text-sm sticky left-0 bg-background">{entry.intestatario}</td>
                        <td className="p-3 text-sm sticky left-[150px] bg-background">{entry.conto}</td>
                        {months.map((_, monthIdx) => {
                          const data = entry.monthly[monthIdx] || { entrate: 0, uscite: 0, netto: 0 };
                          return (
                            <>
                              <td key={`${monthIdx}-e`} className="p-2 text-sm text-center whitespace-nowrap">
                                {renderValue(data.entrate)}
                              </td>
                              <td key={`${monthIdx}-u`} className="p-2 text-sm text-center whitespace-nowrap">
                                {renderValue(-data.uscite)}
                              </td>
                              <td key={`${monthIdx}-n`} className="p-2 text-sm text-center whitespace-nowrap border-r">
                                {renderValue(data.netto)}
                              </td>
                            </>
                          );
                        })}
                        <td className="p-2 text-sm font-semibold text-center whitespace-nowrap">
                          {renderValue(entry.totalEntrate)}
                        </td>
                        <td className="p-2 text-sm font-semibold text-center whitespace-nowrap">
                          {renderValue(-entry.totalUscite)}
                        </td>
                        <td className="p-2 text-sm font-semibold text-center whitespace-nowrap">
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
                      <th className="p-3 text-left text-xs font-semibold" rowSpan={2}>Intestatario</th>
                      {months.map(month => (
                        <th key={month} colSpan={3} className="p-3 text-center text-xs font-semibold whitespace-nowrap border-r">{month}</th>
                      ))}
                      <th colSpan={3} className="p-3 text-center text-xs font-semibold whitespace-nowrap">Totale Anno</th>
                    </tr>
                    <tr className="border-b bg-muted/30">
                      {months.map((_, idx) => (
                        <>
                          <th key={`${idx}-e`} className="p-2 text-center text-xs font-semibold">E</th>
                          <th key={`${idx}-u`} className="p-2 text-center text-xs font-semibold">U</th>
                          <th key={`${idx}-n`} className="p-2 text-center text-xs font-semibold border-r">N</th>
                        </>
                      ))}
                      <th className="p-2 text-center text-xs font-semibold">E</th>
                      <th className="p-2 text-center text-xs font-semibold">U</th>
                      <th className="p-2 text-center text-xs font-semibold">N</th>
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
                        <>
                          <th key={`${idx}-e`} className="p-2"></th>
                          <th key={`${idx}-u`} className="p-2"></th>
                          <th key={`${idx}-n`} className="p-2 border-r"></th>
                        </>
                      ))}
                      <th className="p-2"></th>
                      <th className="p-2"></th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDettaglio.map((entry, idx) => (
                      <tr key={`${entry.intestatario}-${idx}`} className="border-b hover:bg-muted/20">
                        <td className="p-3 text-sm">{entry.intestatario}</td>
                        {months.map((_, monthIdx) => {
                          const data = entry.monthly[monthIdx] || { entrate: 0, uscite: 0, netto: 0 };
                          return (
                            <>
                              <td key={`${monthIdx}-e`} className="p-2 text-sm text-center whitespace-nowrap">
                                {renderValue(data.entrate)}
                              </td>
                              <td key={`${monthIdx}-u`} className="p-2 text-sm text-center whitespace-nowrap">
                                {renderValue(-data.uscite)}
                              </td>
                              <td key={`${monthIdx}-n`} className="p-2 text-sm text-center whitespace-nowrap border-r">
                                {renderValue(data.netto)}
                              </td>
                            </>
                          );
                        })}
                        <td className="p-2 text-sm font-semibold text-center whitespace-nowrap">
                          {renderValue(entry.totalEntrate)}
                        </td>
                        <td className="p-2 text-sm font-semibold text-center whitespace-nowrap">
                          {renderValue(-entry.totalUscite)}
                        </td>
                        <td className="p-2 text-sm font-semibold text-center whitespace-nowrap">
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
