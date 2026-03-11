import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCompanyBranding } from '@/features/revendedora/hooks/useCompanyBranding';
import { useCompany } from '@/features/revendedora/contexts/CompanyContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Package, Users, BarChart3, Percent, Palette, Menu, Trophy, Building2, Tag, ShoppingBag, X,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  basePath?: string;
}

export function AdminLayout({ children, basePath = '/produto/admin' }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { company: branding } = useCompanyBranding();
  const { loading } = useCompany();

  const adminNavigation = [
    { group: 'Gestão de Estoque', items: [
      { title: 'Produtos', url: basePath.replace('/admin', '') + '/admin/products', icon: Package },
      { title: 'Solicitações', url: basePath.replace('/admin', '') + '/admin/product-requests', icon: ShoppingBag },
      { title: 'Etiquetas', url: basePath.replace('/admin', '') + '/admin/tags', icon: Tag },
    ]},
    { group: 'Pessoas & Marca', items: [
      { title: 'Rede de Vendas', url: basePath.replace('/admin', '') + '/admin/resellers', icon: Users },
      { title: 'Comissões', url: basePath.replace('/admin', '') + '/admin/commission-config', icon: Percent },
      { title: 'Personalização', url: basePath.replace('/admin', '') + '/admin/branding', icon: Palette },
    ]},
    { group: 'Administração', items: [
      { title: 'Dashboard', url: basePath.replace('/admin', '') + '/admin/dashboard', icon: LayoutDashboard },
      { title: 'Analytics', url: basePath.replace('/admin', '') + '/admin/analytics', icon: BarChart3 },
      { title: 'Gamificação', url: basePath.replace('/admin', '') + '/admin/gamification', icon: Trophy },
      { title: 'Pedidos', url: basePath.replace('/admin', '') + '/admin/orders', icon: ShoppingBag },
    ]},
  ];

  const Sidebar = ({ onClose }: { onClose?: () => void }) => (
    <div className="flex flex-col h-full bg-background/60 backdrop-blur-xl border-r border-border/10">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border/10">
        {branding?.logo_url ? <img src={branding.logo_url} className="h-9 w-9 object-contain rounded-xl" /> : <Building2 className="h-5 w-5 text-primary" />}
        <h2 className="text-sm font-black tracking-tight truncate">{branding?.company_name || 'Admin'}</h2>
        {onClose && <Button variant="ghost" size="icon" onClick={onClose}><X /></Button>}
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {adminNavigation.map(s => (
          <div key={s.group}>
            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-2 px-3">{s.group}</p>
            {s.items.map(i => {
              const active = location.pathname === i.url;
              return (
                <button key={i.url} onClick={() => { navigate(i.url); onClose?.(); }} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left", active ? "bg-primary text-primary-foreground shadow-lg" : "text-foreground/70 hover:bg-primary/10")}>
                  <i.icon className="h-4 w-4" /> <span>{i.title}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0"><Sidebar /></aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center px-4 h-14 border-b border-border/10">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon"><Menu /></Button></SheetTrigger>
            <SheetContent side="left" className="w-72 p-0"><Sidebar onClose={() => setMobileOpen(false)} /></SheetContent>
          </Sheet>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
