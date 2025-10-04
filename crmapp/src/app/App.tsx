"use client";

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/supabase/client';
import LoginPage from '@/components/LoginPage'; 
import AppLayout from '@/components/AppLayout'; 
import DashboardPage from '@/components/dashboard/Dashboard';
import ClientsPage from '@/components/clients/ClientsPage';
import RemindersPage from '@/components/reminders/RemindersPage';
import OrdersPage from '@/components/orders/OrdersPage';
import { DataProvider } from '@/contexts/DataContext';

// Placeholder components for other views
const CalendarPage = () => <div className="p-4">Calendar Coming Soon</div>;
type View = 'dashboard' | 'clients' | 'reminders' | 'calendar' | 'client-detail'| 'orders';

// Data initialization component
function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [createReminderOpen, setCreateReminderOpen] = useState(false);
  const [createReminderSeed, setCreateReminderSeed] = useState<{ clientId: number; clientName: string } | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkUser();

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // No initial data fetching - let individual pages handle their own data

  if (!user) {
    return <LoginPage onLogin={(loggedInUser:any) => setUser(loggedInUser)} />;
  }

  if (loading) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );
  }

  const handleTabChange = (tab: string) => {
    setActiveView(tab as View);
  };

  const handleClientClick = (clientId: number) => {
    setActiveView('client-detail');
  };

  const handleCreateReminder = (clientId: number, clientName: string) => {
    setCreateReminderSeed({ clientId, clientName });
    setCreateReminderOpen(true);
    setActiveView('reminders');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardPage user={user!} onClientClick={handleClientClick} />;
      case 'clients':
        return <ClientsPage user={user!} onCreateReminder={handleCreateReminder} />;
      case 'orders':
      return <OrdersPage user={user} />;
      case 'reminders':
        return <RemindersPage 
        user={user!} 
        createDialogOpen={createReminderOpen}
        onCreateDialogChange={setCreateReminderOpen}
        createSeed={createReminderSeed || undefined}
      />;
      case 'calendar':
        return <CalendarPage />;
      default:
        return <DashboardPage user={user!} onClientClick={handleClientClick}/>;
    }
  };

  return (
    <AppLayout 
      user={user} 
      onLogout={() => supabase.auth.signOut()}
      activeTab={activeView}
      onTabChange={handleTabChange}
    >
      {renderContent()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}