import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface UserActivity {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'free' | 'free_be' | 'free_ss' | 'pagamento';
  created_at: string;
  betsCount: number;
  transactionsCount: number;
  accountsCount: number;
  walletsCount: number;
}

interface UserActivityTableProps {
  users: UserActivity[];
}

export const UserActivityTable = ({ users }: UserActivityTableProps) => {
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'pagamento':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'free_be':
        return 'Free BE';
      case 'free_ss':
        return 'Free SS';
      case 'pagamento':
        return 'A Pagamento';
      default:
        return 'Free';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>Ruolo</TableHead>
          <TableHead>Bets</TableHead>
          <TableHead>Transazioni</TableHead>
          <TableHead>Conti</TableHead>
          <TableHead>Wallet</TableHead>
          <TableHead>Registrato</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.email}</TableCell>
            <TableCell>{user.full_name || '-'}</TableCell>
            <TableCell>
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {getRoleLabel(user.role)}
              </Badge>
            </TableCell>
            <TableCell className="text-center">{user.betsCount}</TableCell>
            <TableCell className="text-center">{user.transactionsCount}</TableCell>
            <TableCell className="text-center">{user.accountsCount}</TableCell>
            <TableCell className="text-center">{user.walletsCount}</TableCell>
            <TableCell>
              {format(new Date(user.created_at), 'dd MMM yyyy', { locale: it })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
