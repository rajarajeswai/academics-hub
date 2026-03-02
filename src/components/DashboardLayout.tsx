import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { GraduationCap, LayoutDashboard, Upload, Calculator, BarChart3, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/upload', label: 'Upload Marksheet', icon: Upload },
  { href: '/calculator', label: 'GPA Calculator', icon: Calculator },
  { href: '/cgpa', label: 'CGPA Calculator', icon: BarChart3 },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { signOut, user } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col bg-gradient-hero border-r border-sidebar-border">
        <div className="p-6">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="bg-gradient-gold p-2 rounded-xl">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <span className="text-lg font-display font-bold text-primary-foreground">
              AU Grade<span className="text-gradient-gold">Pro</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-sidebar-accent text-secondary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/50 mb-3 truncate px-2">{user?.email}</p>
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-hero border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-gold p-1.5 rounded-lg">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-display font-bold text-primary-foreground">AU GradePro</span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-primary-foreground/70">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex gap-1 mt-3 overflow-x-auto pb-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-primary-foreground/60 hover:text-primary-foreground'
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <main className="flex-1 md:overflow-auto">
        <div className="md:p-8 p-4 pt-28 md:pt-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
