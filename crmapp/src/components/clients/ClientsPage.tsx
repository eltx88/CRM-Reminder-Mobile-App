"use client";

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Plus, 
  Users, 
  Share2, 
  Phone, 
  Mail, 
  Calendar,
  Package,
  User,
  RefreshCw,
  MessageCircle,
  MoreVertical,
  Bell,
  ShoppingCart
} from 'lucide-react';
import CreateClientDialog from './CreateClientDialog';
import ClientDetailsDialog from './ClientDetailsDialog';
import {
  ClientsData, 
  ClientsDataResponse, 
  ClientsPageProps, 
  ClientCardProps,
  Client
} from '../interface'

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

const fetchClientsData = async (userId: string): Promise<ClientsData> => {
  const { data, error } = await supabase.rpc('get_clients_data', {
    admin_uuid: userId
  });

  if (error) {
    console.error('Error fetching clients data:', error);
    throw new Error('Could not fetch clients data');
  }

  const response = data as unknown as ClientsDataResponse;
  return {
    managedClients: response?.managedClients || [],
    sharedClients: response?.sharedClients || []
  };
};

export default function ClientsPage({ user, onClientClick }: ClientsPageProps) {
  const [activeTab, setActiveTab] = useState('managed');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-joined-latest');
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { 
    data, 
    isLoading, 
    isError,
    refetch 
  } = useQuery<ClientsData>({
    queryKey: ['clientsData', user.id], 
    queryFn: () => fetchClientsData(user.id), 
  });

  const sortClients = (clients: any[]) => {
    return [...clients].sort((a, b) => {
      switch (sortBy) {
        case 'age-oldest':
          const ageA = calculateAge(a.dob) || 0;
          const ageB = calculateAge(b.dob) || 0;
          return ageB - ageA;
        case 'age-youngest':
          const ageA2 = calculateAge(a.dob) || 0;
          const ageB2 = calculateAge(b.dob) || 0;
          return ageA2 - ageB2;
        case 'date-joined-earliest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date-joined-latest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  };

  const filterByPackages = (clients: any[]) => {
    if (selectedPackages.length === 0) return clients;
    
    return clients.filter(client => {
      const packageName = client.package_name?.toLowerCase() || '';
      
      // Map package names to categories
      if (packageName.includes('core')) return selectedPackages.includes('Core');
      if (packageName.includes('advanced')) return selectedPackages.includes('Advanced');
      if (packageName.includes('premium')) return selectedPackages.includes('Premium');
      
      // If it doesn't match any specific category, check if "Others" is selected
      return selectedPackages.includes('Others');
    });
  };

  const filteredManagedClients = data?.managedClients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.includes(searchQuery)
  ) || [];

  const filteredSharedClients = data?.sharedClients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.includes(searchQuery)
  ) || [];

  const packageFilteredManagedClients = filterByPackages(filteredManagedClients);
  const packageFilteredSharedClients = filterByPackages(filteredSharedClients);
  
  const sortedManagedClients = sortClients(packageFilteredManagedClients);
  const sortedSharedClients = sortClients(packageFilteredSharedClients);

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    refetch();
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setIsDetailsDialogOpen(true);
  };

  const handleDetailsSuccess = () => {
    setIsDetailsDialogOpen(false);
    setSelectedClient(null);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded"></div>
        <div className="h-12 bg-muted rounded"></div>
        <div className="grid gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-muted rounded-lg"></div>)}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center text-destructive">
        Failed to load clients data. Please try again.
        <Button variant="outline" onClick={() => refetch()} className="ml-2">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground">
            Manage your clients and view clients shared with you
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

      {/* Search, Sort, and Filter */}
      <div className="flex items-center">
        
        
        <div className="min-w-[200px]">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-joined-latest">Date Joined (Latest)</SelectItem>
              <SelectItem value="date-joined-earliest">Date Joined (Earliest)</SelectItem>
              <SelectItem value="age-oldest">Age (Oldest)</SelectItem>
              <SelectItem value="age-youngest">Age (Youngest)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[170px]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                Filter by Package
                {selectedPackages.length > 0 && (
                  <Badge variant="secondary" className="ml">
                    {selectedPackages.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[100px]">
              {['Core', 'Advanced', 'Premium', 'Others'].map((packageType) => (
                <DropdownMenuCheckboxItem
                  key={packageType}
                  checked={selectedPackages.includes(packageType)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedPackages([...selectedPackages, packageType]);
                    } else {
                      setSelectedPackages(selectedPackages.filter(p => p !== packageType));
                    }
                  }}
                >
                  {packageType}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="managed" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              My Clients ({data?.managedClients.length || 0})
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Clients Shared ({data?.sharedClients.length || 0})
            </TabsTrigger>
          </TabsList>
          
          {activeTab === 'managed' && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 " />
            </Button>
          )}
        </div>

        <TabsContent value="managed" className="space-y-4">
          {sortedManagedClients.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? 'No clients found' : 'No clients yet'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? `No clients match "${searchQuery}"`
                    : 'Start by adding your first client'
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Client
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sortedManagedClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onClick={() => handleClientClick(client)}
                  showManaged={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shared" className="space-y-4">
          {sortedSharedClients.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Share2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? 'No shared clients found' : 'No shared clients'}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? `No shared clients match "${searchQuery}"`
                    : 'Clients shared with you will appear here'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sortedSharedClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onClick={() => handleClientClick(client)}
                  showManaged={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Client Dialog */}
      <CreateClientDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
        userId={user.id}
      />

      {/* Client Details Dialog */}
      <ClientDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        onSuccess={handleDetailsSuccess}
        userId={user.id}
        client={selectedClient}
      />
    </div>
  );
}

// Client Card Component
function ClientCard({ client, onClick, showManaged }: ClientCardProps) {
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
    console.log('Create reminder for client:', client.id);
  };

  const handleCreateOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement create order functionality
    console.log('Create order for client:', client.id);
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
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{client.email}</span>
                </div>
              )}
              {client.package_name && (
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary">{client.package_name}</Badge>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
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
            {showManaged ? (
              <Badge variant="default">Managed</Badge>
            ) : (
              <Badge variant="outline">Shared</Badge>
            )}
            {client.lifewave_id && (
              <div className="text-xs text-muted-foreground">
                Membership No: {client.lifewave_id}
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
              {client.phone && (
                <DropdownMenuItem onClick={handleWhatsAppClick}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleCreateReminder}>
                <Bell className="h-4 w-4 mr-2" />
                Create Reminder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCreateOrder}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Create Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}