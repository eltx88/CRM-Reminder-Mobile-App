"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import StatsCard from './StatsCard';
import { DonutChartCard } from './DonutChartCard';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { ShoppingBag,RefreshCw,Bell,Package,TrendingUp } from 'lucide-react';

interface DashboardPageProps {
  user: SupabaseUser;
}

export default function EnhancedDashboard({ user }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState('packages');
  const [showSharedClients, setShowSharedClients] = useState(false);
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  
  const { 
    dashboardData: data, 
    isLoading: { dashboardData: isLoading }, 
    errors: { dashboardData: isError },
    fetchDashboardData: refetch 
  } = useData();

  // Initial load guard to prevent double calls
  const hasFetchedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initial load
  useEffect(() => {
    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;
    
    // Set a timeout to show a message if loading takes too long
    timeoutRef.current = setTimeout(() => {
      setShowTimeoutMessage(true);
    }, 3000); // Show timeout message after 3 seconds
    
    // Dashboard data will always use current month, no need to pass dates
    refetch(user.id);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [refetch, user.id]);

  // Clear timeout when data loads
  useEffect(() => {
    if (!isLoading && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setShowTimeoutMessage(false);
    }
  }, [isLoading]);


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
      <div className="p-4 space-y-6">
        {/* Header with Refresh - Show immediately */}
        <div className="flex items-center justify-end">
          <Button variant="outline" onClick={() => refetch(user.id, undefined, undefined, true)} className="ml-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards - Show with skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-muted rounded-lg animate-pulse flex items-center justify-center loading-skeleton">
            <div className="text-center text-optimized">
              <div className="text-2xl font-bold text-muted-foreground">Loading...</div>
              <div className="text-sm text-muted-foreground">Active Orders This Month</div>
            </div>
          </div>
          <div className="h-24 bg-muted rounded-lg animate-pulse flex items-center justify-center loading-skeleton">
            <div className="text-center text-optimized">
              <div className="text-2xl font-bold text-muted-foreground">Loading...</div>
              <div className="text-sm text-muted-foreground">Completed Orders This Month</div>
            </div>
          </div>
        </div>

        {/* Reminders Cards - Show with skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-24 bg-muted rounded-lg animate-pulse flex items-center justify-center loading-skeleton">
            <div className="text-center text-optimized">
              <div className="text-2xl font-bold text-muted-foreground">Loading...</div>
              <div className="text-sm text-muted-foreground">Follow Up Reminders Today</div>
            </div>
          </div>
          <div className="h-24 bg-muted rounded-lg animate-pulse flex items-center justify-center loading-skeleton">
            <div className="text-center text-optimized">
              <div className="text-2xl font-bold text-muted-foreground">Loading...</div>
              <div className="text-sm text-muted-foreground">Expiry Reminders Today</div>
            </div>
          </div>
        </div>

        {/* Charts - Show with skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-muted rounded-lg animate-pulse flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-semibold text-muted-foreground mb-2">Loading Chart...</div>
              <div className="text-sm text-muted-foreground">Package Distribution</div>
            </div>
          </div>
          <div className="h-64 bg-muted rounded-lg animate-pulse flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-semibold text-muted-foreground mb-2">Loading Stats...</div>
              <div className="text-sm text-muted-foreground">Package Metrics</div>
            </div>
          </div>
        </div>


        {/* Timeout message */}
        {showTimeoutMessage && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <div className="text-yellow-800 font-medium mb-2">Loading is taking longer than expected</div>
            <div className="text-sm text-yellow-700">
              This might be due to a slow database connection. Please wait or try refreshing.
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch(user.id, undefined, undefined, true)} 
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (isError) {
    return <div className="p-4 text-center text-destructive">Failed to load dashboard data. Please try again.</div>;
  }

  return (
    <div className="p-4 space-y-6 dashboard-content">
      {/* Header with Refresh - Critical content */}
      <div className="flex items-center justify-end critical-content">
        <Button variant="outline" onClick={() => refetch(user.id, undefined, undefined, true)} className="ml-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <StatsCard
          title="Orders Pending Collection This Month"
          value={data?.stats.activeOrders ?? 0}
          icon={ShoppingBag}
        />
        <StatsCard
          title="Orders Collected This Month"
          value={data?.stats.completedOrders ?? 0}
          icon={Package}
        />
      </div>

      {/* Reminders Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatsCard
          title="Follow Up Reminders Today"
          value={getReminderCounts.followUp}
          icon={Bell}
        />
        <StatsCard
          title="Expiry Reminders Today"
          value={getReminderCounts.expiry}
          icon={Bell}
        />
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
                  <span className="text-sm text-muted-foreground">Total Orders This Month</span>
                  <span className="font-semibold">
                    {(data?.stats.activeOrders ?? 0) + (data?.stats.completedOrders ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Orders per Client</span>
                  <span className="font-semibold">
                    {totalClients > 0 ? (((data?.stats.activeOrders ?? 0) + (data?.stats.completedOrders ?? 0)) / totalClients).toFixed(1) : '0'}
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