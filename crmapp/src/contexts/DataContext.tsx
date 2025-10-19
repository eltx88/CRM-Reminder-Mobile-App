"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/supabase/client';
import { DashboardData, ClientsData, InactiveClientsData, FetchedOrder, Reminder, Client } from '@/components/interface';

// Pagination response interfaces
interface PaginatedOrdersResponse {
  orders: FetchedOrder[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PaginatedRemindersResponse {
  reminders: Reminder[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface DataCache {
  dashboardData: DashboardData | null;
  clientsData: ClientsData | null;
  inactiveClientsData: InactiveClientsData | null;
  ordersData: PaginatedOrdersResponse | null;
  remindersData: PaginatedRemindersResponse | null;
  lastFetched: {
    dashboardData: number | null;
    clientsData: number | null;
    inactiveClientsData: number | null;
    ordersData: number | null;
    remindersData: number | null;
  };
}

interface DataContextType {
  // Data
  dashboardData: DashboardData | null;
  clientsData: ClientsData | null;
  inactiveClientsData: InactiveClientsData | null;
  ordersData: PaginatedOrdersResponse | null;
  remindersData: PaginatedRemindersResponse | null;
  
  // Loading states
  isLoading: {
    dashboardData: boolean;
    clientsData: boolean;
    inactiveClientsData: boolean;
    ordersData: boolean;
    remindersData: boolean;
  };
  
  // Error states
  errors: {
    dashboardData: string | null;
    clientsData: string | null;
    inactiveClientsData: string | null;
    ordersData: string | null;
    remindersData: string | null;
  };
  
  // Actions with date range and pagination support
  fetchDashboardData: (userId: string, startDate?: string, endDate?: string, forceRefresh?: boolean) => Promise<void>;
  fetchClientsData: (userId: string, forceRefresh?: boolean) => Promise<void>;
  fetchInactiveClientsData: (userId: string, forceRefresh?: boolean) => Promise<void>;
  fetchOrdersData: (userId: string, startDate?: string, endDate?: string, searchTerm?: string, page?: number, limit?: number, forceRefresh?: boolean) => Promise<void>;
  fetchRemindersData: (userId: string, startDate?: string, endDate?: string, searchTerm?: string, reminderTypeFilter?: string, sortBy?: string, sortOrder?: string, page?: number, limit?: number, forceRefresh?: boolean) => Promise<void>;
  
  // Client management actions
  setClientInactive: (userId: string, clientId: number) => Promise<void>;
  setClientActive: (userId: string, clientId: number) => Promise<void>;
  
  // Cache invalidation
  invalidateCache: (dataType?: 'dashboardData' | 'clientsData' | 'inactiveClientsData' | 'ordersData' | 'remindersData') => void;
  
  // Refresh all data
  refreshAllData: (userId: string) => Promise<void>;
  
  // Delete client
  deleteClient: (userId: string, clientId: number) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

export function DataProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<DataCache>({
    dashboardData: null,
    clientsData: null,
    inactiveClientsData: null,
    ordersData: null,
    remindersData: null,
    lastFetched: {
      dashboardData: null,
      clientsData: null,
      inactiveClientsData: null,
      ordersData: null,
      remindersData: null,
    },
  });

  const [isLoading, setIsLoading] = useState({
    dashboardData: false,
    clientsData: false,
    inactiveClientsData: false,
    ordersData: false,
    remindersData: false,
  });

  const [errors, setErrors] = useState<{
    dashboardData: string | null;
    clientsData: string | null;
    inactiveClientsData: string | null;
    ordersData: string | null;
    remindersData: string | null;
  }>({
    dashboardData: null,
    clientsData: null,
    inactiveClientsData: null,
    ordersData: null,
    remindersData: null,
  });

  const isCacheValid = (lastFetched: number | null): boolean => {
    if (!lastFetched) return false;
    return Date.now() - lastFetched < CACHE_DURATION;
  };

  const fetchDashboardData = useCallback(async (userId: string, startDate?: string, endDate?: string, forceRefresh = false) => {
    if (!forceRefresh && cache.dashboardData && isCacheValid(cache.lastFetched.dashboardData)) {
      return;
    }

    // Prevent duplicate requests
    if (isLoading.dashboardData) {
      return;
    }

    setIsLoading(prev => ({ ...prev, dashboardData: true }));
    setErrors(prev => ({ ...prev, dashboardData: null }));

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      // Always use current month for dashboard data, regardless of parameters passed
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const todayString = today.toISOString().split('T')[0];
      
      // Fetch dashboard data for the month
      const { data: dashboardData, error: dashboardError } = await supabase.rpc('get_dashboard_data', {
        admin_uuid: userId,
        start_date: startOfMonth.toISOString().split('T')[0],
        end_date: endOfMonth.toISOString().split('T')[0],
      });

      // Fetch today's reminders separately
      const { data: remindersData, error: remindersError } = await supabase.rpc('get_reminders_for_admin', {
        admin_uuid: userId,
        start_date: todayString,
        end_date: todayString,
        limit_count: 1000, // Get all reminders for today
        offset_count: 0,
      });

      if (dashboardError) {
        console.error('Error fetching dashboard data:', dashboardError);
        throw new Error('Could not fetch dashboard data');
      }

      if (remindersError) {
        console.error('Error fetching reminders data:', remindersError);
        throw new Error('Could not fetch reminders data');
      }

      // Process reminders data to get counts by type
      const reminders = remindersData as Reminder[];
      const followUpCount = reminders.filter((r: Reminder) => r.reminder_type === 'FOLLOW_UP' && r.status === 'PENDING').length;
      const expiryCount = reminders.filter((r: Reminder) => r.reminder_type === 'EXPIRY' && r.status === 'PENDING').length;
      const totalPendingReminders = followUpCount + expiryCount;

      // Combine dashboard data with today's reminder counts
      const dashboardResult = dashboardData as unknown as DashboardData;
      const combinedData: DashboardData = {
        ...dashboardResult,
        stats: {
          ...dashboardResult.stats,
          pendingReminders: totalPendingReminders
        },
        reminderTypeDistribution: [
          { name: 'FOLLOW_UP', value: followUpCount },
          { name: 'EXPIRY', value: expiryCount }
        ]
      };
      clearTimeout(timeoutId);

      setCache(prev => ({
        ...prev,
        dashboardData: combinedData,
        lastFetched: { ...prev.lastFetched, dashboardData: Date.now() }
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Dashboard data fetch error:', errorMessage);
      setErrors(prev => ({ ...prev, dashboardData: errorMessage }));
    } finally {
      setIsLoading(prev => ({ ...prev, dashboardData: false }));
    }
  }, [cache.dashboardData, cache.lastFetched.dashboardData, isLoading.dashboardData]);

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

      const response = data as unknown as { managedClients: Client[]; sharedClients: Client[] };
      const clientsData: ClientsData = {
        managedClients: response?.managedClients || [],
        sharedClients: response?.sharedClients || []
      };

      setCache(prev => ({
        ...prev,
        clientsData,
        lastFetched: { ...prev.lastFetched, clientsData: Date.now() }
      }));
    } catch (error: unknown) {
      setErrors(prev => ({ ...prev, clientsData: error instanceof Error ? error.message : 'Unknown error' }));
    } finally {
      setIsLoading(prev => ({ ...prev, clientsData: false }));
    }
  }, [cache.clientsData, cache.lastFetched.clientsData]);

  const invalidateCache = useCallback((dataType?: 'dashboardData' | 'clientsData' | 'inactiveClientsData' | 'ordersData' | 'remindersData') => {
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
        inactiveClientsData: null,
        ordersData: null,
        remindersData: null,
        lastFetched: {
          dashboardData: null,
          clientsData: null,
          inactiveClientsData: null,
          ordersData: null,
          remindersData: null,
        },
      });
    }
  }, []);

