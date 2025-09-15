"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import StatsCard from './StatsCard';
import ClientCard from './ClientCard';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { 
  Search, 
  Users, 
  ShoppingBag, 
  AlertTriangle,
  RefreshCw,
  Share2 // New icon for shared clients
} from 'lucide-react';

interface DashboardData {
  stats: {
    managedClients: number;
    sharedClients: number;
    activeOrders: number;
    expiringSoon: number;
  };
  recentClients: Client[] | null;
}

interface Client {
  id: number;
  name: string;
  age: number | null;
  issue: string | null;
  phone: string | null;
  lifewave_id: number | null;
  enrollment_date?: string; 
  expiry_date?: string;
}

interface DashboardPageProps {
  onClientClick: (clientId: number) => void;
  user: SupabaseUser;
}

const fetchDashboardData = async (userId: string): Promise<DashboardData> => {
  const { data, error } = await supabase.rpc('get_dashboard_data', {
    admin_uuid: userId,
  });

  if (error) {
    console.error("Error fetching dashboard data via RPC:", error);
    throw new Error('Could not fetch dashboard data.');
  }

  return data as unknown as DashboardData;;
};

export default function DashboardPage({ user, onClientClick }: DashboardPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // 2. useQuery is configured to call our fetch function
  const { 
    data, 
    isLoading, 
    isError,
    refetch 
  } = useQuery<DashboardData>({
    // The query key includes the user's ID to cache data per-user
    queryKey: ['dashboardData', user.id], 
    // The query function now passes the user's ID to our fetcher
    queryFn: () => fetchDashboardData(user.id), 
  });

  const filteredClients = data?.recentClients?.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="p-4 space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded"></div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-muted rounded-lg"></div>)}
        </div>
      </div>
    );
  }

  if (isError) {
    return <div className="p-4 text-center text-destructive">Failed to load dashboard data. Please try again.</div>;
  }

  // 3. The UI is updated to display the new data fields
  return (
    <div className="p-4 space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search recent clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatsCard
          title="My Clients"
          value={data?.stats.managedClients ?? 0}
          icon={Users}
        />
        <StatsCard
          title="Other Clients Shared"
          value={data?.stats.sharedClients ?? 0}
          icon={Share2}
        />
        <StatsCard
          title="Active Orders"
          value={data?.stats.activeOrders ?? 0}
          icon={ShoppingBag}
        />
        <StatsCard
          title="Expiring Soon"
          value={data?.stats.expiringSoon ?? 0}
          icon={AlertTriangle}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent Clients</h2>
          <Button variant="ghost" size="icon" onClick={() => refetch()} aria-label="Refresh data">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-3">
          {filteredClients.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No clients found
              </CardContent>
            </Card>
          ) : (
            filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onClick={onClientClick}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}