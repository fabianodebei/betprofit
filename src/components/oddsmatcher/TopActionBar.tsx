import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, RefreshCw, Trash2, Archive } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TopActionBarProps {
  onToggleFilters: () => void;
  filtersOpen: boolean;
  onRefresh: () => void;
  onClearFilters: () => void;
  loading: boolean;
}

export const TopActionBar = ({
  onToggleFilters,
  filtersOpen,
  onRefresh,
  onClearFilters,
  loading,
}: TopActionBarProps) => {
  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleFilters}
        className="gap-2"
      >
        {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        <span className="hidden sm:inline">FILTRA</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={loading}
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">AGGIORNA</span>
      </Button>

      <Button
        variant="destructive"
        size="sm"
        onClick={onClearFilters}
        className="gap-2"
      >
        <Trash2 className="h-4 w-4" />
        <span className="hidden sm:inline">PULISCI</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Archive className="h-4 w-4" />
            <span className="hidden sm:inline">ARCHIVIO</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem>Visualizza Archivio</DropdownMenuItem>
          <DropdownMenuItem>Esporta Storico</DropdownMenuItem>
          <DropdownMenuItem>Pulisci Archivio</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
