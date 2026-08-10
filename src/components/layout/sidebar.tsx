import { useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, FolderGit2, LayoutGrid, Sun, Moon, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from '@/context/theme-context';
import { useApi } from '@/hooks/use-api';
import { fetchOverview } from '@/lib/api';
import { BudgetAlert } from '@/components/dashboard/budget-alert';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sessions', icon: MessageSquare, label: 'Sessions' },
  { to: '/projects', icon: FolderGit2, label: 'Projects' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
];

export function Sidebar() {
  const { theme, toggle } = useTheme();
  const { data: overview } = useApi(useCallback(() => fetchOverview(), []), []);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-56 border-r border-sidebar-border bg-sidebar flex flex-col">
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <LayoutGrid className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-semibold text-sidebar-foreground tracking-tight">Claude</span>
          <span className="text-[10px] text-sidebar-foreground/50 tracking-widest uppercase">Dashboard</span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  buttonVariants({ variant: 'ghost' }),
                  'justify-start gap-3 h-9 w-full',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Separator className="my-3 bg-sidebar-border" />
        <div className="px-2 py-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/35">
            Claude Code Analytics
          </p>
        </div>
      </ScrollArea>

      <div className="border-t border-sidebar-border pt-2">
        <BudgetAlert currentMonthCost={overview?.currentMonthCost ?? null} />
        <Separator className="bg-sidebar-border" />
        <div className="p-3">
          <button
            onClick={toggle}
            className={cn(
              buttonVariants({ variant: 'ghost' }),
              'w-full justify-start gap-3 h-9 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent'
            )}
          >
            {theme === 'dark' ? (
              <><Sun className="h-4 w-4" /><span className="text-sm">Light mode</span></>
            ) : (
              <><Moon className="h-4 w-4" /><span className="text-sm">Dark mode</span></>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
