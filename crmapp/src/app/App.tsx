"use client";

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/supabase/client';
import LoginPage from '@/components/LoginPage'; 
import AppLayout from '@/components/AppLayout'; 
import DashboardPage from '@/components/dashboard/Dashboard'

// Placeholder components for other views
const ClientsPage = () => <div className="p-4">Clients Page Content</div>;
const RemindersPage = () => <div className="p-4">Reminders Page Content</div>;
const CalendarPage = () => <div className="p-4">Calendar Page Content</div>;

type View = 'dashboard' | 'clients' | 'reminders' | 'calendar' | 'client-detail';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

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

  if (!user) {
    return <LoginPage onLogin={(loggedInUser:any) => setUser(loggedInUser)} />;
  }

  if (loading) {
    // A simple loading state
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );
  }

  const handleTabChange = (tab: string) => {
    setActiveView(tab as View);
    // Reset selected client if we navigate away from the detail view
    if (tab !== 'client-detail') {
      setSelectedClientId(null);
    }
  };

  const handleClientClick = (clientId: number) => {
    setSelectedClientId(clientId);
    setActiveView('client-detail');
  };

  const renderContent = () => {
    // A real client detail page would be more complex
    if (activeView === 'client-detail') {
        return <div className="p-4">Showing details for client ID: {selectedClientId}</div>;
    }

    switch (activeView) {
      case 'dashboard':
        return <DashboardPage user={user!} onClientClick={handleClientClick} />;
      case 'clients':
        return <ClientsPage />;
      case 'reminders':
        return <RemindersPage />;
      case 'calendar':
        return <CalendarPage />;
      default:
        // Fallback to dashboard
        return <DashboardPage user={user!} onClientClick={handleClientClick} />;
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