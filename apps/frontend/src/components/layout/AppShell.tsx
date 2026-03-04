import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ModeToggle } from '@/components/mode-toggle';
import { alertsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Users,
  Landmark,
  FileText,
  Bell,
  LogOut,
  Menu,
  Sun,
  Moon,
  ChevronLeft,
  Wallet,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Clientes', icon: Users, path: '/clients' },
  { label: 'Empréstimos', icon: Landmark, path: '/loans' },
  { label: 'Relatórios', icon: FileText, path: '/reports' },
  { label: 'Alertas', icon: Bell, path: '/alerts' },
];

const breadcrumbLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/clients': 'Clientes',
  '/loans': 'Empréstimos',
  '/reports': 'Relatórios',
  '/alerts': 'Alertas',
};

export default function AppShell() {
  const { user, logout } = useAuth();
  // theme handled inside ModeToggle
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  // Poll alerts every 60 seconds
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await alertsApi.list(true);
        setUnreadAlerts(res.data.length);
      } catch (e) {}
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (breadcrumbLabels[path]) return breadcrumbLabels[path];
    if (path.startsWith('/clients/')) return 'Detalhes do Cliente';
    if (path.startsWith('/loans/')) return 'Detalhes do Empréstimo';
    return 'LoanTrack';
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
          <Wallet className="w-5 h-5" />
        </div>
        {!sidebarCollapsed && (
          <span className="text-lg font-bold tracking-tight font-display">LoanTrack</span>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-accent ${
                isActive
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
              {item.path === '/alerts' && unreadAlerts > 0 && !sidebarCollapsed && (
                <Badge variant="destructive" className="ml-auto text-[10px] h-5 px-1.5">
                  {unreadAlerts}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size={sidebarCollapsed ? 'icon' : 'default'}
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {!sidebarCollapsed && 'Sair'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r bg-card transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <SidebarContent />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-6 hidden lg:flex"
          style={{ left: sidebarCollapsed ? '52px' : '248px' }}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
        </Button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-14 px-4 lg:px-6 border-b bg-card/50 backdrop-blur-sm shrink-0 shadow-card">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <SidebarContent />
              </SheetContent>
            </Sheet>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground font-display">LoanTrack</span>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{getBreadcrumb()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Alert bell */}
            <Link to="/alerts">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-4 h-4" />
                {unreadAlerts > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground font-bold">
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                  </span>
                )}
              </Button>
            </Link>

            {/* Theme toggle */}
            <ModeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
