import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export function formatDate(date: Date): string {
  return format(date, 'dd/MM/yyyy', { locale: it });
}

export function formatDateTime(date: Date): string {
  return format(date, 'dd/MM/yyyy HH:mm', { locale: it });
}

export function formatTime(date: Date): string {
  return format(date, 'HH:mm', { locale: it });
}

export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: it });
}
