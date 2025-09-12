"use client";

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/supabase/client';
import LoginPage from '@/components/LoginPage'; 
import AppLayout from '@/components/AppLayout'; 

// This is a placeholder for your main dashboard content
const Dashboard = () => <div>Your Dashboard Content Goes Here</div>;

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  if (!user) {
    return <LoginPage onLogin={(loggedInUser:any) => setUser(loggedInUser)} />;
  }

  return (
    <AppLayout 
      user={user} 
      onLogout={() => supabase.auth.signOut()}
      activeTab="dashboard" // Manage active tab state here
      onTabChange={(tab:any) => console.log(tab)} // Manage active tab state here
    >
      {/* This is where your page content will go, like the dashboard */}
      <Dashboard />
    </AppLayout>
  );
}