  const fetchInactiveClientsData = useCallback(async (userId: string, forceRefresh = false) => {
    if (!forceRefresh && cache.inactiveClientsData && isCacheValid(cache.lastFetched.inactiveClientsData)) {
      return;
    }

    setIsLoading(prev => ({ ...prev, inactiveClientsData: true }));
    setErrors(prev => ({ ...prev, inactiveClientsData: null }));

    try {
      const { data, error } = await supabase.rpc('get_inactive_clients_data', {
        admin_uuid: userId
      });

      if (error) {
        console.error('Error fetching inactive clients data:', error);
        throw new Error('Could not fetch inactive clients data');
      }

      const response = data as unknown as InactiveClientsData;
      const inactiveClientsData: InactiveClientsData = {
        managedInactiveClients: response?.managedInactiveClients || [],
        sharedInactiveClients: response?.sharedInactiveClients || []
      };

      setCache(prev => ({
        ...prev,
        inactiveClientsData,
        lastFetched: { ...prev.lastFetched, inactiveClientsData: Date.now() }
      }));
    } catch (error: unknown) {
      setErrors(prev => ({ ...prev, inactiveClientsData: error instanceof Error ? error.message : 'Unknown error' }));
    } finally {
      setIsLoading(prev => ({ ...prev, inactiveClientsData: false }));
    }
  }, [cache.inactiveClientsData, cache.lastFetched.inactiveClientsData]);

