import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

type ReportEntry = {
  intestatario: string;
  tipo?: string;
  monthly: MonthlyData;
  total: number;
};

type ReportType = 'scommesse' | 'giocate-rapide';

export default function Report() {
  const navigate = useNavigate();
  const { bets } = useBets();
  const { accounts } = useAccounts();
  const { selectedYear } = useYear();
  
  const [activeTab, setActiveTab] = useState<ReportType>('scommesse');
  const [filterIntestatario, setFilterIntestatario] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterIntestatarioDettaglio, setFilterIntestatarioDettaglio] = useState('');
  const [filterTipoDettaglio, setFilterTipoDettaglio] = useState('');

  // Calculate report data for aggregated view (by intestatario only)
  const reportDataAggregated = useMemo(() => {
    const data: ReportEntry[] = [];
    
    const relevantBets = bets.filter(bet => {
      const isRapideTab = activeTab === 'giocate-rapide';
      const matchesTipo = isRapideTab ? bet.tipo === 'Rapida' : bet.tipo !== 'Rapida';
      const matchesYear = bet.dataEvento.getFullYear() === selectedYear;
      
      // For regular bets, only include archived ones with results
      // For quick bets (Rapida), include all as they represent transactions
      if (isRapideTab) {
        return matchesTipo && matchesYear;
      } else {
        const hasRisultato = bet.risultato !== undefined;
        const matchesStato = bet.stato === 'Archiviata';
        return matchesStato && hasRisultato && matchesTipo && matchesYear;
      }
    });
    
    const grouped = new Map<string, ReportEntry>();
    
    relevantBets.forEach(bet => {
      const accountInfo = accounts.find(acc => acc.conto === bet.conto);
      if (!accountInfo) return;
      
      const key = accountInfo.intestatario;
      if (!grouped.has(key)) {
        grouped.set(key, {
          intestatario: accountInfo.intestatario,
          monthly: {},
          total: 0,
        });
      }
      
      const entry = grouped.get(key)!;
      const month = bet.dataEvento.getMonth();
      // For quick bets, use stake as the result (negative as it's a loss)
      const amount = bet.tipo === 'Rapida' ? -bet.stake : (bet.risultato || 0);
      entry.monthly[month] = (entry.monthly[month] || 0) + amount;
      entry.total += amount;
    });
    
    return Array.from(grouped.values());
  }, [bets, accounts, activeTab, selectedYear]);

  // Calculate report data for detailed view (by intestatario and tipo)
  const reportDataDetailed = useMemo(() => {
    const data: ReportEntry[] = [];
    const relevantBets = bets.filter(bet => {
      const isRapideTab = activeTab === 'giocate-rapide';
      const matchesTipo = isRapideTab ? bet.tipo === 'Rapida' : bet.tipo !== 'Rapida';
      const matchesYear = bet.dataEvento.getFullYear() === selectedYear;
      
      // For regular bets, only include archived ones with results
      // For quick bets (Rapida), include all as they represent transactions
      if (isRapideTab) {
        return matchesTipo && matchesYear;
      } else {
        const hasRisultato = bet.risultato !== undefined;
        const matchesStato = bet.stato === 'Archiviata';
        return matchesStato && hasRisultato && matchesTipo && matchesYear;
      }
    });
    
    const grouped = new Map<string, ReportEntry>();
    
    relevantBets.forEach(bet => {
      const accountInfo = accounts.find(acc => acc.conto === bet.conto);
      if (!accountInfo) return;
      
      // Determine tipo based on bet type
      let tipo = bet.mercato || 'Altro';
      if (activeTab === 'giocate-rapide') {
        tipo = bet.metodo || 'Altro';
      }
      
      const key = `${accountInfo.intestatario}|${tipo}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          intestatario: accountInfo.intestatario,
          tipo: tipo,
          monthly: {},
          total: 0,
        });
      }
      
      const entry = grouped.get(key)!;
      const month = bet.dataEvento.getMonth();
      // For quick bets, use stake as the result (negative as it's a loss)
      const amount = bet.tipo === 'Rapida' ? -bet.stake : (bet.risultato || 0);
      entry.monthly[month] = (entry.monthly[month] || 0) + amount;
      entry.total += amount;
    });
    
    return Array.from(grouped.values());
  }, [bets, accounts, activeTab, selectedYear]);

  // Calculate totals for aggregated view
  const totalAggregated = useMemo(() => {
    const monthly: MonthlyData = {};
    let total = 0;
    
    reportDataAggregated.forEach(entry => {
      Object.entries(entry.monthly).forEach(([month, value]) => {
        const m = parseInt(month);
        monthly[m] = (monthly[m] || 0) + value;
      });
      total += entry.total;
    });
    
    return { monthly, total };
  }, [reportDataAggregated]);

  // Calculate totals for detailed view
  const totalDetailed = useMemo(() => {
    const monthly: MonthlyData = {};
    let total = 0;
    
    reportDataDetailed.forEach(entry => {
      Object.entries(entry.monthly).forEach(([month, value]) => {
        const m = parseInt(month);
        monthly[m] = (monthly[m] || 0) + value;
      });
      total += entry.total;
    });
    
    return { monthly, total };
  }, [reportDataDetailed]);

  // Filter data for aggregated view
  const filteredAggregated = useMemo(() => {
    return reportDataAggregated.filter(entry => {
      if (filterIntestatario && !entry.intestatario.toLowerCase().includes(filterIntestatario.toLowerCase())) return false;
      return true;
    });
  }, [reportDataAggregated, filterIntestatario]);

  // Filter data for detailed view
  const filteredDetailed = useMemo(() => {
    return reportDataDetailed.filter(entry => {
      if (filterIntestatarioDettaglio && !entry.intestatario.toLowerCase().includes(filterIntestatarioDettaglio.toLowerCase())) return false;
      if (filterTipoDettaglio && entry.tipo && !entry.tipo.toLowerCase().includes(filterTipoDettaglio.toLowerCase())) return false;
      return true;
    });
  }, [reportDataDetailed, filterIntestatarioDettaglio, filterTipoDettaglio]);

  // Get unique tipos for filter
  const uniqueTipos = useMemo(() => {
    const tipos = new Set<string>();
    reportDataDetailed.forEach(entry => {
      if (entry.tipo) tipos.add(entry.tipo);
    });
    return Array.from(tipos).sort();
  }, [reportDataDetailed]);

  const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

  const renderValue = (value: number) => {
    if (value === 0) return '0,00 €';
    return (
      <span style={{ color: value < 0 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
        {formatCurrency(value)}
      </span>
    );
  };

  const tabTitle = activeTab === 'scommesse' ? 'Report GM per Mese' : 'Rapido: Report GM per Mese';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-blue-500 p-3">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{tabTitle}</h1>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/impostazioni')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alle Impostazioni
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportType)} className="w-full">
        <TabsList>
          <TabsTrigger value="scommesse">Scommesse</TabsTrigger>
          <TabsTrigger value="giocate-rapide">Giocate Rapide</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Tabs defaultValue="aggregated" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="aggregated">Riepilogo</TabsTrigger>
              <TabsTrigger value="detailed">Dettaglio per Tipo</TabsTrigger>
            </TabsList>

            {/* Aggregated View */}
            <TabsContent value="aggregated">
              <Card>
                <CardContent className="p-0">
                  <div className="p-4 text-sm text-muted-foreground">
                    Visualizzo 1-{filteredAggregated.length} di {reportDataAggregated.length} elementi.
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="p-3 text-left text-xs font-semibold sticky left-0 bg-muted/30 z-10">Intestatario</th>
                          <th className="p-3 text-left text-xs font-semibold">Totale Anno</th>
                          {months.map(month => (
                            <th key={month} className="p-3 text-left text-xs font-semibold whitespace-nowrap">{month}</th>
                          ))}
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
                          <th className="p-2"></th>
                          {months.map((_, idx) => (
                            <th key={idx} className="p-2"></th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAggregated.map((entry, idx) => (
                          <tr key={`${entry.intestatario}-${idx}`} className="border-b hover:bg-muted/20">
                            <td className="p-3 text-sm sticky left-0 bg-background">{entry.intestatario}</td>
                            <td className="p-3 text-sm font-semibold whitespace-nowrap">
                              {renderValue(entry.total)}
                            </td>
                            {months.map((_, monthIdx) => (
                              <td key={monthIdx} className="p-3 text-sm whitespace-nowrap">
                                {renderValue(entry.monthly[monthIdx] || 0)}
                              </td>
                            ))}
                          </tr>
                        ))}
                        <tr className="border-t-2 bg-muted/40 font-bold">
                          <td className="p-3 text-sm sticky left-0 bg-muted/40">Guadagno Totale</td>
                          <td className="p-3 text-sm whitespace-nowrap">
                            {renderValue(totalAggregated.total)}
                          </td>
                          {months.map((_, monthIdx) => (
                            <td key={monthIdx} className="p-3 text-sm whitespace-nowrap">
                              {renderValue(totalAggregated.monthly[monthIdx] || 0)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Detailed View */}
            <TabsContent value="detailed">
              <Card>
                <CardContent className="p-0">
                  <div className="p-4 text-sm text-muted-foreground">
                    elementi totali {filteredDetailed.length}.
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="p-3 text-left text-xs font-semibold sticky left-0 bg-muted/30 z-10">Intestatario</th>
                          <th className="p-3 text-left text-xs font-semibold sticky left-[150px] bg-muted/30 z-10">Totale Anno</th>
                          <th className="p-3 text-left text-xs font-semibold sticky left-[270px] bg-muted/30 z-10">Tipo</th>
                          {months.map(month => (
                            <th key={month} className="p-3 text-left text-xs font-semibold whitespace-nowrap">{month}</th>
                          ))}
                        </tr>
                        <tr className="border-b bg-muted/50">
                          <th className="p-2 sticky left-0 bg-muted/50 z-10">
                            <Input
                              placeholder="Filtra Intestatario"
                              value={filterIntestatarioDettaglio}
                              onChange={(e) => setFilterIntestatarioDettaglio(e.target.value)}
                              className="h-8 text-xs"
                            />
                          </th>
                          <th className="p-2 sticky left-[150px] bg-muted/50 z-10"></th>
                          <th className="p-2 sticky left-[270px] bg-muted/50 z-10">
                            <Input
                              placeholder="Filtra Tipo"
                              value={filterTipoDettaglio}
                              onChange={(e) => setFilterTipoDettaglio(e.target.value)}
                              className="h-8 text-xs"
                            />
                          </th>
                          {months.map((_, idx) => (
                            <th key={idx} className="p-2"></th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDetailed.map((entry, idx) => (
                          <tr key={`${entry.intestatario}-${entry.tipo}-${idx}`} className="border-b hover:bg-muted/20">
                            <td className="p-3 text-sm sticky left-0 bg-background">{entry.intestatario}</td>
                            <td className="p-3 text-sm font-semibold whitespace-nowrap sticky left-[150px] bg-background">
                              {renderValue(entry.total)}
                            </td>
                            <td className="p-3 text-sm sticky left-[270px] bg-background">{entry.tipo}</td>
                            {months.map((_, monthIdx) => (
                              <td key={monthIdx} className="p-3 text-sm whitespace-nowrap">
                                {renderValue(entry.monthly[monthIdx] || 0)}
                              </td>
                            ))}
                          </tr>
                        ))}
                        <tr className="border-t-2 bg-muted/40 font-bold">
                          <td className="p-3 text-sm sticky left-0 bg-muted/40">Guadagno Totale</td>
                          <td className="p-3 text-sm whitespace-nowrap sticky left-[150px] bg-muted/40">
                            {renderValue(totalDetailed.total)}
                          </td>
                          <td className="p-3 text-sm sticky left-[270px] bg-muted/40"></td>
                          {months.map((_, monthIdx) => (
                            <td key={monthIdx} className="p-3 text-sm whitespace-nowrap">
                              {renderValue(totalDetailed.monthly[monthIdx] || 0)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
