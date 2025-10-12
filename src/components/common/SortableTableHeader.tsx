import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SortableTableHeaderProps<T = string> {
  label: string;
  sortKey: T;
  currentSort: T | null;
  currentOrder: 'asc' | 'desc';
  onSort: (key: T, order: 'asc' | 'desc') => void;
  className?: string;
}

export function SortableTableHeader<T = string>({
  label,
  sortKey,
  currentSort,
  currentOrder,
  onSort,
  className = '',
}: SortableTableHeaderProps<T>) {
  const isSorted = currentSort === sortKey;

  const handleClick = () => {
    if (!isSorted) {
      onSort(sortKey, 'desc');
    } else if (currentOrder === 'desc') {
      onSort(sortKey, 'asc');
    } else {
      onSort(sortKey, 'desc');
    }
  };

  return (
    <th className={`p-3 text-left text-xs font-semibold uppercase ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        {label}
        {isSorted ? (
          currentOrder === 'asc' ? (
            <ArrowUp className="ml-2 h-3 w-3" />
          ) : (
            <ArrowDown className="ml-2 h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
        )}
      </Button>
    </th>
  );
}
