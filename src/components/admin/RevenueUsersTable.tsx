import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { exportToCSV } from '@/utils/exportCSV';

interface RevenueUser {
  user_id: string;
  email: string;
  full_name: string | null;
  total_earnings: number;
}

interface RevenueUsersTableProps {
  users: RevenueUser[];
}

export const RevenueUsersTable = ({ users }: RevenueUsersTableProps) => {
  const handleExport = () => {
    const rows = users.map(u => ({
      Email: u.email,
      Nome: u.full_name || '-',
      'Profitto Generato': Number(u.total_earnings).toFixed(2),
      Status: Number(u.total_earnings) > 0 ? 'In Profitto' : Number(u.total_earnings) < 0 ? 'In Perdita' : 'Neutro',
    }));
    exportToCSV(rows, 'revenue_users');
  };

  return (
    <Card className="border-border/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Revenue Users</CardTitle>
        <Button variant="outline" size="sm" onClick={handleExport} className="text-xs">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          CSV
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/30">
              <TableHead>Email</TableHead>
              <TableHead className="hidden md:table-cell">Nome</TableHead>
              <TableHead className="text-right">Profitto Generato</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.slice(0, 20).map((user) => {
              const earnings = Number(user.total_earnings);
              return (
                <TableRow key={user.user_id} className="border-border/20">
                  <TableCell className="font-medium text-sm">{user.email}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {user.full_name || '-'}
                  </TableCell>
                  <TableCell className={`text-right font-mono text-sm ${earnings >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(earnings)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={earnings > 0 ? 'default' : earnings < 0 ? 'destructive' : 'outline'}
                      className="text-xs"
                    >
                      {earnings > 0 ? 'Profitto' : earnings < 0 ? 'Perdita' : 'Neutro'}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
