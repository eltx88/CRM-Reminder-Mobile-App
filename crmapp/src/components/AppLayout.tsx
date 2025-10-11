"use client";

import { useMemo, useCallback, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/supabase/client';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  LayoutDashboard, 
  Users, 
  Bell, 
  LogOut, 
  CalendarIcon,
  Settings,
  Package
} from 'lucide-react';

interface AppLayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function AppLayout({ 
  onLogout, 
  children, 
  activeTab, 
  onTabChange 
}: AppLayoutProps) {
  const { dashboardData } = useData();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  const handleLogoutClick = useCallback(() => {
    setShowLogoutDialog(true);
  }, []);

  const handleLogoutConfirm = useCallback(async () => {
    await supabase.auth.signOut();
    onLogout();
    setShowLogoutDialog(false);
  }, [onLogout]);

  const handleLogoutCancel = useCallback(() => {
    setShowLogoutDialog(false);
  }, []);

  // Memoize reminders count to prevent unnecessary recalculations
  const remindersCount = useMemo(() => {
    return dashboardData?.stats?.pendingReminders || 0;
  }, [dashboardData?.stats?.pendingReminders]);

  // Memoize navigation items to prevent recreation on every render
  const navigationItems = useMemo((): Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> => [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Customers', icon: Users },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'reminders', label: 'Alerts', icon: Bell, badge: remindersCount },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  ], [remindersCount]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* New Fixed Header Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-primary text-primary-foreground flex items-center justify-between px-4 z-50 shadow-md">
        <div>
          <h1 className="text-xl font-bold"></h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onTabChange('settings')}
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogoutClick}
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content Area - Added padding-top to avoid being hidden by the header */}
      <main className="flex-1 overflow-auto pb-20 pt-16">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-2 safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const badge = 'badge' in item ? item.badge : null;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-colors relative ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={{ 
                  willChange: 'transform',
                  transform: 'translateZ(0)' // Force hardware acceleration
                }}
              >
                <div className="relative">
                  <span style={{ pointerEvents: 'none' }}>
                    <Icon className="h-5 w-5 mb-1" />
                  </span>
                  {badge !== null && badge !== undefined && badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {badge}
                    </span>
                  )}
                </div>
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleLogoutCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogoutConfirm}
              className="bg-destructive text-destructive-foreground text-white cursor-pointer hover:bg-destructive/90"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
