"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Package, ClientDetailsDialogProps } from '../interface';

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  dob: z.string().optional(),
  phone: z.string().optional(),
  email: z.email('Invalid email address').optional().or(z.literal('')),
  issue: z.string().optional(),
  notes: z.string().optional(),
  package_id: z.string().optional(),
  lifewave_id: z.string().optional(),
  sponsor: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

const fetchPackages = async (): Promise<Package[]> => {
  const { data, error } = await supabase.rpc('get_packages');

  if (error) {
    console.error('Error fetching packages:', error);
    throw new Error('Could not fetch packages');
  }

  const response = data as { packages: Package[] } | null;
  return response?.packages || [];
};

const updateClient = async (clientData: any, adminId: string, clientId: number) => {
  const { data, error } = await supabase.rpc('update_client', {
    admin_uuid: adminId,
    client_id: clientId,
    client_name: clientData.name,
    client_dob: clientData.dob || null,
    client_phone: clientData.phone || null,
    client_email: clientData.email || null,
    client_issue: clientData.issue || null,
    client_notes: clientData.notes || null,
    client_package_id: clientData.package_id ? parseInt(clientData.package_id) : undefined,
    client_lifewave_id: clientData.lifewave_id ? parseInt(clientData.lifewave_id) : undefined,
    client_sponsor: clientData.sponsor || null,
  });

  if (error) {
    console.error('Error updating client:', error);
    throw error;
  }

  return data;
};

export default function ClientDetailsDialog({ 
  open, 
  onOpenChange, 
  onSuccess, 
  userId,
  client 
}: ClientDetailsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { data: packages, isLoading: packagesLoading } = useQuery<Package[]>({
    queryKey: ['packages'],
    queryFn: fetchPackages,
    enabled: open,
  });

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      dob: '',
      phone: '',
      email: '',
      issue: '',
      notes: '',
      package_id: '',
      lifewave_id: '',
      sponsor: '',
    },
  });

  // Update form when client changes
  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name || '',
        dob: client.dob || '',
        phone: client.phone || '',
        email: client.email || '',
        issue: client.issue || '',
        notes: client.notes || '',
        package_id: client.package_id?.toString() || '',
        lifewave_id: client.lifewave_id?.toString() || '',
        sponsor: client.sponsor || '',
      });
      setHasUnsavedChanges(false);
    }
  }, [client, form]);

  // Update package selection when packages are loaded and client is set
  useEffect(() => {
    if (client && packages && packages.length > 0) {
      const currentPackageId = client.package_id?.toString();
      if (currentPackageId) {
        form.setValue('package_id', currentPackageId);
      }
    }
  }, [client, packages, form]);

  // Watch for form changes
  const watchedValues = form.watch();
  useEffect(() => {
    if (client) {
      const hasChanges = Object.keys(watchedValues).some(key => {
        const formValue = watchedValues[key as keyof ClientFormData];
        const clientValue = client[key as keyof typeof client];
        
        if (key === 'package_id' || key === 'lifewave_id') {
          return formValue !== (clientValue?.toString() || '');
        }
        return formValue !== (clientValue || '');
      });
      setHasUnsavedChanges(hasChanges);
    }
  }, [watchedValues, client]);

  const onSubmit = async (data: ClientFormData) => {
    if (!client) return;
    
    setIsSubmitting(true);
    try {
      await updateClient(data, userId, client.id);
      toast.success('Client updated successfully!');
      setHasUnsavedChanges(false);
      onSuccess();
    } catch (error: any) {
      console.error('Failed to update client:', error);
      toast.error(error.message || 'Failed to update client. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to discard them?'
      );
      if (!confirmed) return;
    }
    form.reset();
    setHasUnsavedChanges(false);
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to discard them?'
      );
      if (!confirmed) return;
    }
    if (!open) {
      setHasUnsavedChanges(false);
    }
    onOpenChange(open);
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Client Details</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name - Required */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter client's full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DOB and Phone in a row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        placeholder="Enter date of birth" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Package and LifeWave ID in a row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="package_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a package" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Select a Package</SelectLabel>
                        <SelectItem value="1">Core</SelectItem>
                        <SelectItem value="2">Advanced</SelectItem>
                        <SelectItem value="3">Premium</SelectItem>
                        <SelectItem value="4">Others</SelectItem>
                      </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lifewave_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LifeWave ID</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter LifeWave ID" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sponsor */}
            <FormField
              control={form.control}
              name="sponsor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sponsor</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter sponsor name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Issue */}
            <FormField
              control={form.control}
              name="issue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue</FormLabel>
                  <FormControl>
                    <Input placeholder="Describe any issues or concerns" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about the client..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !hasUnsavedChanges}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
