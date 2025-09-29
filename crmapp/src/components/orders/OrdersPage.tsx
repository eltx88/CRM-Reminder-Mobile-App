"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Calendar, SortAsc, SortDesc, Package, RefreshCw } from 'lucide-react';
import OrderCard from '@/components/orders/OrderCard';
import CreateOrderDialog from '@/components/orders/CreateOrderDialog';
import EditOrderDialog from '@/components/orders/EditOrderDialog';
import { Switch } from '../ui/switch';
import { Order, FetchedOrder } from '../interface';

// Types
type SortBy = 'enrollment_date' | 'expiry_date' | 'client_name';
type SortOrder = 'ASC' | 'DESC';

interface OrdersPageProps {
  user: User;
}

export default function OrdersPage({ user }: OrdersPageProps) {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('enrollment_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
  const [showExpiredOnly, setShowExpiredOnly] = useState(false);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch orders function
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
       
      const { data, error } = await supabase.rpc('get_orders', {
        admin_uuid: user.id
      });
  
      if (error) throw error;
  
      const processedOrders: Order[] = (data as FetchedOrder[] || []).map(o => ({
        ...o,
        id: o.order_id,
        is_expired: new Date(o.expiry_date) < new Date(),
        can_edit: !o.is_shared,
      }));
      setAllOrders(processedOrders);
      
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  // Initial load (guarded for strict mode double call)
  useEffect(() => {
    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle order deletion
  const handleDelete = async (orderId: number) => {
    try {
      const { data, error } = await supabase.rpc('delete_order', {
        admin_uuid: user.id,
        order_id_param: orderId
      });

      if (error) throw error;
      
      if (data === true) {
        await fetchOrders();
      } else {
        setError('Failed to delete order');
      }
    } catch (err) {
      console.error('Error deleting order:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete order');
    }
  };

  // Handle edit order
  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setEditDialogOpen(true);
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
  };

  const filteredAndSortedOrders = useMemo(() => {
    let orders = [...allOrders];

    if (searchTerm) {
      orders = orders.filter(order =>
        order.client_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
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
  }, [allOrders, searchTerm, showExpiredOnly, sortBy, sortOrder]);


  const filteredManagedOrders = filteredAndSortedOrders.filter(o => o.can_edit);
  const filteredSharedOrders = filteredAndSortedOrders.filter(o => !o.can_edit);

  return (
    <div className="space-y-6 px-3 mt-3 md:px-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="h-8 w-8" />
          Orders
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Order
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-12">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

          <div className="md:col-span-12">
            <div className="flex items-center gap-2">
              <Switch
                id="show-expired"
                checked={showExpiredOnly}
                onCheckedChange={setShowExpiredOnly}
              />
              <label htmlFor="show-expired" className="text-sm">
                Show expired orders only
              </label>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
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
                  onEdit={handleEdit}
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
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateOrderDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchOrders}
        userId={user.id}
      />

      <EditOrderDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchOrders}
        userId={user.id}
        order={selectedOrder}
      />
    </div>
  );
}