import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { BetType } from '@/types/oddsmatcher';

interface BetTypeTabsProps {
  activeType: BetType;
  onChange: (type: BetType) => void;
  counts: Record<BetType, number>;
}

const BET_TYPE_LABELS: Record<BetType, string> = {
  singola: 'SINGOLA',
  multipla: 'MULTIPLA',
  tre_vie: 'TRE VIE',
  best_odds: 'BEST ODDS',
  best_opposite: 'BEST OPPOSITE',
  sure_bet: 'SURE BET',
};

export const BetTypeTabs = ({ activeType, onChange, counts }: BetTypeTabsProps) => {
  return (
    <Tabs value={activeType} onValueChange={(value) => onChange(value as BetType)} className="mb-4">
      <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto p-1">
        {(Object.keys(BET_TYPE_LABELS) as BetType[]).map((type) => (
          <TabsTrigger
            key={type}
            value={type}
            className="flex-shrink-0 gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {BET_TYPE_LABELS[type]}
            <Badge variant="secondary" className="ml-1">
              {counts[type]}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
