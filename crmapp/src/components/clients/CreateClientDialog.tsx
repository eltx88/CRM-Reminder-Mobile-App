"use client";
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/supabase/client';
import { Dialog, DialogContent,  DialogHeader,  DialogTitle,  DialogFooter} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CreateClientDialogProps, CreateClientResponse, Package } from '../interface';

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  dob: z.string().optional(),
  countryCode: z.string().optional(),
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

const createClient = async (clientData: ClientFormData, adminId: string): Promise<CreateClientResponse> => {
  // Combine country code and phone number
  const fullPhoneNumber = clientData.countryCode && clientData.phone 
    ? `${clientData.countryCode}${clientData.phone}` 
    : clientData.phone;

  const { data, error } = await supabase.rpc('create_client', {
    admin_uuid: adminId,
    client_name: clientData.name,
    client_dob: clientData.dob,
    client_phone: fullPhoneNumber,
    client_email: clientData.email,
    client_issue: clientData.issue,
    client_notes: clientData.notes,
    client_package_id: clientData.package_id ? parseInt(clientData.package_id) : undefined,
    client_lifewave_id: clientData.lifewave_id ? parseInt(clientData.lifewave_id) : undefined,
    client_sponsor: clientData.sponsor,
  });

  if (error) {
    console.error('Error creating client:', error);
    throw error;
  }

  return data as unknown as CreateClientResponse;
};

export default function CreateClientDialog({ 
  open, 
  onOpenChange, 
  onSuccess, 
  userId 
}: CreateClientDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: packages, isLoading: packagesLoading } = useQuery<Package[]>({
    queryKey: ['packages'],
    queryFn: fetchPackages,
    enabled: open, // Only fetch when dialog is open
  });

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      dob: '',
      countryCode: '+673',
      phone: '',
      email: '',
      issue: '',
      notes: '',
      package_id: '',
      lifewave_id: '',
      sponsor: '',
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    try {
      const result = await createClient(data, userId);
      
      if (result.success) {
        toast.success('Client created successfully!');
        form.reset();
        onSuccess();
      } else {
        toast.error(result.message || 'Failed to create client');
      }
    } catch (error: any) {
      console.error('Failed to create client:', error);
      toast.error(error.message || 'Failed to create client. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
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

            {/* Date of Birth and Phone in a row */}
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
                        placeholder="Select date of birth" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="countryCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country Code</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country code" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="+673">🇧🇳 +673 (Brunei)</SelectItem>
                          <SelectItem value="+60">🇲🇾 +60 (Malaysia)</SelectItem>
                          <SelectItem value="+65">🇸🇬 +65 (Singapore)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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

            {/* Package must be selected and LifeWave ID in a row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="package_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package*</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a package" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {packagesLoading ? (
                          <SelectItem value="loading" disabled>Loading packages...</SelectItem>
                        ) : packages && packages.length > 0 ? (
                          packages.map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id.toString()}>
                              {pkg.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-packages" disabled>No packages available</SelectItem>
                        )}
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Client
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}