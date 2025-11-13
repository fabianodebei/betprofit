import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Zap, Archive, FileText, Wallet, Tag, Clock } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBets } from '@/contexts/BetContext';
import { useAccounts } from '@/contexts/AccountContext';
import { useWallets } from '@/contexts/WalletContext';
import { useTags } from '@/contexts/TagContext';
import { formatCurrency } from '@/utils/currency';
import { formatDateTime } from '@/utils/dates';
import Fuse from 'fuse.js';

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchDialog({ open, onOpenChange }: GlobalSearchDialogProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { bets } = useBets();
  const { accounts } = useAccounts();
  const { wallets } = useWallets();
  const { tags } = useTags();

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return { bets: [], accounts: [], wallets: [], tags: [] };

    const betsFuse = new Fuse(bets, {
      keys: ['evento', 'nomeGioco', 'conto', 'tag', 'note'],
      threshold: 0.3,
    });

    const accountsFuse = new Fuse(accounts, {
      keys: ['conto', 'descrizione', 'intestatario'],
      threshold: 0.3,
    });

    const walletsFuse = new Fuse(wallets, {
      keys: ['nome', 'descrizione', 'intestatario'],
      threshold: 0.3,
    });

    const tagsFuse = new Fuse(tags, {
      keys: ['nome'],
      threshold: 0.3,
    });

    return {
      bets: betsFuse.search(query).slice(0, 5).map(r => r.item),
      accounts: accountsFuse.search(query).slice(0, 3).map(r => r.item),
      wallets: walletsFuse.search(query).slice(0, 3).map(r => r.item),
      tags: tagsFuse.search(query).slice(0, 3).map(r => r.item),
    };
  }, [query, bets, accounts, wallets, tags]);

  const hasResults = searchResults.bets.length > 0 || 
                     searchResults.accounts.length > 0 || 
                     searchResults.wallets.length > 0 ||
                     searchResults.tags.length > 0;

  const handleSelect = (type: string, id?: string) => {
    onOpenChange(false);
    
    switch (type) {
      case 'ongoing':
        navigate('/puntate');
        break;
      case 'archived':
        navigate('/archiviate');
        break;
      case 'quick':
        navigate('/rapide');
        break;
      case 'accounts':
        navigate('/conti');
        break;
      case 'wallets':
        navigate('/wallets');
        break;
      case 'tags':
        navigate('/tag');
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <div className="flex items-center border-b px-4 py-3">
          <Search className="mr-2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Cerca scommesse, conti, wallets, tag..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
        </div>

        <ScrollArea className="max-h-[400px]">
          {!query.trim() ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Inizia a digitare per cercare...
            </div>
          ) : !hasResults ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nessun risultato trovato per "{query}"
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Bets */}
              {searchResults.bets.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Scommesse
                  </h3>
                  <div className="space-y-1">
                    {searchResults.bets.map((bet) => (
                      <button
                        key={bet.id}
                        onClick={() => handleSelect(
                          bet.stato === 'Archiviata' ? 'archived' : 
                          bet.tipo === 'Rapida' ? 'quick' : 'ongoing'
                        )}
                        className="w-full rounded-md p-3 text-left hover:bg-muted transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {bet.tipo === 'Rapida' ? (
                              <Zap className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            ) : bet.stato === 'Archiviata' ? (
                              <Archive className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            ) : (
                              <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            )}
                            <div>
                              <div className="font-medium text-sm">
                                {bet.evento || bet.nomeGioco || 'Scommessa'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {bet.conto} • {formatDateTime(bet.dataEvento)}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm font-semibold">
                            {formatCurrency(bet.stake)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Accounts */}
              {searchResults.accounts.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Conti
                  </h3>
                  <div className="space-y-1">
                    {searchResults.accounts.map((account) => (
                      <button
                        key={account.id}
                        onClick={() => handleSelect('accounts', account.id)}
                        className="w-full rounded-md p-3 text-left hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">{account.conto}</div>
                            <div className="text-xs text-muted-foreground">
                              {account.intestatario}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Wallets */}
              {searchResults.wallets.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Wallets
                  </h3>
                  <div className="space-y-1">
                    {searchResults.wallets.map((wallet) => (
                      <button
                        key={wallet.id}
                        onClick={() => handleSelect('wallets', wallet.id)}
                        className="w-full rounded-md p-3 text-left hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium text-sm">{wallet.nome}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(wallet.saldoAttuale)}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {searchResults.tags.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                    Tag
                  </h3>
                  <div className="space-y-1">
                    {searchResults.tags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => handleSelect('tags', tag.id)}
                        className="w-full rounded-md p-3 text-left hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <div className="font-medium text-sm">{tag.nome}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
            ESC
          </kbd>{' '}
          per chiudere
        </div>
      </DialogContent>
    </Dialog>
  );
}