  const setClientInactive = useCallback(async (userId: string, clientId: number) => {
    try {
      const { error } = await supabase.rpc('set_client_inactive', {
        admin_uuid: userId,
        client_id_param: clientId
      });

      if (error) {
        console.error('Error setting client inactive:', error);
        throw new Error('Could not deactivate client');
      }

      // Invalidate clients cache to force refresh
      invalidateCache('clientsData');
      invalidateCache('inactiveClientsData');
    } catch (error: unknown) {
      console.error('Error setting client inactive:', error);
      throw error;
    }
  }, [invalidateCache]);

  const setClientActive = useCallback(async (userId: string, clientId: number) => {
    try {
      const { error } = await supabase.rpc('set_client_active', {
        admin_uuid: userId,
        client_id_param: clientId
      });

      if (error) {
        console.error('Error setting client active:', error);
        throw new Error('Could not reactivate client');
      }

      // Invalidate clients cache to force refresh
      invalidateCache('clientsData');
      invalidateCache('inactiveClientsData');
    } catch (error: unknown) {
      console.error('Error setting client active:', error);
      throw error;
    }
  }, [invalidateCache]);

  const fetchOrdersData = useCallback(async (userId: string, startDate?: string, endDate?: string, searchTerm?: string, page: number = 1, limit: number = 50, forceRefresh = false) => {
    if (!forceRefresh && cache.ordersData && isCacheValid(cache.lastFetched.ordersData)) {
      return;
    }

    setIsLoading(prev => ({ ...prev, ordersData: true }));
    setErrors(prev => ({ ...prev, ordersData: null }));

    try {
      const { data, error } = await supabase.rpc('get_orders', {
        admin_uuid: userId,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        search_term: searchTerm || undefined,
        limit_count: limit,
        offset_count: (page - 1) * limit,
      });

      if (error) {
        console.error('Error fetching orders data:', error);
        throw new Error('Could not fetch orders data');
      }

      // Extract total count from first row (it's the same for all rows)
      const totalCount = data?.[0]?.total_count || 0;
      const orders = data?.map(row => ({
        order_id: row.order_id,
        order_number: row.order_number,
        client_id: row.client_id,
        client_name: row.client_name,
        enrollment_date: row.enrollment_date,
        expiry_date: row.expiry_date,
        payment_mode: row.payment_mode,
        collection_date: row.collection_date,
        payment_date: row.payment_date,
        shipping_location: row.shipping_location,
        notes: row.notes,
        order_items: row.order_items,
        is_shared: row.is_shared,
        is_partially_collected: row.is_partially_collected || false,
        collection_status: row.collection_status || 'not_started',
        is_maintenance: row.is_maintenance || false,
        enroller_id: row.enroller_id || null,
        enroller_name: row.enroller_name || null
      })) || [];

      const paginatedResponse: PaginatedOrdersResponse = {
        orders,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1
      };

      setCache(prev => ({
        ...prev,
        ordersData: paginatedResponse,
        lastFetched: { ...prev.lastFetched, ordersData: Date.now() }
      }));
    } catch (error: unknown) {
      setErrors(prev => ({ ...prev, ordersData: error instanceof Error ? error.message : 'Unknown error' }));
    } finally {
      setIsLoading(prev => ({ ...prev, ordersData: false }));
    }
  }, [cache.ordersData, cache.lastFetched.ordersData]);

