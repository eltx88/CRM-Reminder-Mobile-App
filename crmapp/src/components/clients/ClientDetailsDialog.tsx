"use client";

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, User, Phone, Mail, Calendar, Package, Coins, FileText, AlertCircle, Edit, Save } from 'lucide-react'; 
import { toast } from 'sonner';
import { ClientDetailsDialogProps, ClientDetails, Package as PackageType } from '../interface';
import WhatsappButton from '../WhatsappButton';

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

const fetchPackages = async (): Promise<PackageType[]> => {
  const { data, error } = await supabase.rpc('get_packages');

  if (error) {
    console.error('Error fetching packages:', error);
    throw new Error('Could not fetch packages');
  }

  const response = data as { packages: PackageType[] } | null;
  return response?.packages || [];
};

const fetchClientDetails = async (userId: string, clientId: number): Promise<ClientDetails> => {
  const { data, error } = await supabase.rpc('get_client_with_package_details', {
    admin_uuid_param: userId,
    client_id_param: clientId
  });

  if (error) {
    console.error('Error fetching client details:', error);
    throw new Error('Could not fetch client details');
  }

  if (!data || data.length === 0) {
    throw new Error('Client not found');
  }

  return data[0] as ClientDetails;
};

const updateClient = async (clientData: { name: string; dob?: string; phone?: string; email?: string; issue?: string; notes?: string; package_id?: string; lifewave_id?: string; sponsor?: string }, adminId: string, clientId: number) => {
  const { data, error } = await supabase.rpc('update_client', {
    admin_uuid: adminId,
    client_id: clientId,
    client_name: clientData.name,
    client_dob: clientData.dob || undefined,
    client_phone: clientData.phone || undefined,
    client_email: clientData.email || undefined,
    client_issue: clientData.issue || undefined,
    client_notes: clientData.notes || undefined,
    client_package_id: clientData.package_id ? parseInt(clientData.package_id) : undefined,
    client_lifewave_id: clientData.lifewave_id ? parseInt(clientData.lifewave_id) : undefined,
    client_sponsor: clientData.sponsor || undefined,
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
  client,
  clientId,
  mode = 'view'
}: ClientDetailsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);

  // Determine which client data to use
  const effectiveClientId = clientId || client?.id;
  const isViewMode = mode === 'view' || !client;

  const { data: packages, isLoading: packagesLoading } = useQuery<PackageType[]>({
    queryKey: ['packages'],
    queryFn: fetchPackages,
    enabled: open && isEditMode,
  });

  const { 
    data: fetchedClientDetails, 
    isLoading: clientDetailsLoading, 
    isError: clientDetailsError,
    error: clientDetailsErrorObj 
  } = useQuery<ClientDetails>({
    queryKey: ['clientDetails', userId, effectiveClientId],
    queryFn: () => fetchClientDetails(userId, effectiveClientId!),
    enabled: open && effectiveClientId !== null && isViewMode,
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

  // Update local state when fetched data changes
  useEffect(() => {
    if (fetchedClientDetails) {
      setClientDetails(fetchedClientDetails);
    }
  }, [fetchedClientDetails]);

  // Update form when client changes (for edit mode)
  useEffect(() => {
    if (client && isEditMode) {
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
  }, [client, form, isEditMode]);

  // Update form when switching to edit mode
  useEffect(() => {
    if (client && isEditMode) {
      // Use setTimeout to ensure the form is ready
      setTimeout(() => {
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
      }, 0);
    }
  }, [isEditMode, client, form]);

  // Watch for form changes (edit mode only)
  const watchedValues = form.watch();
  useEffect(() => {
    if (client && isEditMode) {
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
  }, [watchedValues, client, isEditMode]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setClientDetails(null);
      setIsEditMode(false);
      setHasUnsavedChanges(false);
    }
  }, [open]);

  const onSubmit = async (data: ClientFormData) => {
    if (!client) return;
    
    setIsSubmitting(true);
    try {
      await updateClient(data, userId, client.id);
      toast.success('Client updated successfully!');
      setHasUnsavedChanges(false);
      setIsEditMode(false);
      onSuccess?.();
    } catch (error: unknown) {
      console.error('Failed to update client:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update client. Please try again.');
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
    setIsEditMode(false);
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
      setIsEditMode(false);
    }
    onOpenChange(open);
  };

  const handleEdit = () => {
    setIsEditMode(true);
    // Reset form with current client data when entering edit mode
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
    }
  };

  // Loading state
  if (clientDetailsLoading || packagesLoading) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px] lg:max-w-4xl xl:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading Client Details...
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Error state
  if (clientDetailsError) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px] lg:max-w-4xl xl:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Client
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive/50" />
              <p className="text-destructive mb-4">
                {clientDetailsErrorObj instanceof Error ? clientDetailsErrorObj.message : 'Failed to load client details'}
              </p>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // No client data
  if (!client && !clientDetails) {
    return null;
  }

  const displayClient = client || clientDetails;
  if (!displayClient) return null;

  // Helper function to get display values
  const getDisplayValue = (key: string): string | number | null => {
    if (client) {
      const value = (client as unknown as Record<string, unknown>)[key];
      return typeof value === 'string' || typeof value === 'number' ? value : null;
    }
    if (clientDetails) {
      const mapping: { [key: string]: string } = {
        'name': 'client_name',
        'phone': 'client_phone',
        'email': 'client_email',
        'id': 'client_id'
      };
      const value = (clientDetails as unknown as Record<string, unknown>)[mapping[key] || key];
      return typeof value === 'string' || typeof value === 'number' ? value : null;
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] lg:max-w-4xl xl:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Details
            </DialogTitle>
            <div className="flex items-center gap-2">
              {isViewMode && client && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
              >
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isEditMode && client ? (
          // Edit Mode - Form
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
                          {packages?.map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id.toString()}>
                              {pkg.name}
                            </SelectItem>
                          ))}
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
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          // View Mode - Display Cards
          <div className="space-y-6">
            {/* Client Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{getDisplayValue('name')}</h3>
                    <p className="text-sm text-muted-foreground">
                      Client Membership No: {getDisplayValue('lifewave_id')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getDisplayValue('phone') && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{getDisplayValue('phone')}</span>
                      <WhatsappButton phone={String(getDisplayValue('phone') || '')} />
                    </div>
                  )}
                  {getDisplayValue('email') && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{getDisplayValue('email')}</span>
                    </div>
                  )}
                </div>

                {client?.dob && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Date of Birth: {new Date(client.dob).toLocaleDateString()}</span>
                  </div>
                )}

                {client?.sponsor && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Sponsor: {client.sponsor}</span>
                  </div>
                )}

                {client?.lifewave_id && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">LifeWave ID: {client.lifewave_id}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Package Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Package Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Package</span>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {client?.package_name || clientDetails?.package_name || 'No package assigned'}
                  </Badge>
                </div>
                
                {clientDetails?.package_points && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Package Points</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {clientDetails.package_points} points
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Information */}
            {(client?.issue || client?.notes) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {client?.issue && (
                    <div>
                      <h4 className="font-medium mb-2">Issues/Concerns</h4>
                      <p className="text-sm text-muted-foreground">{client.issue}</p>
                    </div>
                  )}
                  {client?.notes && (
                    <div>
                      <h4 className="font-medium mb-2">Notes</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Actions for view mode */}
        {!isEditMode && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}