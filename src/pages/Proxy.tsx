import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Globe, Copy, Check } from 'lucide-react';

interface ProxyData {
  id: string;
  user_id: string;
  proxy_host: string;
  http_port: number;
  socks5_port: number;
  username: string;
  password: string;
}

interface UserInfo {
  id: string;
  email: string;
  full_name: string;
}

const proxyTable = () => supabase.from('user_proxies' as any);

const CopyButton = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="ml-2 text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
};

const UserProxyView = ({ proxy }: { proxy: ProxyData | null }) => {
  if (!proxy) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Proxy</h1>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nessun proxy assegnato al tuo account.</p>
            <p className="text-sm mt-1">Contatta l'amministratore per richiederne uno.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Proxy</h1>
      <Card>
        <CardContent className="py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Proxy</p>
              <p className="font-semibold flex items-center">
                {proxy.proxy_host}
                <CopyButton value={proxy.proxy_host} />
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">HTTP</p>
              <p className="font-semibold flex items-center">
                {proxy.http_port}
                <CopyButton value={String(proxy.http_port)} />
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">SOCKS5</p>
              <p className="font-semibold flex items-center">
                {proxy.socks5_port}
                <CopyButton value={String(proxy.socks5_port)} />
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Username</p>
              <p className="font-semibold flex items-center">
                {proxy.username}
                <CopyButton value={proxy.username} />
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Password</p>
              <p className="font-semibold flex items-center">
                {proxy.password}
                <CopyButton value={proxy.password} />
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AdminProxyView = () => {
  const [proxies, setProxies] = useState<(ProxyData & { email?: string; full_name?: string })[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProxy, setEditingProxy] = useState<ProxyData | null>(null);
  const [form, setForm] = useState({
    user_id: '',
    proxy_host: '',
    http_port: '',
    socks5_port: '',
    username: '',
    password: '',
  });

  const fetchProxies = async () => {
    const { data, error } = await proxyTable().select('*');
    if (error) { console.error(error); return; }
    
    const { data: usersData } = await supabase.rpc('admin_get_all_users');
    const allUsers = (usersData as any[]) || [];
    
    const enriched = (data || []).map((p: any) => {
      const u = allUsers.find((u: any) => u.id === p.user_id);
      return { ...p, email: u?.email, full_name: u?.full_name };
    });
    setProxies(enriched);
    
    const proxyUserIds = (data || []).map((p: any) => p.user_id);
    const available = allUsers
      .filter((u: any) => !proxyUserIds.includes(u.id))
      .map((u: any) => ({ id: u.id, email: u.email, full_name: u.full_name || '' }));
    setUsers(available);
  };

  useEffect(() => { fetchProxies(); }, []);

  const resetForm = () => {
    setForm({ user_id: '', proxy_host: '', http_port: '', socks5_port: '', username: '', password: '' });
    setEditingProxy(null);
  };

  const handleSave = async () => {
    if (!form.proxy_host || !form.http_port || !form.socks5_port || !form.username || !form.password) {
      toast.error('Compila tutti i campi');
      return;
    }

    const payload = {
      user_id: editingProxy ? editingProxy.user_id : form.user_id,
      proxy_host: form.proxy_host,
      http_port: parseInt(form.http_port),
      socks5_port: parseInt(form.socks5_port),
      username: form.username,
      password: form.password,
    };

    if (!payload.user_id) { toast.error('Seleziona un utente'); return; }

    let error;
    if (editingProxy) {
      ({ error } = await proxyTable().update(payload).eq('id', editingProxy.id));
    } else {
      ({ error } = await proxyTable().insert(payload));
    }

    if (error) { toast.error('Errore: ' + error.message); return; }
    toast.success(editingProxy ? 'Proxy aggiornato' : 'Proxy assegnato');
    resetForm();
    setDialogOpen(false);
    fetchProxies();
  };

  const handleDelete = async (id: string) => {
    const { error } = await proxyTable().delete().eq('id', id);
    if (error) { toast.error('Errore: ' + error.message); return; }
    toast.success('Proxy rimosso');
    fetchProxies();
  };

  const handleEdit = (proxy: ProxyData) => {
    setEditingProxy(proxy);
    setForm({
      user_id: proxy.user_id,
      proxy_host: proxy.proxy_host,
      http_port: String(proxy.http_port),
      socks5_port: String(proxy.socks5_port),
      username: proxy.username,
      password: proxy.password,
    });
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gestione Proxy</h1>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Assegna Proxy</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProxy ? 'Modifica Proxy' : 'Assegna Proxy'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Incolla URL proxy</Label>
                <Input
                  placeholder="http://user:pass@host:port"
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    try {
                      // Format: http://username:password@host:port
                      const url = new URL(val);
                      const portVal = url.port || '';
                      const parsed = {
                        proxy_host: url.hostname,
                        http_port: portVal,
                        socks5_port: portVal,
                        username: decodeURIComponent(url.username),
                        password: decodeURIComponent(url.password),
                      };
                      if (parsed.proxy_host && parsed.username && parsed.password) {
                        setForm(prev => ({ ...prev, ...parsed }));
                      }
                    } catch {
                      // not a valid URL yet, ignore
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">Es: http://TFhKe8xZ:Jw6SObmC@proxybet.ddns.net:8001</p>
              </div>
              {!editingProxy && (
                <div>
                  <Label>Utente</Label>
                  <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleziona utente" /></SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.full_name || u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Proxy Host</Label>
                <Input value={form.proxy_host} onChange={(e) => setForm({ ...form, proxy_host: e.target.value })} placeholder="es. proxybet.ddns.net" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Porta HTTP</Label>
                  <Input type="number" value={form.http_port} onChange={(e) => setForm({ ...form, http_port: e.target.value, socks5_port: e.target.value })} placeholder="8004" />
                </div>
                <div>
                  <Label>Porta SOCKS5</Label>
                  <Input type="number" value={form.socks5_port} readOnly className="bg-muted cursor-not-allowed" placeholder="5004" />
                </div>
              </div>
              <div>
                <Label>Username</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="username" />
              </div>
              <div>
                <Label>Password</Label>
                <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="password" />
              </div>
              <Button onClick={handleSave} className="w-full">
                {editingProxy ? 'Aggiorna' : 'Assegna'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utente</TableHead>
                <TableHead>Proxy</TableHead>
                <TableHead>HTTP</TableHead>
                <TableHead>SOCKS5</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Password</TableHead>
                <TableHead className="w-[100px]">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proxies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nessun proxy assegnato
                  </TableCell>
                </TableRow>
              ) : (
                proxies.map(proxy => (
                  <TableRow key={proxy.id}>
                    <TableCell className="font-medium">{proxy.full_name || proxy.email || proxy.user_id}</TableCell>
                    <TableCell>{proxy.proxy_host}</TableCell>
                    <TableCell>{proxy.http_port}</TableCell>
                    <TableCell>{proxy.socks5_port}</TableCell>
                    <TableCell>{proxy.username}</TableCell>
                    <TableCell>{proxy.password}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(proxy)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(proxy.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const Proxy = () => {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [proxy, setProxy] = useState<ProxyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || roleLoading) return;
    if (isAdmin) { setLoading(false); return; }
    
    const fetchProxy = async () => {
      const { data } = await proxyTable()
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setProxy(data as unknown as ProxyData | null);
      setLoading(false);
    };
    fetchProxy();
  }, [user, isAdmin, roleLoading]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return isAdmin ? <AdminProxyView /> : <UserProxyView proxy={proxy} />;
};

export default Proxy;
