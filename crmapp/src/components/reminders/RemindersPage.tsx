"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';
import { Search, Filter, Calendar, SortAsc, SortDesc, RefreshCw, Bell, Plus } from 'lucide-react';
import ReminderCard from './ReminderCard';
import CreateReminderDialog from './CreateReminderDialog';
import EditReminderDialog from './EditReminderDialog'; 
import { Switch } from '../ui/switch';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { PaginationControls } from '@/components/PaginationControls';
import { PAGINATION_THRESHOLDS, DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { DateRangeType } from '@/components/DateRangeFilter';
// Types
interface Reminder {
  id: number;
  client_id: number;
  client_name: string;
  client_phone: string | null;
  order_id: number | null;
  reminder_type: 'FOLLOW_UP' | 'EXPIRY';
  trigger_date: string;
  message: string;
  status: 'PENDING' | 'COMPLETED' | 'DISMISSED';
  created_at?: string;
}

type ReminderTypeFilter = 'ALL' | 'FOLLOW_UP' | 'EXPIRY';
type ReminderSortBy = 'trigger_date' | 'created_at' | 'client_name';
type SortOrder = 'ASC' | 'DESC';


interface RemindersPageProps {
  user: User;
  createDialogOpen?: boolean;
  onCreateDialogChange?: (open: boolean) => void;
  createSeed?: { clientId: number; clientName: string } 
}


// Format phone for WhatsApp
const formatPhoneForWhatsApp = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 8 && !cleaned.startsWith('65')) {
    return '65' + cleaned;
  }
  return cleaned;
};

