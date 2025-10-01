"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/supabase/client';
import { DashboardData, ClientsData, FetchedOrder, Reminder } from '@/components/interface';

interface DataCache {
  dashboardData: DashboardData | null;
  clientsData: ClientsData | null;
  ordersData: FetchedOrder[] | null;
  remindersData: Reminder[] | null;
  lastFetched: {
    dashboardData: number | null;
    clientsData: number | null;
    ordersData: number | null;
    remindersData: number | null;
  };
}

interface DataContextType {
  // Data
  dashboardData: DashboardData | null;
  clientsData: ClientsData | null;
  ordersData: FetchedOrder[] | null;
  remindersData: Reminder[] | null;
  
  // Loading states
  isLoading: {
    dashboardData: boolean;
    clientsData: boolean;
    ordersData: boolean;
    remindersData: boolean;
  };
  
  // Error states
  errors: {
    dashboardData: string | null;
    clientsData: string | null;
    ordersData: string | null;
    remindersData: string | null;
  };
  
  // Actions
  fetchDashboardData: (userId: string, forceRefresh?: boolean) => Promise<void>;
  fetchClientsData: (userId: string, forceRefresh?: boolean) => Promise<void>;
  fetchOrdersData: (userId: string, forceRefresh?: boolean) => Promise<void>;
  fetchRemindersData: (userId: string, searchTerm?: string, forceRefresh?: boolean) => Promise<void>;
  
  // Cache invalidation
  invalidateCache: (dataType?: 'dashboardData' | 'clientsData' | 'ordersData' | 'remindersData') => void;
  
