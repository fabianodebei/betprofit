import { cn } from '@/lib/utils';
import { LayoutDashboard, Users, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Utenti', icon: Users },
  { id: 'statistics', label: 'Statistiche', icon: BarChart3 },
];

export const AdminSidebar = ({ activeTab, onTabChange, collapsed, onToggleCollapse }: AdminSidebarProps) => {
  return (
    <aside className={cn(
      "h-full border-r border-border/50 bg-[hsl(220,30%,8%)] flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-56"
    )}>
      {/* Logo area */}
      <div className="p-4 border-b border-border/30 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <BarChart3 className="h-4 w-4 text-primary" />
        </div>
        {!collapsed && (
          <span className="font-bold text-sm text-foreground whitespace-nowrap">Admin Panel</span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === item.id
                ? "bg-primary/15 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="p-2 border-t border-border/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-full justify-center"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  );
};
