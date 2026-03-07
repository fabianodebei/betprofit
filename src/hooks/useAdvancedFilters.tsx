import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';

export interface FilterState {
  search: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  bookmakers: string[];
  tags: string[];
  betTypes: string[];
  intestatari: string[];
  stakeMin: number | null;
  stakeMax: number | null;
}

interface FilterConfig<T> {
  searchFields: (keyof T)[];
  dateField?: keyof T;
}

const initialFilterState: FilterState = {
  search: '',
  dateFrom: null,
  dateTo: null,
  bookmakers: [],
  tags: [],
  betTypes: [],
  intestatari: [],
  stakeMin: null,
  stakeMax: null,
};

export function useAdvancedFilters<T extends Record<string, any>>(
  items: T[],
  config: FilterConfig<T>
) {
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [sortBy, setSortBy] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fuzzy search setup
  const fuse = useMemo(() => {
    return new Fuse(items, {
      keys: config.searchFields.map(f => f as string),
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, [items, config.searchFields]);

  const filteredItems = useMemo(() => {
    let result = items;

    // Text search with fuzzy matching
    if (filters.search.trim()) {
      const searchResults = fuse.search(filters.search);
      result = searchResults.map(r => r.item);
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      result = result.filter(item => {
        const dateField = config.dateField || 'dataEvento';
        const itemDate = item[dateField];
        if (!itemDate) return false;
        const date = itemDate && typeof itemDate === 'object' && 'getTime' in itemDate 
          ? itemDate as Date 
          : new Date(itemDate);
        
        if (filters.dateFrom && date < filters.dateFrom) return false;
        if (filters.dateTo) {
          const endOfDay = new Date(filters.dateTo);
          endOfDay.setHours(23, 59, 59, 999);
          if (date > endOfDay) return false;
        }
        return true;
      });
    }

    // Bookmaker filter
    if (filters.bookmakers.length > 0) {
      result = result.filter(item => 
        filters.bookmakers.includes(item.conto as string)
      );
    }

    // Tag filter
    if (filters.tags.length > 0) {
      result = result.filter(item => 
        item.tag && filters.tags.includes(item.tag as string)
      );
    }

    // Bet type filter
    if (filters.betTypes.length > 0) {
      result = result.filter(item => 
        filters.betTypes.includes(item.tipo as string)
      );
    }

    // Stake range filter
    if (filters.stakeMin !== null) {
      result = result.filter(item => item.stake >= filters.stakeMin!);
    }
    if (filters.stakeMax !== null) {
      result = result.filter(item => item.stake <= filters.stakeMax!);
    }

    // Sorting
    if (sortBy) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];

        const isADate = aVal && typeof aVal === 'object' && 'getTime' in aVal;
        const isBDate = bVal && typeof bVal === 'object' && 'getTime' in bVal;

        if (isADate && isBDate) {
          const aTime = (aVal as Date).getTime();
          const bTime = (bVal as Date).getTime();
          return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
        }

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortOrder === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        return 0;
      });
    }

    return result;
  }, [items, filters, sortBy, sortOrder, fuse, config.dateField]);

  const resetFilters = () => {
    setFilters(initialFilterState);
    setSortBy(null);
    setSortOrder('desc');
  };

  return {
    filteredItems,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    resetFilters,
  };
}
