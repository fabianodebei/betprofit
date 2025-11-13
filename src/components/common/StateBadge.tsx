import { Badge } from '@/components/ui/badge';

interface StateBadgeProps {
  stato: 'Bozza' | 'In Corso' | 'Vinto' | 'Perso' | 'Annullato';
  className?: string;
}

export function StateBadge({ stato, className = '' }: StateBadgeProps) {
  const getBadgeStyles = () => {
    switch (stato) {
      case 'Bozza':
        return 'bg-muted text-muted-foreground border-muted';
      case 'In Corso':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'Vinto':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'Perso':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'Annullato':
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  return (
    <Badge variant="outline" className={`${getBadgeStyles()} ${className}`}>
      {stato}
    </Badge>
  );
}
