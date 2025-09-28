"use client";
import React, { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Edit, AlertCircle, Loader2, User, Phone, Mail } from 'lucide-react';

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
}

interface EditReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
  reminder: Reminder | null;
}

export default function EditReminderDialog({
  open,
  onOpenChange,
  onSuccess,
  userId,
  reminder,
}: EditReminderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    trigger_date: '',
    message: '',
    status: 'PENDING' as 'PENDING' | 'COMPLETED' | 'DISMISSED',
  });

  // Initialize form when reminder changes or dialog opens
  useEffect(() => {
    if (open && reminder) {
      setFormData({
        trigger_date: reminder.trigger_date,
        message: reminder.message,
        status: reminder.status,
      });
      setError(null);
    }
  }, [open, reminder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminder) return;

    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!formData.trigger_date || !formData.message.trim()) {
        throw new Error('Please fill in all required fields');
      }

      // Validate trigger date format
      const triggerDate = new Date(formData.trigger_date);
      if (isNaN(triggerDate.getTime())) {
        throw new Error('Please enter a valid date');
      }

      const { data, error } = await supabase.rpc('update_reminder', {
        admin_uuid: userId,
        p_reminder_id: reminder.id,
        p_trigger_date: formData.trigger_date,
        p_message: formData.message.trim(),
        p_status: formData.status,
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      if (result.success) {
        onSuccess();
        onOpenChange(false);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Error updating reminder:', err);
      setError(err instanceof Error ? err.message : 'Failed to update reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  // Get minimum date (today for new reminders, any date for existing)
  const getMinDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Format date for display
  const formatDisplayDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-SG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DISMISSED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get reminder type badge color
  const getReminderTypeBadgeClass = (type: string) => {
    return type === 'EXPIRY' 
      ? 'bg-red-100 text-red-800 border-red-200' 
      : 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  if (!reminder) {
    return null;
  }

  const isOverdue = new Date(reminder.trigger_date) < new Date() && reminder.status === 'PENDING';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Reminder
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Info (Read-only) */}
          <div className="space-y-2">
            <Label>Client Information</Label>
            <div className="p-3 bg-gray-50 rounded-md border">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-gray-900">{reminder.client_name}</span>
              </div>
              {reminder.client_phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-3 w-3" />
                  <span>{reminder.client_phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Reminder Details (Read-only) */}
          <div className="space-y-2">
            <Label>Reminder Details</Label>
            <div className="p-3 bg-gray-50 rounded-md border">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${getReminderTypeBadgeClass(reminder.reminder_type)} border`}>
                  {reminder.reminder_type === 'FOLLOW_UP' ? 'Follow Up' : 'Expiry'}
                </Badge>
                <Badge className={`${getStatusBadgeClass(reminder.status)} border`}>
                  {reminder.status}
                </Badge>
                {isOverdue && (
                  <Badge className="bg-red-500 text-white">
                    Overdue
                  </Badge>
                )}
              </div>
              <div className="text-sm text-gray-600">
              </div>
            </div>
          </div>

          {/* Trigger Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Trigger Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.trigger_date}
              onChange={(e) => handleInputChange('trigger_date', e.target.value)}
              required
              className="block w-full"
            />
            <p className="text-xs text-gray-500">
              {formData.trigger_date && new Date(formData.trigger_date) < new Date() 
                ? 'This date has passed' 
                : 'The date when this reminder should trigger'
              }
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Reminder Message *</Label>
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
              Update the message to reflect any new information or context
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">
                  <div className="flex flex-col">
                    <span>Pending</span>
                  </div>
                </SelectItem>
                <SelectItem value="COMPLETED">
                  <div className="flex flex-col">
                    <span>Completed</span>
                  </div>
                </SelectItem>
                <SelectItem value="DISMISSED">
                  <div className="flex flex-col">
                    <span>Dismissed</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
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
              disabled={loading || !formData.message.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Reminder'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
