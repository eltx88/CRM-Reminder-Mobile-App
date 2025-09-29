"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Package, 
  Coins, 
  FileText, 
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import WhatsappButton from '../WhatsappButton';
interface ClientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: number | null;
  userId: string;
}

interface ClientDetails {
  client_id: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  package_id: number;
  package_name: string;
  package_points: number;
}

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

export default function ClientDetailsDialog({
  open,
  onOpenChange,
  clientId,
  userId
}: ClientDetailsDialogProps) {
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);

  const { 
    data, 
    isLoading, 
    isError,
    error 
  } = useQuery<ClientDetails>({
    queryKey: ['clientDetails', userId, clientId],
    queryFn: () => fetchClientDetails(userId, clientId!),
    enabled: open && clientId !== null,
  });

  // Update local state when data changes
  useEffect(() => {
    if (data) {
      setClientDetails(data);
    }
  }, [data]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setClientDetails(null);
    }
  }, [open]);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
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

  if (isError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
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
                {error instanceof Error ? error.message : 'Failed to load client details'}
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

  if (!clientDetails) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Details
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
            </Button>
          </div>
        </DialogHeader>

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
                  <h3 className="text-xl font-semibold">{clientDetails.client_name}</h3>
                  <p className="text-sm text-muted-foreground">Client ID: {clientDetails.client_id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientDetails.client_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{clientDetails.client_phone}</span>
                    <WhatsappButton phone={clientDetails.client_phone} />
                  </div>
                )}
                {clientDetails.client_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{clientDetails.client_email}</span>
                  </div>
                )}
              </div>
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
                  {clientDetails.package_name}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Package Points</span>
                </div>
                <span className="text-sm font-semibold">
                  {clientDetails.package_points} points
                </span>
              </div>

             
            </CardContent>
          </Card>

          {/* Additional Information */}
         
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
