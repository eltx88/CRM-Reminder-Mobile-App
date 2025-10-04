"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Calendar, SortAsc, SortDesc, Package, RefreshCw } from 'lucide-react';
import OrderCard from '@/components/orders/OrderCard';
import CreateOrderDialog from '@/components/orders/CreateOrderDialog';
import EditOrderDialog from '@/components/orders/EditOrderDialog';
import OrderDetailsDialog from '@/components/orders/OrderDetailsDialog';
import { Switch } from '../ui/switch';
import { Order } from '@/components/interface';
import { DateRangeFilter, DateRangeType } from '@/components/DateRangeFilter';
import { PaginationControls } from '@/components/PaginationControls';
import { PAGINATION_THRESHOLDS, DEFAULT_PAGE_SIZE } from '@/constants/pagination';

// Types
type SortBy = 'enrollment_date' | 'expiry_date' | 'client_name';
type SortOrder = 'ASC' | 'DESC';

interface OrdersPageProps {
  user: User;
}

export default function OrdersPage({ user }: OrdersPageProps) {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('enrollment_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
  const [showExpiredOnly, setShowExpiredOnly] = useState(false);
  
  // Date range state - initialize with current month
  const getCurrentMonthRange = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0]
    };
  };
  
  const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>(getCurrentMonthRange());
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [useServerSidePagination, setUseServerSidePagination] = useState(false);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Get data from context
  const { 
    ordersData, 
    isLoading: { ordersData: loading }, 
      errors: { ordersData: contextError },
    fetchOrdersData: refetch,
    invalidateCache
  } = useData();

  // Process orders when data changes
  const processedOrders = useMemo(() => {
    if (!ordersData) return [];
    
    // Handle both paginated and non-paginated responses
    const orders = 'orders' in ordersData ? ordersData.orders : ordersData;
    
    return orders.map(order => ({
      ...order,
      id: order.order_id,
      is_expired: new Date(order.expiry_date) < new Date(),
      can_edit: !order.is_shared,
    }));
  }, [ordersData]);

  // Update local state when processed orders change
  useEffect(() => {
    setAllOrders(processedOrders);
  }, [processedOrders]);

  // Determine if we should use server-side pagination
  useEffect(() => {
    if (ordersData && 'totalCount' in ordersData) {
      setUseServerSidePagination(ordersData.totalCount > PAGINATION_THRESHOLDS.ORDERS);
    }
  }, [ordersData]);

  // Initial load (guarded for strict mode double call)
  useEffect(() => {
    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;
    refetch(user.id, dateRange.startDate || undefined, dateRange.endDate || undefined, searchTerm, currentPage, itemsPerPage);
  }, [refetch, user.id, searchTerm, currentPage, itemsPerPage]);

  const handleRefresh = useCallback(() => {
    refetch(user.id, dateRange.startDate || undefined, dateRange.endDate || undefined, searchTerm, currentPage, itemsPerPage, true);
  }, [refetch, user.id, dateRange, searchTerm, currentPage, itemsPerPage]);

  // Handle date range change
  const handleDateRangeChange = (startDate: string | null, endDate: string | null, rangeType?: DateRangeType) => {
    console.log('handleDateRangeChange called with:', { startDate, endDate, rangeType });
    setDateRange({ startDate, endDate });
    setCurrentPage(1); // Reset to first page
    // Force refresh with new date range
    refetch(user.id, startDate || undefined, endDate || undefined, searchTerm, 1, itemsPerPage, true);
  };

  // Handle order deletion
  const handleDelete = async (orderId: number) => {
    try {
      const { data, error } = await supabase.rpc('delete_order', {
        admin_uuid: user.id,
        order_id_param: orderId
      });

      if (error) throw error;
      
      if (data === true) {
        // Invalidate cache to refresh data
        invalidateCache('ordersData');
      } else {
        setLocalError('Failed to delete order');
      }
    } catch (err) {
      console.error('Error deleting order:', err);
      setLocalError(err instanceof Error ? err.message : 'Failed to delete order');
    }
  };

  // Handle edit order
  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(false);
    setEditDialogOpen(true);
  };

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
  };

  // Handle search with hybrid approach
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page
    
    if (useServerSidePagination) {
      // Server-side search
      invalidateCache('ordersData');
      refetch(user.id, dateRange.startDate || undefined, dateRange.endDate || undefined, value, 1, itemsPerPage, true);
    }
    // For client-side, filtering happens in useMemo below
  }, [useServerSidePagination, user.id, refetch, invalidateCache, itemsPerPage]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    if (useServerSidePagination) {
      refetch(user.id, dateRange.startDate || undefined, dateRange.endDate || undefined, searchTerm, page, itemsPerPage, true);
    }
  }, [useServerSidePagination, user.id, dateRange, searchTerm, refetch, itemsPerPage]);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
    if (useServerSidePagination) {
      refetch(user.id, dateRange.startDate || undefined, dateRange.endDate || undefined, searchTerm, 1, newItemsPerPage, true);
    }
  }, [useServerSidePagination, user.id, dateRange, searchTerm, refetch]);

  const filteredAndSortedOrders = useMemo(() => {
    let orders = [...allOrders];

    // Only apply client-side filtering if not using server-side pagination
    if (!useServerSidePagination) {
      if (searchTerm) {
        orders = orders.filter(order =>
          order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.order_number && order.order_number.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
    }

    if (showExpiredOnly) {
      orders = orders.filter(order => order.is_expired);
    }
    
    orders.sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'client_name':
          valA = a.client_name;
          valB = b.client_name;
          break;
        case 'expiry_date':
          valA = new Date(a.expiry_date).getTime();
          valB = new Date(b.expiry_date).getTime();
          break;
        case 'enrollment_date':
        default:
          valA = new Date(a.enrollment_date).getTime();
          valB = new Date(b.enrollment_date).getTime();
          break;
      }
      
      if (valA < valB) return sortOrder === 'ASC' ? -1 : 1;
      if (valA > valB) return sortOrder === 'ASC' ? 1 : -1;
      return 0;
    });

    return orders;
  }, [allOrders, searchTerm, showExpiredOnly, sortBy, sortOrder, useServerSidePagination]);


  const filteredManagedOrders = filteredAndSortedOrders.filter(o => o.can_edit);
  const filteredSharedOrders = filteredAndSortedOrders.filter(o => !o.can_edit);

  return (
    <div className="space-y-1 px-3 mt-3 md:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6 sm:h-8 sm:w-8" />
            Orders
          </h1>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center justify-center gap-2"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => setCreateDialogOpen(true)} 
            className="flex items-center justify-center gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Order</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
          {/* Date Range Filter */}
          <div className="md:col-span-12">
            <DateRangeFilter
              type="orders"
              onDateRangeChange={handleDateRangeChange}
            />
          </div>

          <div className="md:col-span-12">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search clients or order numbers..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>

          <div className="md:col-span-12">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className="min-w-[160px]">
                <Select
                  value={sortBy}
                  onValueChange={(v) => setSortBy(v as SortBy)}
                >
                  <SelectTrigger className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enrollment_date">Enrollment Date</SelectItem>
                    <SelectItem value="expiry_date">Expiry Date</SelectItem>
                    <SelectItem value="client_name">Client Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" onClick={toggleSortOrder} className="p-2">
                {sortOrder === 'ASC' ? (
                  <SortAsc className="h-5 w-5" />
                ) : (
                  <SortDesc className="h-5 w-5" />
                )}
              </Button>

            </div>
          </div>

          <div className="md:col-span-10 mt-1">
            
            <div className="flex items-center gap-2">
              <Switch
                id="show-expired"
                checked={showExpiredOnly}
                onCheckedChange={setShowExpiredOnly}
              />
              <label htmlFor="show-expired" className="text-sm">
                Show expired orders
              </label>
            </div>

            

          </div>
        </div>
      </div>

      {contextError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {contextError}
        </div>
      )}
      <Tabs defaultValue="managed" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="managed">
            My Orders ({filteredManagedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="shared">
            Shared Orders ({filteredSharedOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="managed" className="mt-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredManagedOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || showExpiredOnly
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by creating your first order.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 max-w-full">
              {filteredManagedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onSelect={handleSelectOrder}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shared" className="mt-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredSharedOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No shared orders</h3>
              <p className="mt-1 text-sm text-gray-500">
                No orders have been shared with you yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 max-w-full">
              {filteredSharedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onSelect={handleSelectOrder}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Pagination Controls - only show for server-side pagination */}
      {useServerSidePagination && ordersData && 'totalCount' in ordersData && (
        <PaginationControls
          currentPage={ordersData.currentPage}
          totalPages={ordersData.totalPages}
          totalItems={ordersData.totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      <CreateOrderDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          invalidateCache('ordersData');
          refetch(user.id, dateRange.startDate || undefined, dateRange.endDate || undefined, searchTerm, currentPage, itemsPerPage, true);
        }}
        userId={user.id}
      />

      <EditOrderDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          invalidateCache('ordersData');
          refetch(user.id, dateRange.startDate || undefined, dateRange.endDate || undefined, searchTerm, currentPage, itemsPerPage, true);
        }}
        userId={user.id}
        order={selectedOrder}
      />

      <OrderDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        order={selectedOrder}
        onEdit={handleEdit}
      />
    </div>
  );
}