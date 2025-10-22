import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Bet } from "@/types";
import { useLayBets } from "@/contexts/LayBetContext";
import { useBetLegs } from "@/contexts/BetLegContext";
import { formatCurrency } from "@/utils/currency";
import { useMemo, useState } from "react";
import { getMultiplaCalculations } from "@/utils/multiplaCalculations";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface MultiplaArchiveDialogProps {
  bet: Bet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (risultato: number) => void;
}

export function MultiplaArchiveDialog({
  bet,
  open,
  onOpenChange,
  onConfirm,
}: MultiplaArchiveDialogProps) {
  const { getLayBetsByParentId } = useLayBets();
  const { getBetLegsByBetId } = useBetLegs();
  const layBets = bet ? getLayBetsByParentId(bet.id) : [];
  const betLegs = bet ? getBetLegsByBetId(bet.id) : [];
  
  const [selectedOption, setSelectedOption] = useState<string>('win');

  const calculations = useMemo(
    () => getMultiplaCalculations(bet, layBets, betLegs),
    [bet, layBets, betLegs]
  );

  const handleConfirm = () => {
    let risultatoCalcolato: number;

    if (selectedOption === 'win') {
      risultatoCalcolato = calculations.scenarioVincita;
    } else {
      // Trova il risultato per la partita selezionata
      const partitaResult = calculations.perGamba.find((g) => g.id === selectedOption);
      risultatoCalcolato = partitaResult?.risultato || 0;
    }

    onConfirm(risultatoCalcolato);
    onOpenChange(false);
    setSelectedOption('win'); // Reset per la prossima volta
  };

  if (!bet) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Archivia Multipla</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Evento: {bet.evento || 'Multipla'}</h3>
            <p className="text-sm text-muted-foreground">
              Seleziona l'esito effettivo della multipla per calcolare automaticamente il risultato corretto.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                <div className="space-y-4">
                  {/* Opzione: Multipla Vinta */}
                  <Label 
                    htmlFor="win" 
                    className="flex items-start space-x-3 p-4 rounded-lg border-2 border-muted hover:border-primary transition-colors cursor-pointer"
                  >
                    <RadioGroupItem value="win" id="win" className="mt-1" />
                    <div className="flex-1">
                      <div className="text-base font-semibold">
                        Multipla Vinta
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Tutte le selezioni sono andate a segno. Perdi tutte le bancate.
                      </p>
                      <p className="text-lg font-bold mt-2" style={{ color: calculations.scenarioVincita >= 0 ? 'green' : 'red' }}>
                        Risultato: {formatCurrency(calculations.scenarioVincita)}
                      </p>
                    </div>
                  </Label>

                  {/* Opzioni: Multipla Persa per ciascuna partita */}
                  {layBets.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-muted-foreground">
                          Multipla Persa su una partita specifica:
                        </p>
                        {layBets.map((layBet) => {
                          const partitaResult = calculations.perGamba.find((g) => g.id === layBet.id);
                          const risultato = partitaResult?.risultato || 0;

                          return (
                            <Label
                              key={layBet.id}
                              htmlFor={layBet.id}
                              className="flex items-start space-x-3 p-4 rounded-lg border-2 border-muted hover:border-primary transition-colors cursor-pointer"
                            >
                              <RadioGroupItem value={layBet.id} id={layBet.id} className="mt-1" />
                              <div className="flex-1">
                                <div className="text-base font-semibold">
                                  Multipla Persa su: {layBet.evento}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Questa specifica selezione non è andata a segno. Vinci questa bancata, perdi le bancate precedenti.
                                </p>
                                <p className="text-lg font-bold mt-2" style={{ color: risultato >= 0 ? 'green' : 'red' }}>
                                  Risultato: {formatCurrency(risultato)}
                                </p>
                              </div>
                            </Label>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Riepilogo */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Totale Rischio (Liability)</p>
                  <p className="text-xl font-bold">{formatCurrency(calculations.totalRisk)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Guadagno Garantito / Perdita Massima</p>
                  <p className="text-xl font-bold" style={{ color: calculations.guadagnoTotale >= 0 ? 'green' : 'red' }}>
                    {formatCurrency(calculations.guadagnoTotale)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleConfirm}>
            Conferma Archiviazione
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
