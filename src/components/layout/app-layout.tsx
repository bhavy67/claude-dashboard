import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

export function AppLayout() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="pl-56">
          <div className="p-6 lg:p-8 flex-1">
            <Outlet />
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
