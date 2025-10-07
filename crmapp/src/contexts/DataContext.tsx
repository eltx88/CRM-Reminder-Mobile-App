"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/supabase/client';
import { DashboardData, ClientsData, FetchedOrder, Reminder } from '@/components/interface';

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
  ordersData: PaginatedOrdersResponse | null;
  remindersData: PaginatedRemindersResponse | null;
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
  ordersData: PaginatedOrdersResponse | null;
  remindersData: PaginatedRemindersResponse | null;
  
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
  
  // Actions with date range and pagination support
  fetchDashboardData: (userId: string, startDate?: string, endDate?: string, forceRefresh?: boolean) => Promise<void>;
  fetchClientsData: (userId: string, forceRefresh?: boolean) => Promise<void>;
  fetchOrdersData: (userId: string, startDate?: string, endDate?: string, searchTerm?: string, page?: number, limit?: number, forceRefresh?: boolean) => Promise<void>;
  fetchRemindersData: (userId: string, startDate?: string, endDate?: string, searchTerm?: string, reminderTypeFilter?: string, sortBy?: string, sortOrder?: string, page?: number, limit?: number, forceRefresh?: boolean) => Promise<void>;
  
  // Cache invalidation
  invalidateCache: (dataType?: 'dashboardData' | 'clientsData' | 'ordersData' | 'remindersData') => void;
  
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

  const fetchDashboardData = useCallback(async (userId: string, startDate?: string, endDate?: string, forceRefresh = false) => {
    if (!forceRefresh && cache.dashboardData && isCacheValid(cache.lastFetched.dashboardData)) {
      return;
    }

    setIsLoading(prev => ({ ...prev, dashboardData: true }));
    setErrors(prev => ({ ...prev, dashboardData: null }));

    try {
      const { data, error } = await supabase.rpc('get_dashboard_data', {
        admin_uuid: userId,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
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
      } as any);

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
        is_maintenance: row.is_maintenance || false
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
    } catch (error: any) {
      setErrors(prev => ({ ...prev, ordersData: error.message }));
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
      } as any);

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
      fetchDashboardData(userId, undefined, undefined, true),
      fetchClientsData(userId, true),
      fetchOrdersData(userId, undefined, undefined, undefined, 1, 50, true),
      fetchRemindersData(userId, undefined, undefined, '', undefined, 'trigger_date', 'ASC', 1, 50, true),
    ]);
  }, [fetchDashboardData, fetchClientsData, fetchOrdersData, fetchRemindersData]);

  const deleteClient = useCallback(async (userId: string, clientId: number) => {
    try {
      const { data, error } = await supabase.rpc('delete_client', {
        admin_uuid: userId,
        client_id_param: clientId
      });

      if (error) {
        console.error('Error deleting client:', error);
        throw new Error('Could not delete client');
      }

      // Invalidate clients cache to force refresh
      invalidateCache('clientsData');
    } catch (error: any) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }, [invalidateCache]);

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
