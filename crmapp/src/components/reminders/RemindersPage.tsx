"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';
import { Search, Filter, Calendar, SortAsc, SortDesc, RefreshCw } from 'lucide-react';
import ReminderCard from './ReminderCard';
import CreateReminderDialog from './CreateReminderDialog';
import EditReminderDialog from './EditReminderDialog'; 
import { Switch } from '../ui/switch';
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showActiveOnly, setShowActiveOnly] = useState(true);

    // Filter and search states
    const [searchTerm, setSearchTerm] = useState('');
    const [reminderTypeFilter, setReminderTypeFilter] = useState<ReminderTypeFilter>('ALL');
    const [sortBy, setSortBy] = useState<ReminderSortBy>('trigger_date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('ASC');
    
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

  // Fetch reminders function
  const fetchReminders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
       
      const { data, error } = await supabase.rpc('get_reminders_for_admin', {
        admin_uuid: user.id,
        search_term: searchTerm,
        reminder_type_filter: reminderTypeFilter === 'ALL' ? undefined : reminderTypeFilter,
        sort_by: sortBy,
        sort_order: sortOrder
      });

      if (error) throw error;

      const reminders: Reminder[]  = (data || []).map((r) => ({
        id: r.id,
        client_id: r.client_id,
        client_name: r.client_name,
        client_phone: r.client_phone,
        order_id: r.order_id,
        reminder_type: (r.reminder_type === 'EXPIRY' ? 'EXPIRY' : 'FOLLOW_UP'),
        trigger_date: r.trigger_date,
        message: r.message,
        status:
          r.status === 'COMPLETED'
            ? 'COMPLETED'
            : r.status === 'DISMISSED'
            ? 'DISMISSED'
            : 'PENDING'
      }));
      setReminders(reminders);
      
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  // Initial load (guard for strict mode double call)
  useEffect(() => {
    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;
    fetchReminders();
  }, [fetchReminders]);

  const handleRefresh = useCallback(() => {
    fetchReminders();
  }, [fetchReminders]);

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
        await fetchReminders();
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error updating reminder status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update reminder');
    }
  };

  // Handle reminder deletion
  const handleDelete = async (reminderId: number) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;
    
    try {
      const { data, error } = await supabase.rpc('delete_reminder', {
        admin_uuid: user.id,
        p_reminder_id: reminderId
      });

      if (error) throw error;
      
      const result = data as { success: boolean; message: string };
      if (result.success) {
        await fetchReminders();
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error deleting reminder:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete reminder');
    }
  };

  // Handle edit reminder
  const handleEdit = (reminder: Reminder) => {
    setSelectedReminder(reminder);
    setEditDialogOpen(true);
  };

  // Handle WhatsApp click
  const handleWhatsAppClick = (phone: string | null) => {
    if (phone) {
      const formattedPhone = formatPhoneForWhatsApp(phone);
      const whatsappUrl = `https://wa.me/${formattedPhone}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
  };

  //Filter for active reminders
  const filteredAndSortedReminders = useMemo(() => {
    let result = [...reminders];

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

    if (showActiveOnly) {
      result = result.filter(r => r.status !== 'DISMISSED' && r.status !== 'COMPLETED');
    }

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

    return result;
  }, [reminders, searchTerm, reminderTypeFilter, showActiveOnly, sortBy, sortOrder]);



  return (
    <div className="space-y-6 px-3 md:px-4">
    {/* Filters and Actions (3 rows, fluid) */}
    <div className="p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            {/* Row 1: Search */}
            <div className="md:col-span-12">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                    placeholder="Search clients or messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                    />
                </div>
            </div>

            {/* Row 2: Follow Up + Sort order icon (next to each other) */}
            <div className="md:col-span-12">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
                {/* Follow Up (Reminder Type) */}
                <div className="min-w-[160px]">
                <Select
                    value={reminderTypeFilter}
                    onValueChange={(v) => setReminderTypeFilter(v as ReminderTypeFilter)}
                >
                    <SelectTrigger className="w-full">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                    <SelectItem value="EXPIRY">Expiry</SelectItem>
                    <SelectItem value="ALL">All Types</SelectItem>
                    </SelectContent>
                </Select>
                </div>

                {/* Sort order icon directly next to Follow Up */}
                <Button variant="outline" onClick={toggleSortOrder} className="p-2">
                {sortOrder === 'ASC' ? (
                    <SortAsc className="h-5 w-5" />
                ) : (
                    <SortDesc className="h-5 w-5" />
                )}
                </Button>
            </div>
            </div>

            {/* Row 3: Left switch, right actions */}
            <div className="md:col-span-12">
              <div className="flex flex-wrap items-center gap-3">
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

                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button onClick={() => handleCreateDialogChange(true)}>
                    Add Reminder
                  </Button>
                </div>
              </div>
            </div>
        </div>
    </div>
  
      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
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
        <div className="grid gap-4 max-w-full sm:max-w-sm">
          {filteredAndSortedReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onWhatsAppClick={handleWhatsAppClick}
            />
          ))}
        </div>
      )}
  
      {/* Dialogs unchanged */}
        <CreateReminderDialog
        open={isCreateDialogOpen}
        onOpenChange={handleCreateDialogChange}
        onSuccess={fetchReminders}
        userId={user.id}
        preselectedClient={createSeed}
        />

        <EditReminderDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchReminders}
        userId={user.id}
        reminder={selectedReminder}
        />

    </div>
  );
  
}
