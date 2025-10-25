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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Shield, Search, UserCog, ArrowLeft, RotateCcw, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { UserActivityTable } from '@/components/admin/UserActivityTable';
import { useAdminPreferences } from '@/hooks/useAdminPreferences';
import { useDebounce } from '@/hooks/useDebounce';
import { DraggableWidget } from '@/components/admin/DraggableWidget';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  KPIUsersWidget,
  KPIBetsWidget,
  KPITransactionsWidget,
  KPIAccountsWidget,
  RegistrationChartWidget,
  EarningsChartWidget,
  StatsGeneralWidget,
  StatsBetsWidget,
  StatsAccountsWidget,
} from '@/components/admin/MemoizedWidgets';

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
  roleDistribution: {
    admin: number;
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
  const [newRole, setNewRole] = useState<'admin' | 'free'>('free');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const [registrationData, setRegistrationData] = useState<any[]>([]);
  const [userEarnings, setUserEarnings] = useState<any[]>([]);
   const [activeTab, setActiveTab] = useState('dashboard');
   const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const { preferences, updatePreferences, resetPreferences, isLoading: prefsLoading } = useAdminPreferences();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchUsers();
    fetchSystemStats();
    fetchUserActivities();
    fetchRegistrationData();
    fetchUserEarnings();
  }, []);

  // Restore active tab from preferences
  useEffect(() => {
    if (preferences.defaultTab) {
      setActiveTab(preferences.defaultTab);
    }
  }, [preferences.defaultTab]);

  // Save active tab to preferences
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    updatePreferences({ defaultTab: value });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = preferences.dashboardLayout?.indexOf(active.id as string) ?? -1;
      const newIndex = preferences.dashboardLayout?.indexOf(over.id as string) ?? -1;

      if (oldIndex !== -1 && newIndex !== -1 && preferences.dashboardLayout) {
        const newLayout = arrayMove(preferences.dashboardLayout, oldIndex, newIndex);
        updatePreferences({ dashboardLayout: newLayout });
      }
    }
  };

  // Debounced search to avoid filtering on every keystroke
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

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, users, debouncedSearch]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('admin_get_all_users');

      if (error) throw error;

      setUsers(data || []);
      setFilteredUsers(data || []);
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
        // Type assertion for RPC response
        const stats = data as any;
        
        // Map RPC response to SystemStats format
        const roleDistribution = {
          admin: users.filter(u => u.role === 'admin').length,
          free: users.filter(u => u.role === 'free').length,
        };

        setSystemStats({
          totalUsers: Number(stats.totalUsers) || 0,
          newUsersThisWeek: 0, // Will be calculated from registration data
          newUsersThisMonth: Number(stats.newUsersLast30Days) || 0,
          activeUsers: Number(stats.activeUsersLast30Days) || 0,
          totalBets: Number(stats.totalBets) || 0,
          totalTransactions: Number(stats.totalTransactions) || 0,
          totalAccounts: Number(stats.totalAccounts) || 0,
          totalWallets: Number(stats.totalWallets) || 0,
          totalTags: Number(stats.totalTags) || 0,
          roleDistribution,
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

      const activities = data?.map(activity => ({
        ...activity,
        betsCount: Number(activity.bet_count),
        transactionsCount: Number(activity.transaction_count),
        accountsCount: Number(activity.account_count),
        walletsCount: Number(activity.wallet_count),
      })) || [];

      setUserActivities(activities);
    } catch (error) {
      console.error('Error fetching user activities:', error);
    }
  };

  const fetchRegistrationData = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_registration_data');

      if (error) throw error;

      const registrationsByDay = data?.map(item => ({
        date: new Date(item.date).toISOString(),
        count: Number(item.count),
      })) || [];

      setRegistrationData(registrationsByDay);
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
      if (error.message?.includes('Cannot remove the last admin')) {
        toast.error('Non puoi rimuovere l\'ultimo amministratore');
      } else if (error.message?.includes('Access denied')) {
        toast.error('Accesso negato: privilegi amministrativi richiesti');
      } else {
        toast.error('Errore nell\'aggiornamento del ruolo');
      }
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Amministratore';
      default:
        return 'Gratuito';
    }
  };

  if (loading || prefsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Memoized widget components map to prevent unnecessary re-renders
  const widgetComponents = useMemo(() => ({
    'kpi-users': <KPIUsersWidget systemStats={systemStats} />,
    'kpi-bets': <KPIBetsWidget systemStats={systemStats} />,
    'kpi-transactions': <KPITransactionsWidget systemStats={systemStats} />,
    'kpi-accounts': <KPIAccountsWidget systemStats={systemStats} />,
    'chart-registrations': <RegistrationChartWidget registrationData={registrationData} />,
    'chart-roles': <EarningsChartWidget userEarnings={userEarnings} />,
    'stats-general': <StatsGeneralWidget systemStats={systemStats} />,
    'stats-bets': <StatsBetsWidget systemStats={systemStats} />,
    'stats-accounts': <StatsAccountsWidget systemStats={systemStats} />,
  }), [systemStats, registrationData, userEarnings]);

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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetPreferences}
            title="Ripristina layout predefinito"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Layout
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/impostazioni')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alle Impostazioni
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">Gestione Utenti</TabsTrigger>
          <TabsTrigger value="activity">Attività Utenti</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={preferences.dashboardLayout || []}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-6">
                {/* KPI Cards - First 4 widgets */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {preferences.dashboardLayout?.slice(0, 4).map((widgetId) => (
                    <DraggableWidget key={widgetId} id={widgetId}>
                      {widgetComponents[widgetId]}
                    </DraggableWidget>
                  ))}
                </div>

                {/* Charts - Widgets 5-6 */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {preferences.dashboardLayout?.slice(4, 6).map((widgetId) => (
                    <DraggableWidget key={widgetId} id={widgetId}>
                      {widgetComponents[widgetId]}
                    </DraggableWidget>
                  ))}
                </div>

                {/* System Stats - Widgets 7-9 */}
                <div className="grid gap-6 md:grid-cols-3">
                  {preferences.dashboardLayout?.slice(6, 9).map((widgetId) => (
                    <DraggableWidget key={widgetId} id={widgetId}>
                      {widgetComponents[widgetId]}
                    </DraggableWidget>
                  ))}
                </div>
              </div>
            </SortableContext>
          </DndContext>
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
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRoleDialog(user)}
                          disabled={deletingId === user.id}
                        >
                          <UserCog className="h-4 w-4 mr-2" />
                          Modifica Ruolo
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={deletingId === user.id}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Elimina
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminare questo utente?</AlertDialogTitle>
                              <AlertDialogDescription>
                                L'operazione è irreversibile e rimuoverà anche i suoi dati principali. Procedere?
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
                                  } catch (err: any) {
                                    console.error('Delete user error:', err);
                                    toast.error('Errore durante l\'eliminazione dell\'utente');
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
