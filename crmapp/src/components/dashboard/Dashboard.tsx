"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DropdownMenu,DropdownMenuContent,DropdownMenuItem,DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import StatsCard from './StatsCard';
import ClientCard from './ClientCard';
import { DonutChartCard } from './DonutChartCard';
import ClientDetailsDialog from '../clients/ClientDetailsDialog';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Search,ShoppingBag,RefreshCw,Bell,Package,TrendingUp } from 'lucide-react';  
import { DashboardData } from '@/components/interface';

interface DashboardPageProps {
  onClientClick: (clientId: number) => void;
  user: SupabaseUser;
}

export default function EnhancedDashboard({ user, onClientClick }: DashboardPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('packages');
  const [showSharedClients, setShowSharedClients] = useState(false);
  const [remindersDropdownOpen, setRemindersDropdownOpen] = useState(false);
  const [isClientDetailsOpen, setIsClientDetailsOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  
  const { 
    dashboardData: data, 
    isLoading: { dashboardData: isLoading }, 
    errors: { dashboardData: isError },
    fetchDashboardData: refetch 
  } = useData();

  // Initial load guard to prevent double calls
  const hasFetchedRef = useRef(false);

  // Initial load
  useEffect(() => {
    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;
    // Set default date ranges for dashboard
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    refetch(user.id, startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0]);
  }, [refetch, user.id]);

  const filteredClients = data?.recentClients?.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Prepare data transformations
  const clientDistributionData = React.useMemo(() => {
    if (!data) return null;
    const distribution = [
      { name: "My Clients", value: data.stats.managedClients },
      { name: "Clients Shared with Me", value: data.stats.sharedClients }
    ].filter(item => item.value > 0);
    
    return distribution.length > 0 ? distribution : null;
  }, [data]);

  const totalClients = React.useMemo(() => {
    return (data?.stats.managedClients ?? 0) + (data?.stats.sharedClients ?? 0);
  }, [data]);

  const handleClientCardClick = (clientId: number) => {
    setSelectedClientId(clientId);
    setIsClientDetailsOpen(true);
  };

  // Helper function to get reminder counts by type
  const getReminderCounts = React.useMemo(() => {
    if (!data?.reminderTypeDistribution) {
      return {
        followUp: 0,
        expiry: 0
      };
    }

    const followUp = data.reminderTypeDistribution.find(item => item.name === 'FOLLOW_UP')?.value ?? 0;
    const expiry = data.reminderTypeDistribution.find(item => item.name === 'EXPIRY')?.value ?? 0;

    return {
      followUp,
      expiry
    };
  }, [data?.reminderTypeDistribution]);

  // Package metrics calculations
  const packageMetrics = React.useMemo(() => {
    const packageData = showSharedClients 
      ? data?.sharedPackageDistribution 
      : data?.managedPackageDistribution;
    
    if (!packageData || packageData.length === 0) {
      return {
        totalPackages: 0,
        mostPopularPackage: 'N/A',
        leastPopularPackage: 'N/A',
      };
    }

    const totalPackages = packageData.reduce((sum, item) => sum + item.value, 0);
    const sortedPackages = [...packageData].sort((a, b) => b.value - a.value);
    const mostPopularPackage = sortedPackages[0]?.name || 'N/A';
    const leastPopularPackage = sortedPackages[sortedPackages.length - 1]?.name || 'N/A';

    return {
      totalPackages,
      mostPopularPackage,
      leastPopularPackage,
    };
  }, [data, showSharedClients]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded"></div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-muted rounded-lg"></div>)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-64 bg-muted rounded-lg"></div>)}
        </div>
      </div>
    );
  }

  if (isError) {
    return <div className="p-4 text-center text-destructive">Failed to load dashboard data. Please try again.</div>;
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-l">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recent clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => refetch(user.id, undefined, undefined, true)} className="ml-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <StatsCard
          title="Orders This Month"
          value={data?.stats.activeOrders ?? 0}
          icon={ShoppingBag}
        />
        <DropdownMenu open={remindersDropdownOpen} onOpenChange={setRemindersDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <div>
              <StatsCard
                title="Reminders Today"
                value={data?.stats.pendingReminders ?? 0}
                icon={Bell}
                onClick={() => setRemindersDropdownOpen(!remindersDropdownOpen)}
              />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-full">
            <DropdownMenuItem className="flex justify-between items-center">
              <span>Follow Up Reminders</span>
              <span className="font-semibold">{getReminderCounts.followUp}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex justify-between items-center">
              <span>Expiry Reminders</span>
              <span className="font-semibold">{getReminderCounts.expiry}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="overview">Clients</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Distribution */}
            <DonutChartCard
              title="Client Distribution"
              data={clientDistributionData}
              colorScheme="clients"
            />
            
            {/* Quick Stats Card */}
            <Card className="col-span-2 sm:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">My Clients</span>
                  <span className="font-semibold">{data?.stats.managedClients ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Clients Shared with Me</span>
                  <span className="font-semibold">{data?.stats.sharedClients ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Orders per Client</span>
                  <span className="font-semibold">
                    {totalClients > 0 ? ((data?.stats.activeOrders ?? 0) / totalClients).toFixed(1) : '0'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Reminders per Client</span>
                  <span className="font-semibold">
                    {totalClients > 0 ? ((data?.stats.pendingReminders ?? 0) / totalClients).toFixed(1) : '0'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="packages" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Package Distribution Chart */}
            {(() => {
              const packageData = showSharedClients 
                ? data?.sharedPackageDistribution 
                : data?.managedPackageDistribution;
              
              const chartTitle = showSharedClients 
                ? "Shared Clients by Package" 
                : "My Clients by Package";
              
              return packageData && packageData.length > 0 ? (
                <DonutChartCard
                  title={chartTitle}
                  data={packageData}
                  colorScheme="packages"
                />
              ) : (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No package data for {showSharedClients ? 'shared' : 'managed'} clients</p>
                  </CardContent>
                </Card>
              );
            })()}
            
            {/* Package Metrics Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Package Metrics
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="client-toggle" className="text-sm">
                      {showSharedClients ? 'Shared with me' : 'Managed by me'}
                    </Label>
                    <Switch
                      id="client-toggle"
                      checked={showSharedClients}
                      onCheckedChange={setShowSharedClients}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Packages</span>
                  <span className="font-semibold">{packageMetrics.totalPackages}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Most Popular</span>
                  <span className="font-semibold">{packageMetrics.mostPopularPackage}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Least Popular</span>
                  <span className="font-semibold">{packageMetrics.leastPopularPackage}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Clients Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Recent Clients</h2>
        
        <div className="space-y-3">
          {filteredClients.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                {searchQuery ? `No clients found matching "${searchQuery}"` : 'No recent clients found'}
              </CardContent>
            </Card>
          ) : (
            filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onClick={handleClientCardClick}
              />
            ))
          )}
        </div>
      </div>

      {/* Client Details Dialog */}
      <ClientDetailsDialog
        open={isClientDetailsOpen}
        onOpenChange={setIsClientDetailsOpen}
        clientId={selectedClientId}
        userId={user.id}
      />
    </div>
  );
}

/*
FUTURE RPC ENHANCEMENTS

1. Monthly Client Growth:
'monthlyClientGrowth', (
  SELECT json_agg(monthly_data.*)
  FROM (
    SELECT DATE_TRUNC('month', created_at)::date as name,
           COUNT(*) as value
    FROM public.clients
    WHERE id = ANY(COALESCE(managed_clients_ids, '{}') || COALESCE(shared_clients_ids, '{}'))
      AND created_at >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY DATE_TRUNC('month', created_at)
  ) monthly_data
),

2. Order Status Distribution:
'orderStatusDistribution', (
  SELECT json_agg(status_data.*)
  FROM (
    SELECT status as name, COUNT(*) as value
    FROM public.orders
    WHERE client_id = ANY(COALESCE(managed_clients_ids, '{}') || COALESCE(shared_clients_ids, '{}'))
    GROUP BY status
  ) status_data
),

3. Reminder Type Distribution:
'reminderTypeDistribution', (
  SELECT json_agg(reminder_data.*)
  FROM (
    SELECT type as name, COUNT(*) as value
    FROM public.reminders
    WHERE client_id = ANY(COALESCE(managed_clients_ids, '{}') || COALESCE(shared_clients_ids, '{}'))
      AND status = 'PENDING'
    GROUP BY type
  ) reminder_data
)
*/