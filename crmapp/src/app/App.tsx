"use client";

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/supabase/client';
import LoginPage from '@/components/LoginPage'; 
import ResetPasswordPage from '@/components/ResetPasswordPage';
import AppLayout from '@/components/AppLayout'; 
import DashboardPage from '@/components/dashboard/Dashboard';
import ClientsPage from '@/components/clients/ClientsPage';
import RemindersPage from '@/components/reminders/RemindersPage';
import OrdersPage from '@/components/orders/OrdersPage';
import { DataProvider } from '@/contexts/DataContext';
import ReportPage from '@/components/report/ReportPage';

// Placeholder components for other views
type View = 'dashboard' | 'clients' | 'reminders' | 'report' | 'client-detail'| 'orders';

// Data initialization component
function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [createReminderOpen, setCreateReminderOpen] = useState(false);
  const [createReminderSeed, setCreateReminderSeed] = useState<{ clientId: number; clientName: string } | null>(null);
  const [isResetPassword, setIsResetPassword] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    // Check if we're on the reset password page
    const checkResetPassword = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      const type = urlParams.get('type');
      
      if (type === 'recovery' && accessToken && refreshToken) {
        setIsResetPassword(true);
        // Set the session with the tokens from the URL
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
      }
    };

    checkUser();
    checkResetPassword();

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!user) {
    if (isResetPassword) {
      return <ResetPasswordPage onLogin={(loggedInUser: User) => setUser(loggedInUser)} />;
    }
    return <LoginPage onLogin={(loggedInUser: User) => setUser(loggedInUser)} />;
  }

  if (loading) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <div className="text-lg font-semibold text-foreground">Loading CRM Dashboard</div>
              <div className="text-sm text-muted-foreground mt-2">Please wait while we prepare your data...</div>
            </div>
        </div>
    );
  }

  const handleTabChange = (tab: string) => {
    setActiveView(tab as View);
  };

  const handleCreateReminder = (clientId: number, clientName: string) => {
    setCreateReminderSeed({ clientId, clientName });
    setCreateReminderOpen(true);
    setActiveView('reminders');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardPage user={user!} />;
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
      case 'report':
        return <ReportPage user={user!} />;
      default:
        return <DashboardPage user={user!} />;
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