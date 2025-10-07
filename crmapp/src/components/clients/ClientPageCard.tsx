"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Phone, Mail, Calendar, Package, User, MoreVertical, Bell, ShoppingCart, Trash2 } from 'lucide-react';
import { Client } from '../interface';

interface ClientPageCardProps {
  client: Client;
  onClick: () => void;
  showManaged: boolean;
  onCreateReminder: (clientId: number, clientName: string) => void;
  onCreateOrder: (clientId: number, clientName: string) => void;
  onDelete: (client: Client) => void;
}

const calculateAge = (dob: string | null): number | null => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Package color mapping matching dashboard colors
const getPackageColor = (packageName: string | null | undefined) => {
  if (!packageName) return 'bg-gray-100 text-gray-600'; // Default for no package
  
  const normalizedName = packageName.toLowerCase();
  
  if (normalizedName.includes('core')) {
    return 'bg-blue-100 text-blue-800 border-blue-200'; // Light blue
  }
  if (normalizedName.includes('advanced')) {
    return 'bg-gray-600 text-white border-gray-200'; // Silver/Gray
  }
  if (normalizedName.includes('premium')) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Gold
  }
  
  // Default for others
  return 'bg-indigo-100 text-indigo-800 border-indigo-200'; // Dark blue
};

export default function ClientPageCard({ 
  client, 
  onClick, 
  showManaged, 
  onCreateReminder, 
  onCreateOrder, 
  onDelete 
}: ClientPageCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Return as is if it doesn't match common patterns
    return digitsOnly;
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (client.phone) {
      const formattedPhone = formatPhoneForWhatsApp(client.phone);
      const whatsappUrl = `https://wa.me/${formattedPhone}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleCreateReminder = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    onCreateReminder(client.id, client.name);
  };

  const handleCreateOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateOrder(client.id, client.name);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(client);
  };

  const age = calculateAge(client.dob);

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow relative" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{client.name}</h3>
                {age && (
                  <p className="text-sm text-muted-foreground">Age: {age}</p>
                )}
                {client.dob && (
                  <p className="text-xs text-muted-foreground">DOB: {formatDate(client.dob)}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone 
                    className="h-4 w-4 text-muted-foreground" 
                    style={{ pointerEvents: 'none' }}
                  />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail 
                    className="h-4 w-4 text-muted-foreground" 
                    style={{ pointerEvents: 'none' }}
                  />
                  <span className="truncate">{client.email}</span>
                </div>
              )}
               {client.package_name && (
                 <div className="flex items-center gap-2">
                   <Package 
                     className="h-4 w-4 text-muted-foreground" 
                     style={{ pointerEvents: 'none' }}
                   />
                   <Badge 
                     variant="secondary" 
                     className={`${getPackageColor(client.package_name)} border`}
                   >
                     {client.package_name}
                   </Badge>
                 </div>
               )}
              <div className="flex items-center gap-2">
                <Calendar 
                  className="h-4 w-4 text-muted-foreground" 
                  style={{ pointerEvents: 'none' }}
                />
                <span>Added {formatDate(client.created_at)}</span>
              </div>
            </div>

            {client.issue && (
              <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                <strong>Issue:</strong> {client.issue}
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* {showManaged ? (
              <Badge variant="default">Managed</Badge>
            ) : (
              <Badge variant="outline">Shared</Badge>
            )} */}
            {client.lifewave_id && (
              <div className="text-xs text-muted-foreground">
                Lifewave ID: {client.lifewave_id}
              </div>
            )}
          </div>
        </div>
        
        {/* 3-dot menu positioned at bottom right */}
        <div className="absolute bottom-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* {client.phone && (
                <DropdownMenuItem onClick={handleWhatsAppClick}>
                  <MessageCircle className="text-green-500 h-4 w-4 mr-2" />
                  WhatsApp
                </DropdownMenuItem>
              )} */}
              <DropdownMenuItem onClick={handleCreateReminder}>
                <Bell className="h-4 w-4 mr-2" style={{ pointerEvents: 'none' }} />
                Create Reminder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCreateOrder}>
                <ShoppingCart className="h-4 w-4 mr-2" style={{ pointerEvents: 'none' }} />
                Create Order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="text-red-500 h-4 w-4 mr-2" style={{ pointerEvents: 'none' }} />
                Delete Client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
