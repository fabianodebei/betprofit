import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Shield, Search, UserCog, Users, Activity, Database, TrendingUp, ArrowLeft } from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { it } from 'date-fns/locale';
import { AdminKPICard } from '@/components/admin/AdminKPICard';
import { UserActivityTable } from '@/components/admin/UserActivityTable';
import { RoleDistributionChart } from '@/components/admin/RoleDistributionChart';
import { UserRegistrationChart } from '@/components/admin/UserRegistrationChart';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: 'admin' | 'premium' | 'free';
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
  roleDistribution: {
    admin: number;
    premium: number;
    free: number;
  };
}

export default function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<'admin' | 'premium' | 'free'>('free');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [registrationData, setRegistrationData] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchSystemStats();
    fetchUserActivities();
    fetchRegistrationData();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles.map(profile => ({
        ...profile,
        role: (roles.find(r => r.user_id === profile.id)?.role || 'free') as 'admin' | 'premium' | 'free'
      }));

      setUsers(usersWithRoles);
      setFilteredUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Errore nel caricamento degli utenti');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStats = async () => {
    try {
      // Fetch all data
      const [profilesRes, rolesRes, betsRes, transactionsRes, accountsRes, walletsRes, tagsRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('user_roles').select('*'),
        supabase.from('bets').select('*'),
        supabase.from('transactions').select('*'),
        supabase.from('accounts').select('*'),
        supabase.from('wallets').select('*'),
        supabase.from('tags').select('*'),
      ]);

      const now = new Date();
      const oneWeekAgo = subDays(now, 7);
      const oneMonthAgo = subDays(now, 30);

      const newUsersThisWeek = profilesRes.data?.filter(
        p => new Date(p.created_at) >= oneWeekAgo
      ).length || 0;

      const newUsersThisMonth = profilesRes.data?.filter(
        p => new Date(p.created_at) >= oneMonthAgo
      ).length || 0;

      // Count active users (users with bets or transactions in last 30 days)
      const activeUserIds = new Set([
        ...(betsRes.data?.filter(b => new Date(b.created_at) >= oneMonthAgo).map(b => b.user_id) || []),
        ...(transactionsRes.data?.filter(t => new Date(t.registrato) >= oneMonthAgo).map(t => t.user_id) || [])
      ]);

      const roleDistribution = {
        admin: rolesRes.data?.filter(r => r.role === 'admin').length || 0,
        premium: rolesRes.data?.filter(r => r.role === 'premium').length || 0,
        free: rolesRes.data?.filter(r => r.role === 'free').length || 0,
      };

      setSystemStats({
        totalUsers: profilesRes.data?.length || 0,
        newUsersThisWeek,
        newUsersThisMonth,
        activeUsers: activeUserIds.size,
        totalBets: betsRes.data?.length || 0,
        totalTransactions: transactionsRes.data?.length || 0,
        totalAccounts: accountsRes.data?.length || 0,
        totalWallets: walletsRes.data?.length || 0,
        totalTags: tagsRes.data?.length || 0,
        roleDistribution,
      });
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const fetchUserActivities = async () => {
    try {
      const { data: profiles } = await supabase.from('profiles').select('*');
      const { data: roles } = await supabase.from('user_roles').select('*');
      const { data: bets } = await supabase.from('bets').select('user_id');
      const { data: transactions } = await supabase.from('transactions').select('user_id');
      const { data: accounts } = await supabase.from('accounts').select('user_id');
      const { data: wallets } = await supabase.from('wallets').select('user_id');

      const activities = profiles?.map(profile => ({
        ...profile,
        role: (roles?.find(r => r.user_id === profile.id)?.role || 'free') as 'admin' | 'premium' | 'free',
        betsCount: bets?.filter(b => b.user_id === profile.id).length || 0,
        transactionsCount: transactions?.filter(t => t.user_id === profile.id).length || 0,
        accountsCount: accounts?.filter(a => a.user_id === profile.id).length || 0,
        walletsCount: wallets?.filter(w => w.user_id === profile.id).length || 0,
      })) || [];

      setUserActivities(activities);
    } catch (error) {
      console.error('Error fetching user activities:', error);
    }
  };

  const fetchRegistrationData = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('created_at')
        .order('created_at', { ascending: true });

      if (!profiles) return;

      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });

      const registrationsByDay = days.map(day => {
        const count = profiles.filter(p => {
          const createdDate = new Date(p.created_at);
          return createdDate.toDateString() === day.toDateString();
        }).length;

        return {
          date: day.toISOString(),
          count,
        };
      });

      setRegistrationData(registrationsByDay);
    } catch (error) {
      console.error('Error fetching registration data:', error);
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
      // Verifica se è l'ultimo admin
      if (selectedUser.role === 'admin' && newRole !== 'admin') {
        const adminCount = users.filter(u => u.role === 'admin').length;
        if (adminCount === 1) {
          toast.error('Non puoi rimuovere l\'ultimo amministratore');
          return;
        }
      }

      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', selectedUser.id);

      if (error) throw error;

      toast.success('Ruolo aggiornato con successo');
      setDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Errore nell\'aggiornamento del ruolo');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'premium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Amministratore';
      case 'premium':
        return 'Premium';
      default:
        return 'Gratuito';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const roleDistributionData = systemStats ? [
    { name: 'Admin', value: systemStats.roleDistribution.admin },
    { name: 'Premium', value: systemStats.roleDistribution.premium },
    { name: 'Free', value: systemStats.roleDistribution.free },
  ] : [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Dashboard e gestione sistema</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/impostazioni')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alle Impostazioni
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">Gestione Utenti</TabsTrigger>
          <TabsTrigger value="activity">Attività Utenti</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <AdminKPICard
              title="Totale Utenti"
              value={systemStats?.totalUsers || 0}
              icon={Users}
              trend={{
                value: systemStats?.newUsersThisWeek || 0,
                label: 'questa settimana'
              }}
            />
            <AdminKPICard
              title="Utenti Attivi"
              value={systemStats?.activeUsers || 0}
              icon={Activity}
              description="Ultimi 30 giorni"
            />
            <AdminKPICard
              title="Nuovi Utenti"
              value={systemStats?.newUsersThisMonth || 0}
              icon={TrendingUp}
              description="Ultimo mese"
            />
            <AdminKPICard
              title="Database"
              value={`${systemStats?.totalBets || 0} bets`}
              icon={Database}
              description={`${systemStats?.totalTransactions || 0} transazioni`}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <UserRegistrationChart data={registrationData} />
            <RoleDistributionChart data={roleDistributionData} />
          </div>

          {/* System Stats */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Statistiche Database</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bets</span>
                  <span className="font-semibold">{systemStats?.totalBets || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transazioni</span>
                  <span className="font-semibold">{systemStats?.totalTransactions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conti</span>
                  <span className="font-semibold">{systemStats?.totalAccounts || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wallet</span>
                  <span className="font-semibold">{systemStats?.totalWallets || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tag</span>
                  <span className="font-semibold">{systemStats?.totalTags || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuzione Ruoli</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Admin</span>
                  <Badge variant="default">{systemStats?.roleDistribution.admin || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Premium</span>
                  <Badge variant="secondary">{systemStats?.roleDistribution.premium || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Free</span>
                  <Badge variant="outline">{systemStats?.roleDistribution.free || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Crescita Utenti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Questa settimana</span>
                  <span className="font-semibold text-green-600">+{systemStats?.newUsersThisWeek || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Questo mese</span>
                  <span className="font-semibold text-green-600">+{systemStats?.newUsersThisMonth || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Attivi (30gg)</span>
                  <span className="font-semibold">{systemStats?.activeUsers || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
        <CardHeader>
          <CardTitle>Utenti Registrati</CardTitle>
          <CardDescription>
            Totale: {users.length} utenti
          </CardDescription>
          <div className="flex items-center gap-2 pt-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca per email o nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Ruolo</TableHead>
                <TableHead>Registrato</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.full_name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), 'dd MMM yyyy', { locale: it })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRoleDialog(user)}
                    >
                      <UserCog className="h-4 w-4 mr-2" />
                      Modifica Ruolo
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Attività Utenti</CardTitle>
              <CardDescription>
                Panoramica delle attività di tutti gli utenti
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserActivityTable users={userActivities} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Ruolo Utente</DialogTitle>
            <DialogDescription>
              Cambia il ruolo di {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Gratuito</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="admin">Amministratore</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={updateUserRole}>
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