  const fetchRemindersData = useCallback(async (userId: string, startDate?: string, endDate?: string, searchTerm = '', reminderTypeFilter?: string, sortBy = 'trigger_date', sortOrder = 'ASC', page: number = 1, limit: number = 50, forceRefresh = false) => {
    if (!forceRefresh && cache.remindersData && isCacheValid(cache.lastFetched.remindersData)) {
      return;
    }

    setIsLoading(prev => ({ ...prev, remindersData: true }));
    setErrors(prev => ({ ...prev, remindersData: null }));

    try {
      const { data, error } = await supabase.rpc('get_reminders_for_admin', {
        admin_uuid: userId,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        search_term: searchTerm || undefined,
        reminder_type_filter: reminderTypeFilter || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit_count: limit,
        offset_count: (page - 1) * limit,
      });

      if (error) {
        console.error('Error fetching reminders data:', error);
        throw new Error('Could not fetch reminders data');
      }

      // Extract total count from first row (it's the same for all rows)
      const totalCount = data?.[0]?.total_count || 0;
      const reminders = data?.map(row => ({
        id: row.id,
        client_id: row.client_id,
        client_name: row.client_name,
        client_phone: row.client_phone,
        order_id: row.order_id,
        reminder_type: row.reminder_type as 'FOLLOW_UP' | 'EXPIRY',
        trigger_date: row.trigger_date,
        message: row.message,
        status: row.status as 'PENDING' | 'COMPLETED' | 'DISMISSED'
      })) || [];

      const paginatedResponse: PaginatedRemindersResponse = {
        reminders,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1
      };

      setCache(prev => ({
        ...prev,
        remindersData: paginatedResponse,
        lastFetched: { ...prev.lastFetched, remindersData: Date.now() }
      }));
    } catch (error: unknown) {
      setErrors(prev => ({ ...prev, remindersData: error instanceof Error ? error.message : 'Unknown error' }));
    } finally {
      setIsLoading(prev => ({ ...prev, remindersData: false }));
    }
  }, [cache.remindersData, cache.lastFetched.remindersData]);

  const refreshAllData = useCallback(async (userId: string) => {
    await Promise.all([
      fetchDashboardData(userId, undefined, undefined, true),
      fetchClientsData(userId, true),
      fetchInactiveClientsData(userId, true),
      fetchOrdersData(userId, undefined, undefined, undefined, 1, 50, true),
      fetchRemindersData(userId, undefined, undefined, '', undefined, 'trigger_date', 'ASC', 1, 50, true),
    ]);
  }, [fetchDashboardData, fetchClientsData, fetchInactiveClientsData, fetchOrdersData, fetchRemindersData]);

  const deleteClient = useCallback(async (userId: string, clientId: number) => {
    try {
      const { error } = await supabase.rpc('delete_client', {
        admin_uuid: userId,
        client_id_param: clientId
      });

      if (error) {
        console.error('Error deleting client:', error);
        throw new Error('Could not delete client');
      }

      // Invalidate clients cache to force refresh
      invalidateCache('clientsData');
    } catch (error: unknown) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }, [invalidateCache]);

  const value: DataContextType = {
    dashboardData: cache.dashboardData,
    clientsData: cache.clientsData,
    inactiveClientsData: cache.inactiveClientsData,
    ordersData: cache.ordersData,
    remindersData: cache.remindersData,
    isLoading,
    errors,
    fetchDashboardData,
    fetchClientsData,
    fetchInactiveClientsData,
    fetchOrdersData,
    fetchRemindersData,
    setClientInactive,
    setClientActive,
    invalidateCache,
    refreshAllData,
    deleteClient,
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