  // Refresh all data
  refreshAllData: (userId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export function DataProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<DataCache>({
    dashboardData: null,
    clientsData: null,
    ordersData: null,
    remindersData: null,
    lastFetched: {
      dashboardData: null,
      clientsData: null,
      ordersData: null,
      remindersData: null,
    },
  });

  const [isLoading, setIsLoading] = useState({
    dashboardData: false,
    clientsData: false,
    ordersData: false,
    remindersData: false,
  });

  const [errors, setErrors] = useState({
    dashboardData: null,
    clientsData: null,
    ordersData: null,
    remindersData: null,
  });

  const isCacheValid = (lastFetched: number | null): boolean => {
    if (!lastFetched) return false;
    return Date.now() - lastFetched < CACHE_DURATION;
  };

  const fetchDashboardData = useCallback(async (userId: string, forceRefresh = false) => {
    if (!forceRefresh && cache.dashboardData && isCacheValid(cache.lastFetched.dashboardData)) {
      return;
    }

    setIsLoading(prev => ({ ...prev, dashboardData: true }));
    setErrors(prev => ({ ...prev, dashboardData: null }));

    try {
      const { data, error } = await supabase.rpc('get_dashboard_data', {
        admin_uuid: userId,
      });

      if (error) {
        console.error('Error fetching dashboard data:', error);
        throw new Error('Could not fetch dashboard data');
      }

      const dashboardData = data as unknown as DashboardData;
      setCache(prev => ({
        ...prev,
        dashboardData,
        lastFetched: { ...prev.lastFetched, dashboardData: Date.now() }
      }));
    } catch (error: any) {
      setErrors(prev => ({ ...prev, dashboardData: error.message }));
    } finally {
      setIsLoading(prev => ({ ...prev, dashboardData: false }));
    }
  }, [cache.dashboardData, cache.lastFetched.dashboardData]);

  const fetchClientsData = useCallback(async (userId: string, forceRefresh = false) => {
    if (!forceRefresh && cache.clientsData && isCacheValid(cache.lastFetched.clientsData)) {
      return;
    }

    setIsLoading(prev => ({ ...prev, clientsData: true }));
    setErrors(prev => ({ ...prev, clientsData: null }));

    try {
      const { data, error } = await supabase.rpc('get_clients_data', {
        admin_uuid: userId
      });

      if (error) {
        console.error('Error fetching clients data:', error);
        throw new Error('Could not fetch clients data');
      }

      const response = data as unknown as { managedClients: any[]; sharedClients: any[] };
      const clientsData: ClientsData = {
        managedClients: response?.managedClients || [],
        sharedClients: response?.sharedClients || []
      };

      setCache(prev => ({
        ...prev,
        clientsData,
        lastFetched: { ...prev.lastFetched, clientsData: Date.now() }
      }));
    } catch (error: any) {
      setErrors(prev => ({ ...prev, clientsData: error.message }));
    } finally {
      setIsLoading(prev => ({ ...prev, clientsData: false }));
    }
  }, [cache.clientsData, cache.lastFetched.clientsData]);

  const fetchOrdersData = useCallback(async (userId: string, forceRefresh = false) => {
    if (!forceRefresh && cache.ordersData && isCacheValid(cache.lastFetched.ordersData)) {
      return;
    }

    setIsLoading(prev => ({ ...prev, ordersData: true }));
    setErrors(prev => ({ ...prev, ordersData: null }));

    try {
      const { data, error } = await supabase.rpc('get_orders', {
        admin_uuid: userId
      });

      if (error) {
        console.error('Error fetching orders data:', error);
        throw new Error('Could not fetch orders data');
      }

      const ordersData = data as FetchedOrder[];
      setCache(prev => ({
        ...prev,
        ordersData,
        lastFetched: { ...prev.lastFetched, ordersData: Date.now() }
      }));
    } catch (error: any) {
      setErrors(prev => ({ ...prev, ordersData: error.message }));
    } finally {
      setIsLoading(prev => ({ ...prev, ordersData: false }));
    }
  }, [cache.ordersData, cache.lastFetched.ordersData]);

  const fetchRemindersData = useCallback(async (userId: string, searchTerm = '', forceRefresh = false) => {
    if (!forceRefresh && cache.remindersData && isCacheValid(cache.lastFetched.remindersData)) {
      return;
    }

    setIsLoading(prev => ({ ...prev, remindersData: true }));
    setErrors(prev => ({ ...prev, remindersData: null }));

    try {
      const { data, error } = await supabase.rpc('get_reminders_for_admin', {
        admin_uuid: userId,
        search_term: searchTerm,
        sort_by: 'trigger_date',
        sort_order: 'ASC'
      });

      if (error) {
        console.error('Error fetching reminders data:', error);
        throw new Error('Could not fetch reminders data');
      }

      const remindersData = data as Reminder[];
      setCache(prev => ({
        ...prev,
        remindersData,
        lastFetched: { ...prev.lastFetched, remindersData: Date.now() }
      }));
    } catch (error: any) {
      setErrors(prev => ({ ...prev, remindersData: error.message }));
    } finally {
      setIsLoading(prev => ({ ...prev, remindersData: false }));
    }
  }, [cache.remindersData, cache.lastFetched.remindersData]);

  const invalidateCache = useCallback((dataType?: 'dashboardData' | 'clientsData' | 'ordersData' | 'remindersData') => {
    if (dataType) {
      setCache(prev => ({
        ...prev,
        [dataType]: null,
        lastFetched: { ...prev.lastFetched, [dataType]: null }
      }));
    } else {
      // Invalidate all cache
      setCache({
        dashboardData: null,
        clientsData: null,
        ordersData: null,
        remindersData: null,
        lastFetched: {
          dashboardData: null,
          clientsData: null,
          ordersData: null,
          remindersData: null,
        },
      });
    }
  }, []);

  const refreshAllData = useCallback(async (userId: string) => {
    await Promise.all([
      fetchDashboardData(userId, true),
      fetchClientsData(userId, true),
      fetchOrdersData(userId, true),
      fetchRemindersData(userId, '', true),
    ]);
  }, [fetchDashboardData, fetchClientsData, fetchOrdersData, fetchRemindersData]);

  const value: DataContextType = {
    dashboardData: cache.dashboardData,
    clientsData: cache.clientsData,
    ordersData: cache.ordersData,
    remindersData: cache.remindersData,
    isLoading,
    errors,
    fetchDashboardData,
    fetchClientsData,
    fetchOrdersData,
    fetchRemindersData,
    invalidateCache,
    refreshAllData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
