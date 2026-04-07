import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, UserCog, RotateCcw, Trash, Download, Menu, ArrowLeft, Eye } from 'lucide-react';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { UserActivityTable } from '@/components/admin/UserActivityTable';
import { useAdminPreferences } from '@/hooks/useAdminPreferences';
import { useDebounce } from '@/hooks/useDebounce';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { PlatformKPICards } from '@/components/admin/PlatformKPICards';
import { AdminAlerts } from '@/components/admin/AdminAlerts';

import { RevenueUsersTable } from '@/components/admin/RevenueUsersTable';
import { UserRegistrationChart } from '@/components/admin/UserRegistrationChart';
import { UserEarningsChart } from '@/components/admin/UserEarningsChart';
import { exportToCSV } from '@/utils/exportCSV';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: 'admin' | 'free';
}

interface SystemStats {
  totalUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  activeUsers: number;
  totalBets: number;
  totalTransactions: number;
  totalAccounts: number;
  totalWallets: number;
  totalTags: number;
  roleDistribution: { admin: number; free: number };
}

export default function Admin() {
  const navigate = useNavigate();
  const { startImpersonation } = useImpersonation();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<'admin' | 'free'>('free');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [registrationData, setRegistrationData] = useState<any[]>([]);
  const [userEarnings, setUserEarnings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { preferences, updatePreferences, resetPreferences, isLoading: prefsLoading } = useAdminPreferences();

  useEffect(() => {
    fetchUsers();
    fetchSystemStats();
    fetchUserActivities();
    fetchRegistrationData();
    fetchUserEarnings();
  }, []);

  useEffect(() => {
    if (preferences.defaultTab) setActiveTab(preferences.defaultTab);
  }, [preferences.defaultTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    updatePreferences({ defaultTab: value });
    setMobileSidebarOpen(false);
  };

  const debouncedSearch = useDebounce((term: string) => {
    if (term) {
      const filtered = users.filter(user =>
        user.email.toLowerCase().includes(term.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, 300);

  useEffect(() => { debouncedSearch(searchTerm); }, [searchTerm, users, debouncedSearch]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('admin_get_all_users');
      if (error) throw error;
      const parsed = (data || []) as unknown as UserProfile[];
      setUsers(parsed);
      setFilteredUsers(parsed);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Errore nel caricamento degli utenti');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_admin_stats');
      if (error) throw error;
      if (data) {
        const stats = data as any;
        setSystemStats({
          totalUsers: Number(stats.totalUsers) || 0,
          newUsersThisWeek: 0,
          newUsersThisMonth: Number(stats.newUsersLast30Days) || 0,
          activeUsers: Number(stats.activeUsersLast30Days) || 0,
          totalBets: Number(stats.totalBets) || 0,
          totalTransactions: Number(stats.totalTransactions) || 0,
          totalAccounts: Number(stats.totalAccounts) || 0,
          totalWallets: Number(stats.totalWallets) || 0,
          totalTags: Number(stats.totalTags) || 0,
          roleDistribution: {
            admin: Number(stats.totalAdmins) || 0,
            free: Math.max(0, (Number(stats.totalUsers) || 0) - (Number(stats.totalAdmins) || 0)),
          },
        });
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const fetchUserActivities = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_user_activities');
      if (error) throw error;
      setUserActivities(data?.map(a => ({
        ...a,
        betsCount: Number(a.bet_count),
        transactionsCount: Number(a.transaction_count),
        accountsCount: Number(a.account_count),
        walletsCount: Number(a.wallet_count),
      })) || []);
    } catch (error) {
      console.error('Error fetching user activities:', error);
    }
  };

  const fetchRegistrationData = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_registration_data');
      if (error) throw error;
      setRegistrationData(data?.map(item => ({
        date: new Date(item.date).toISOString(),
        count: Number(item.count),
      })) || []);
    } catch (error) {
      console.error('Error fetching registration data:', error);
    }
  };

  const fetchUserEarnings = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_user_earnings');
      if (error) throw error;
      setUserEarnings(data || []);
    } catch (error) {
      console.error('Error fetching user earnings:', error);
    }
  };

  const openRoleDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setDialogOpen(true);
  };

  const updateUserRole = async () => {
    if (!selectedUser) return;
    try {
      const { error } = await supabase.rpc('admin_update_user_role', {
        target_user_id: selectedUser.id,
        new_role: newRole,
      });
      if (error) throw error;
      toast.success('Ruolo aggiornato con successo');
      setDialogOpen(false);
      fetchUsers();
      fetchSystemStats();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.message?.includes('Access denied') ? 'Accesso negato' : 'Errore nell\'aggiornamento del ruolo');
    }
  };

  const handleExportUsers = () => {
    const rows = filteredUsers.map(u => ({
      Email: u.email,
      Nome: u.full_name || '-',
      Ruolo: u.role === 'admin' ? 'Amministratore' : 'Gratuito',
      'Data Registrazione': format(new Date(u.created_at), 'dd/MM/yyyy', { locale: it }),
    }));
    exportToCSV(rows, 'utenti');
  };

  const handleExportActivity = () => {
    const rows = userActivities.map(u => ({
      Email: u.email,
      Nome: u.full_name || '-',
      Bets: u.betsCount,
      Transazioni: u.transactionsCount,
      Conti: u.accountsCount,
      Wallet: u.walletsCount,
    }));
    exportToCSV(rows, 'attivita_utenti');
  };


  const totalEarnings = useMemo(() => {
    return userEarnings.reduce((sum, u) => sum + Number(u.total_earnings || 0), 0);
  }, [userEarnings]);

  // Loading skeleton
  if (loading || prefsLoading) {
    return (
      <div className="flex h-screen bg-[hsl(220,30%,6%)]">
        <div className="w-56 border-r border-border/30 p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex-1 p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[hsl(220,30%,6%)] overflow-hidden">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={cn(
        "lg:relative lg:block",
        mobileSidebarOpen ? "fixed inset-y-0 left-0 z-50" : "hidden lg:block"
      )}>
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-30 border-b border-border/30 bg-[hsl(220,30%,8%)]/95 backdrop-blur-sm px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg md:text-xl font-bold text-foreground capitalize">{activeTab}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/')} className="text-xs border-border/30">
              <ArrowLeft className="h-3.5 w-3.5 md:mr-1.5" />
              <span className="hidden md:inline">Torna alla Dashboard</span>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6">
          {/* ============ DASHBOARD TAB ============ */}
          {activeTab === 'dashboard' && (
            <>
              {/* Alerts */}
              <AdminAlerts
                totalBets={systemStats?.totalBets || 0}
                activeUsers={systemStats?.activeUsers || 0}
                userEarnings={userEarnings}
              />

              {/* KPI Cards */}
              <PlatformKPICards
                totalUsers={systemStats?.totalUsers || 0}
                activeUsers={systemStats?.activeUsers || 0}
                totalEarnings={totalEarnings}
                newUsersMonth={systemStats?.newUsersThisMonth || 0}
              />

              {/* Charts row */}
              <div className="grid gap-4 lg:grid-cols-2">
                <UserRegistrationChart data={registrationData} height={300} />
                <UserEarningsChart data={userEarnings} height={300} />
              </div>

              {/* Revenue Users */}
              <RevenueUsersTable users={userEarnings} />

            </>
          )}

          {/* ============ USERS TAB ============ */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Registered users */}
              <Card className="border-border/30">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">Utenti Registrati</CardTitle>
                      <CardDescription>Totale: {users.length} utenti</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Cerca per email o nome..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 max-w-xs border-border/30 bg-background/50"
                        />
                      </div>
                      <Button variant="outline" size="sm" onClick={handleExportUsers} className="text-xs border-border/30">
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/30">
                        <TableHead className="min-w-[150px]">Email</TableHead>
                        <TableHead className="hidden md:table-cell">Nome</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Data Reg.</TableHead>
                        <TableHead className="min-w-[160px]">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id} className="border-border/20">
                          <TableCell className="font-medium text-sm">{user.email}</TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{user.full_name || '-'}</TableCell>
                          <TableCell>
                            <Badge
                              variant={user.role === 'admin' ? 'default' : 'outline'}
                              className="text-xs"
                            >
                              {user.role === 'admin' ? 'Admin' : 'Free'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {format(new Date(user.created_at), 'dd MMM yyyy', { locale: it })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openRoleDialog(user)}
                                disabled={deletingId === user.id}
                                className="text-xs border-border/30 h-7"
                              >
                                <UserCog className="h-3 w-3 mr-1" />
                                Modifica
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={deletingId === user.id}
                                    className="text-xs h-7"
                                  >
                                    <Trash className="h-3 w-3 mr-1" />
                                    Elimina
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Eliminare questo utente?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      L'operazione è irreversibile e rimuoverà anche i suoi dati. Procedere?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <div className="flex justify-end gap-2">
                                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={async () => {
                                        try {
                                          setDeletingId(user.id);
                                          const { error } = await supabase.functions.invoke('admin-delete-user', {
                                            body: { user_id: user.id },
                                          });
                                          if (error) throw error;
                                          toast.success('Utente eliminato con successo');
                                          fetchUsers();
                                          fetchSystemStats();
                                        } catch (err) {
                                          console.error('Delete user error:', err);
                                          toast.error('Errore durante l\'eliminazione');
                                        } finally {
                                          setDeletingId(null);
                                        }
                                      }}
                                    >
                                      Conferma
                                    </AlertDialogAction>
                                  </div>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Activity table */}
              <Card className="border-border/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base">Attività Utenti</CardTitle>
                    <CardDescription>Bets, Transazioni, Conti e Wallet per utente</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportActivity} className="text-xs border-border/30">
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    CSV
                  </Button>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <UserActivityTable users={userActivities} />
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>

      {/* Role dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Ruolo Utente</DialogTitle>
            <DialogDescription>Cambia il ruolo di {selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Gratuito</SelectItem>
                <SelectItem value="admin">Amministratore</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annulla</Button>
            <Button onClick={updateUserRole}>Salva Modifiche</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
