"use client";

import React from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/supabase/client';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Bell, 
  LogOut, 
  Plus,
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
  user, 
  onLogout, 
  children, 
  activeTab, 
  onTabChange 
}: AppLayoutProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'orders', label: 'Orders', icon:Package},
    { id: 'reminders', label: 'Alerts', icon: Bell },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
  ];

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
            onClick={handleLogout}
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
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