export default function RemindersPage({ user, createDialogOpen = false, onCreateDialogChange, createSeed }: RemindersPageProps) {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [showActiveOnly, setShowActiveOnly] = useState(true);
    const [localError, setLocalError] = useState<string | null>(null);

    // Filter and search states
    const [searchTerm, setSearchTerm] = useState('');
    const [reminderTypeFilter, setReminderTypeFilter] = useState<ReminderTypeFilter>('ALL');
    const [sortBy, setSortBy] = useState<ReminderSortBy>('trigger_date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('ASC');
    
    // Date range state - initialize with today
    const getTodayRange = () => {
      const today = new Date();
      return {
        startDate: today.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      };
    };
    
    const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>(getTodayRange());
    const [currentDateRangeType, setCurrentDateRangeType] = useState<DateRangeType>('today');
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_PAGE_SIZE);
    const [useServerSidePagination, setUseServerSidePagination] = useState(false);
    
    // Dialog states
    const [internalCreateDialogOpen, setInternalCreateDialogOpen] = useState(false);
    const isCreateDialogOpen = createDialogOpen || internalCreateDialogOpen;
    const handleCreateDialogChange = (open: boolean) => {
    if (onCreateDialogChange) {
        onCreateDialogChange(open);
    } else {
        setInternalCreateDialogOpen(open);
    }
    };
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
    const hasFetchedRef = useRef(false);

    // Get data from context
    const { 
      remindersData, 
      isLoading: { remindersData: loading }, 
      errors: { remindersData: contextError },
      fetchRemindersData: refetch,
      fetchDashboardData,
      invalidateCache
    } = useData();

    // Process reminders when data changes
    const processedReminders = useMemo(() => {
      if (!remindersData) return [];
      
      // Handle both paginated and non-paginated responses
      const reminders = 'reminders' in remindersData ? remindersData.reminders : remindersData;
      
      return reminders.map((r : Reminder) => ({
        id: r.id,
        client_id: r.client_id,
        client_name: r.client_name,
        client_phone: r.client_phone,
        order_id: r.order_id,
        reminder_type: (r.reminder_type === 'EXPIRY' ? 'EXPIRY' : 'FOLLOW_UP') as 'FOLLOW_UP' | 'EXPIRY',
        trigger_date: r.trigger_date,
        message: r.message,
        status: (r.status === 'COMPLETED'
            ? 'COMPLETED'
            : r.status === 'DISMISSED'
            ? 'DISMISSED'
            : 'PENDING') as 'PENDING' | 'COMPLETED' | 'DISMISSED'
      }));
    }, [remindersData]);

    // Update local state when processed reminders change
    useEffect(() => {
      setReminders(processedReminders);
    }, [processedReminders]);
  // Determine if we should use server-side pagination
  useEffect(() => {
    if (remindersData && 'totalCount' in remindersData) {
      setUseServerSidePagination(remindersData.totalCount > PAGINATION_THRESHOLDS.REMINDERS);
    }
  }, [remindersData]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page
    
    if (useServerSidePagination) {
      // Server-side search
      invalidateCache('remindersData');
      refetch(user.id, dateRange.startDate || undefined, dateRange.endDate || undefined, value, reminderTypeFilter === 'ALL' ? undefined : reminderTypeFilter, sortBy, sortOrder, 1, itemsPerPage, true);
    }
    // For client-side, filtering happens in useMemo below
  }, [useServerSidePagination, user.id, reminderTypeFilter, sortBy, sortOrder, refetch, invalidateCache, itemsPerPage]);


  // Initial load (guard for strict mode double call)
  useEffect(() => {
    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;
    refetch(user.id, dateRange.startDate || undefined, dateRange.endDate || undefined, searchTerm, reminderTypeFilter === 'ALL' ? undefined : reminderTypeFilter, sortBy, sortOrder, currentPage, itemsPerPage);
  }, [refetch, user.id, searchTerm, reminderTypeFilter, sortBy, sortOrder, currentPage, itemsPerPage]);

  const handleRefresh = useCallback(() => {
    refetch(user.id, dateRange.startDate || undefined, dateRange.endDate || undefined, searchTerm, reminderTypeFilter === 'ALL' ? undefined : reminderTypeFilter, sortBy, sortOrder, currentPage, itemsPerPage, true);
  }, [refetch, user.id, searchTerm, dateRange, reminderTypeFilter, sortBy, sortOrder, currentPage, itemsPerPage]);

  // Handle date range change
  const handleDateRangeChange = (startDate: string | null, endDate: string | null, rangeType?: DateRangeType) => {
    console.log('handleDateRangeChange called with:', { startDate, endDate, rangeType });
    setDateRange({ startDate, endDate });
    if (rangeType) {
      setCurrentDateRangeType(rangeType);
    }
    setCurrentPage(1); // Reset to first page
    // Force refresh with new date range
    refetch(user.id, startDate || undefined, endDate || undefined, searchTerm, reminderTypeFilter === 'ALL' ? undefined : reminderTypeFilter, sortBy, sortOrder, 1, itemsPerPage, true);
  };

  // Handle reminder status change
  const handleStatusChange = async (reminderId: number, status: 'PENDING' | 'COMPLETED' | 'DISMISSED') => {
    try {
      const { data, error } = await supabase.rpc('update_reminder', {
        admin_uuid: user.id,
        p_reminder_id: reminderId,
        p_status: status
      });

      if (error) throw error;
      
      const result = data as { success: boolean; message: string };
      if (result.success) {
        // Invalidate cache and force refresh for both reminders and dashboard
        invalidateCache('remindersData');
        invalidateCache('dashboardData');
        
        // Refresh reminders data
        refetch(user.id, dateRange.startDate || undefined, dateRange.endDate || undefined, searchTerm, reminderTypeFilter === 'ALL' ? undefined : reminderTypeFilter, sortBy, sortOrder, currentPage, itemsPerPage, true);
        
        // Refresh dashboard data to update alerts counter
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        fetchDashboardData(user.id, startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0], true);
      } else {
        setLocalError(result.message);
      }
    } catch (err) {
      console.error('Error updating reminder status:', err);
      setLocalError(err instanceof Error ? err.message : 'Failed to update reminder');
    }
  };

  // Handle reminder deletion
  const handleDelete = async (reminderId: number) => {    
    try {
      const { data, error } = await supabase.rpc('delete_reminder', {
        admin_uuid: user.id,
        p_reminder_id: reminderId
      });

      if (error) throw error;
      
      const result = data as { success: boolean; message: string };
      if (result.success) {
        // Invalidate cache and force refresh for both reminders and dashboard
        invalidateCache('remindersData');
        invalidateCache('dashboardData');
        
        // Refresh reminders data
        refetch(user.id, dateRange.startDate || undefined, dateRange.endDate || undefined, searchTerm, reminderTypeFilter === 'ALL' ? undefined : reminderTypeFilter, sortBy, sortOrder, currentPage, itemsPerPage, true);
        
        // Refresh dashboard data to update alerts counter
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        fetchDashboardData(user.id, startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0], true);
      } else {
        setLocalError(result.message);
      }
    } catch (err) {
      console.error('Error deleting reminder:', err);
      setLocalError(err instanceof Error ? err.message : 'Failed to delete reminder');
    }
  };

  // Handle edit reminder
  const handleEdit = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setEditDialogOpen(true);
  };

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    if (useServerSidePagination) {
      refetch(user.id, dateRange.startDate || undefined, dateRange.endDate || undefined, searchTerm, reminderTypeFilter === 'ALL' ? undefined : reminderTypeFilter, sortBy, sortOrder, page, itemsPerPage, true);
    }
  }, [useServerSidePagination, user.id, dateRange, searchTerm, reminderTypeFilter, sortBy, sortOrder, refetch, itemsPerPage]);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
    if (useServerSidePagination) {
      refetch(user.id, dateRange.startDate || undefined, dateRange.endDate || undefined, searchTerm, reminderTypeFilter === 'ALL' ? undefined : reminderTypeFilter, sortBy, sortOrder, 1, newItemsPerPage, true);
    }
  }, [useServerSidePagination, user.id, dateRange, searchTerm, reminderTypeFilter, sortBy, sortOrder, refetch]);

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    if (useServerSidePagination) {
      const newSortOrder = sortOrder === 'ASC' ? 'DESC' : 'ASC';
      refetch(user.id, dateRange.startDate || undefined, dateRange.endDate || undefined, searchTerm, reminderTypeFilter === 'ALL' ? undefined : reminderTypeFilter, sortBy, newSortOrder, currentPage, itemsPerPage, true);
    }
  };

  //Filter for active reminders
  const filteredAndSortedReminders = useMemo(() => {
    let result = [...reminders];

    // Only apply client-side filtering if not using server-side pagination
    if (!useServerSidePagination) {
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        result = result.filter(r =>
          r.client_name.toLowerCase().includes(lowerSearch) ||
          r.message.toLowerCase().includes(lowerSearch)
        );
      }

      if (reminderTypeFilter !== 'ALL') {
        result = result.filter(r => r.reminder_type === reminderTypeFilter);
      }
    }


    if (showActiveOnly) {
      result = result.filter(r => r.status !== 'DISMISSED' && r.status !== 'COMPLETED');
    }

    // Only apply client-side sorting if not using server-side pagination
    if (!useServerSidePagination) {
      result.sort((a, b) => {
        let valA: number | string = '';
        let valB: number | string = '';

        switch (sortBy) {
          case 'client_name':
            valA = a.client_name.toLowerCase();
            valB = b.client_name.toLowerCase();
            break;
          case 'created_at':
            valA = a.created_at ? new Date(a.created_at).getTime() : 0;
            valB = b.created_at ? new Date(b.created_at).getTime() : 0;
            break;
          case 'trigger_date':
          default:
            valA = new Date(a.trigger_date).getTime();
            valB = new Date(b.trigger_date).getTime();
            break;
        }

        if (valA < valB) return sortOrder === 'ASC' ? -1 : 1;
        if (valA > valB) return sortOrder === 'ASC' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [reminders, searchTerm, reminderTypeFilter, showActiveOnly, sortBy, sortOrder, useServerSidePagination]);



  return (
    <div className="space-y-1 px-2 mt-3 md:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-6 w-6 sm:h-8 sm:w-8" />
            Reminders
          </h1>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center justify-center gap-1"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => handleCreateDialogChange(true)}
            className="flex items-center justify-center gap-1 justify-end" 
            size="sm"
          >
            <Plus className="h-4 w-4" />
            <span className="flex hidden sm:inline">Create Reminder</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
            {/* Row 0: Date Range Filter */}
            <div className="md:col-span-12">
              <DateRangeFilter
                type="reminders"
                onDateRangeChange={handleDateRangeChange}
              />
            </div>

            {/* Row 1: Search */}
            <div className="md:col-span-12">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                    placeholder="Search clients or messages..."
                    value={searchTerm}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    className="pl-10 w-full"
                    />
                </div>
            </div>

            {/* Row 2: Follow Up filter */}
            <div className="md:col-span-12">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
                <div className="flex flex-col gap-2 min-w-[160px]">
                {/* Follow Up (Reminder Type) */}
                <Select
                    value={reminderTypeFilter}
                    onValueChange={(v) => setReminderTypeFilter(v as ReminderTypeFilter)}
                >
                    <SelectTrigger className="w-full">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                    <SelectItem value="EXPIRY">Expiry</SelectItem>
                    <SelectItem value="ALL">All Types</SelectItem>
                    </SelectContent>
                </Select>
                </div>
            </div>
            </div>

            {/* Row 3: Sort button (when not today), Switch */}
            <div className="md:col-span-12 mt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Sort button - only show when not today */}
                  {currentDateRangeType !== 'today' && (
                    <Button variant="outline" onClick={toggleSortOrder} className="p-2">
                      {sortOrder === 'ASC' ? (
                        <SortAsc className="h-5 w-5" />
                      ) : (
                        <SortDesc className="h-5 w-5" />
                      )}
                    </Button>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      id="show-active"
                      checked={showActiveOnly}
                      onCheckedChange={setShowActiveOnly}
                    />
                    <label htmlFor="show-active" className="text-sm">
                      Show active
                    </label>
                  </div>
                </div>

              </div>
            </div>
        </div>
    </div>
  
      {/* Error */}
      {contextError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {contextError}
        </div>
      )}
  
      {/* List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredAndSortedReminders.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No reminders found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || reminderTypeFilter !== 'ALL'
              ? 'Try adjusting your search or filters.'
              : 'Get started by creating your first reminder.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filteredAndSortedReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onEdit={handleEdit}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
                />
          ))}
        </div>
      )}
  
      {/* Pagination Controls - only show for server-side pagination */}
      {useServerSidePagination && remindersData && 'totalCount' in remindersData && (
        <PaginationControls
          currentPage={remindersData.currentPage}
          totalPages={remindersData.totalPages}
          totalItems={remindersData.totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
  
      {/* Dialogs unchanged */}
        <CreateReminderDialog
        open={isCreateDialogOpen}
        onOpenChange={handleCreateDialogChange}
        onSuccess={() => {
          invalidateCache('remindersData');
          invalidateCache('dashboardData');
          refetch(user.id, dateRange.startDate || undefined, dateRange.endDate || undefined, searchTerm, reminderTypeFilter === 'ALL' ? undefined : reminderTypeFilter, sortBy, sortOrder, currentPage, itemsPerPage, true);
          // Refresh dashboard data to update alerts counter
          const today = new Date();
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          fetchDashboardData(user.id, startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0], true);
        }}
        userId={user.id}
        preselectedClient={createSeed}
      />

      <EditReminderDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          invalidateCache('remindersData');
          invalidateCache('dashboardData');
          refetch(user.id, dateRange.startDate || undefined, dateRange.endDate || undefined, searchTerm, reminderTypeFilter === 'ALL' ? undefined : reminderTypeFilter, sortBy, sortOrder, currentPage, itemsPerPage, true);
          // Refresh dashboard data to update alerts counter
          const today = new Date();
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          fetchDashboardData(user.id, startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0], true);
        }}
        userId={user.id}
        reminder={selectedReminder}
      />

    </div>
  );
  
}
