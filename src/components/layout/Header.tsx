import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Zap, FileText, ArrowRightLeft, Scale, Archive, Wallet, Clock, Settings, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useYear } from '@/contexts/YearContext';
const navigation = [{
  name: 'Dashboard',
  href: '/',
  icon: Home
}, {
  name: 'Puntate',
  href: '/puntate',
  icon: Zap
}, {
  name: 'Rapide',
  href: '/rapide',
  icon: Zap
}, {
  name: 'Conti',
  href: '/conti',
  icon: FileText
}, {
  name: 'Depositi/Prel.',
  href: '/depositi',
  icon: ArrowRightLeft
}, {
  name: 'Bilancio',
  href: '/bilancio',
  icon: Scale
}, {
  name: 'Archiviate',
  href: '/archiviate',
  icon: Archive
}, {
  name: 'Wallets',
  href: '/wallets',
  icon: Wallet
}, {
  name: 'Promemoria',
  href: '/promemoria',
  icon: Clock
}];
export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { selectedYear, setSelectedYear } = useYear();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  return <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-primary to-accent shadow-sm bg-indigo-950 rounded-none">
      <div className="container mx-auto px-4 bg-transparent">
        <div className="flex h-16 items-center justify-between rounded-none bg-transparent">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-primary-foreground">
            
            <span className="text-xl font-bold">Profit Tracker</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map(item => {
            const Icon = item.icon;
            return <Link key={item.name} to={item.href} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive(item.href) ? 'bg-primary-foreground/20 text-primary-foreground' : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground'}`}>
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>;
          })}
            <Link to="/impostazioni" className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ml-2 ${isActive('/impostazioni') ? 'bg-primary-foreground/20 text-primary-foreground' : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground'}`}>
              <Settings className="h-5 w-5" />
            </Link>
          </nav>

          {/* Year Selector */}
          <div className="hidden lg:flex items-center gap-2 rounded-md bg-primary-foreground/10 px-3 py-1.5">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setSelectedYear(selectedYear - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[60px] text-center font-semibold text-primary-foreground">
              {selectedYear}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20" onClick={() => setSelectedYear(selectedYear + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button variant="ghost" size="icon" className="lg:hidden text-primary-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && <div className="lg:hidden border-t border-primary-foreground/20 py-4">
            <nav className="flex flex-col gap-2">
              {navigation.map(item => {
            const Icon = item.icon;
            return <Link key={item.name} to={item.href} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive(item.href) ? 'bg-primary-foreground/20 text-primary-foreground' : 'text-primary-foreground/80 hover:bg-primary-foreground/10'}`}>
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>;
          })}
              <Link to="/impostazioni" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive('/impostazioni') ? 'bg-primary-foreground/20 text-primary-foreground' : 'text-primary-foreground/80 hover:bg-primary-foreground/10'}`}>
                <Settings className="h-5 w-5" />
                Impostazioni
              </Link>
              <div className="mt-2 flex items-center justify-between rounded-md bg-primary-foreground/10 px-3 py-2">
                <span className="text-sm font-medium text-primary-foreground">Anno:</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground" onClick={() => setSelectedYear(selectedYear - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[60px] text-center font-semibold text-primary-foreground">
                    {selectedYear}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground" onClick={() => setSelectedYear(selectedYear + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </nav>
          </div>}
      </div>
    </header>;
}