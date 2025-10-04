"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, AlertCircle, Loader2, Check, X } from 'lucide-react';

interface Client {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
}

interface CreateReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
  preselectedClient?: { clientId: number; clientName: string } | null;
}

export default function CreateReminderDialog({
  open,
  onOpenChange,
  onSuccess,
  userId,
  preselectedClient
}: CreateReminderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    client_id: '',
    reminder_type: 'FOLLOW_UP' as 'FOLLOW_UP' | 'EXPIRY',
    trigger_date: '',
    message: '',
  });
  const [isMessageManuallyEdited, setIsMessageManuallyEdited] = useState(false);

  // Fetch clients when dialog opens
  useEffect(() => {
    if (open) {
      fetchClients();
      resetForm();
    }
  }, [open, userId]);

  useEffect(() => {
    if (preselectedClient && open) {
      const client = clients.find(c => c.id === preselectedClient.clientId);
      if (client) {
        setSelectedClient(client);
        setClientSearchTerm(client.name);
        setFormData(prev => ({ ...prev, client_id: client.id.toString() }));
        setShowClientDropdown(false);
      }
    }
  }, [preselectedClient, clients, open]);

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      setError(null);

      // Use the get_managed_clients RPC function if available, otherwise query directly
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, phone, email')
        .eq('admin_id', userId)
        .order('name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to load clients');
    } finally {
      setLoadingClients(false);
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      reminder_type: 'FOLLOW_UP',
      trigger_date: getTomorrowDate(),
      message: '',
    });
    setClientSearchTerm('');
    setSelectedClient(null);
    setShowClientDropdown(false);
    setError(null);
    setIsMessageManuallyEdited(false);
  };

  // Get tomorrow's date as default
  const getTomorrowDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!selectedClient || !formData.trigger_date || !formData.message.trim()) {
        throw new Error('Please fill in all required fields');
      }

      // Validate trigger date is not in the past
      const triggerDate = new Date(formData.trigger_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (triggerDate < today) {
        throw new Error('Trigger date cannot be in the past');
      }

      const { data, error } = await supabase.rpc('create_reminder', {
        admin_uuid: userId,
        p_client_id: selectedClient.id,
        p_reminder_type: formData.reminder_type,
        p_trigger_date: formData.trigger_date,
        p_message: formData.message.trim(),
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string; reminder_id?: number };
      if (result.success) {
        onSuccess();
        onOpenChange(false);
        resetForm();
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error creating reminder:', err);
      setError(err instanceof Error ? err.message : 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Track if message is manually edited
    if (field === 'message') {
      setIsMessageManuallyEdited(true);
    }
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  // Clear message function
  const clearMessage = () => {
    setFormData(prev => ({ ...prev, message: '' }));
    setIsMessageManuallyEdited(true);
  };

  // Generate default message based on type and selected client
  const generateDefaultMessage = (type: 'FOLLOW_UP' | 'EXPIRY', clientName: string) => {
    if (type === 'FOLLOW_UP') {
      return `Follow up with ${clientName} regarding their recent consultation and check on their progress.`;
    } else {
      return `${clientName}'s product/service is expiring soon. Contact them to discuss renewal options.`;
    }
  };

  // Filter clients based on search term
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  // Handle client selection
  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setClientSearchTerm(client.name);
    setFormData(prev => ({ ...prev, client_id: client.id.toString() }));
    setShowClientDropdown(false);
  };

  // Update message when client or type changes (only if not manually edited)
  useEffect(() => {
    if (selectedClient && formData.reminder_type && !isMessageManuallyEdited) {
      const defaultMessage = generateDefaultMessage(formData.reminder_type, selectedClient.name);
      setFormData(prev => ({ ...prev, message: defaultMessage }));
    }
  }, [selectedClient, formData.reminder_type, isMessageManuallyEdited]);

  // Get minimum date (today)
  const getMinDate = (): string => {
    return new Date().toISOString().split('T')[0];
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowClientDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create New Reminder
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            {loadingClients ? (
              <div className="flex items-center gap-2 p-2 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading clients...</span>
              </div>
            ) : clients.length === 0 ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">No clients found</span>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <Input
                  id="client"
                  type="text"
                  placeholder="Type client name to search..."
                  value={clientSearchTerm}
                  onChange={(e) => {
                    setClientSearchTerm(e.target.value);
                    setShowClientDropdown(true);
                    if (selectedClient && e.target.value !== selectedClient.name) {
                      setSelectedClient(null);
                      setFormData(prev => ({ ...prev, client_id: '' }));
                    }
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  className="w-full"
                />
                {showClientDropdown && clientSearchTerm && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredClients.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500">No clients found</div>
                    ) : (
                      filteredClients.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          onClick={() => handleClientSelect(client)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{client.name}</span>
                            <span className="text-xs text-gray-500">
                              {client.phone || client.email || 'No contact info'}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
                {selectedClient && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">
                        Selected: {selectedClient.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reminder Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Reminder Type *</Label>
            <Select
              value={formData.reminder_type}
              onValueChange={(value) => handleInputChange('reminder_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FOLLOW_UP">
                  <div className="flex flex-col">
                    <span>Follow Up</span>
                  </div>
                </SelectItem>
                <SelectItem value="EXPIRY">
                  <div className="flex flex-col">
                    <span>Expiry</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Trigger Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Trigger Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.trigger_date}
              onChange={(e) => handleInputChange('trigger_date', e.target.value)}
              min={getMinDate()}
              required
              className="block w-full"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message">Reminder Message *</Label>
              {formData.message && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearMessage}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Enter reminder message..."
              rows={4}
              required
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              This message will help you remember what to discuss with the client
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || loadingClients || !selectedClient || !formData.message.trim() || clients.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Reminder'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}