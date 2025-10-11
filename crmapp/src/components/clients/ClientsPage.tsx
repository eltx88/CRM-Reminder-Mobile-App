"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from '@/components/ui/select';
import { DropdownMenu,DropdownMenuContent,DropdownMenuTrigger,DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, Users, Share2, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';  
import CreateClientDialog from './CreateClientDialog';
import ClientDetailsDialog from './ClientDetailsDialog';
import CreateOrderDialog from '../orders/CreateOrderDialog';
import ClientPageCard from './ClientPageCard';
import { ClientsPageProps, Client } from '../interface'; 

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

export default function ClientsPage({ user, onCreateReminder }: ClientsPageProps) {
  const [activeTab, setActiveTab] = useState('managed');
  const [showInactive, setShowInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-joined-latest');
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [createOrderSeed, setCreateOrderSeed] = useState<{ clientId: number; clientName: string } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { 
    clientsData: data, 
    inactiveClientsData: inactiveData,
    isLoading: { clientsData: isLoading, inactiveClientsData: isLoadingInactive }, 
    errors: { clientsData: isError, inactiveClientsData: isErrorInactive },
    fetchClientsData: refetch,
    fetchInactiveClientsData: refetchInactive,
    setClientInactive,
    setClientActive,
    deleteClient
  } = useData();

  // Initial load guard to prevent double calls
  const hasFetchedRef = useRef(false);

  // Initial load
  useEffect(() => {
    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;
    refetch(user.id);
  }, [refetch, user.id]);

  // Load inactive clients when showInactive changes
  useEffect(() => {
    if (showInactive) {
      refetchInactive(user.id);
    }
  }, [showInactive, refetchInactive, user.id]);

  const sortClients = (clients: Client[]) => {
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

  const filterByPackages = (clients: Client[]) => {
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

  // Get clients based on showInactive state
  const managedClients = showInactive ? (inactiveData?.managedInactiveClients || []) : (data?.managedClients || []);
  const sharedClients = showInactive ? (inactiveData?.sharedInactiveClients || []) : (data?.sharedClients || []);

  const filteredManagedClients = managedClients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.includes(searchQuery)
  );

  const filteredSharedClients = sharedClients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.includes(searchQuery)
  );

  const packageFilteredManagedClients = filterByPackages(filteredManagedClients);
  const packageFilteredSharedClients = filterByPackages(filteredSharedClients);
  
  const sortedManagedClients = sortClients(packageFilteredManagedClients);
  const sortedSharedClients = sortClients(packageFilteredSharedClients);

  // Get current clients based on active tab
  const currentClients = activeTab === 'managed' ? sortedManagedClients : sortedSharedClients;
  
  // Pagination calculations
  const totalClients = currentClients.length;
  const totalPages = Math.ceil(totalClients / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = currentClients.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, selectedPackages, activeTab, showInactive]);

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    refetch(user.id, true);
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setIsDetailsDialogOpen(true);
  };

  const handleSetClientInactive = async (client: Client) => {
    try {
      await setClientInactive(user.id, client.id);
      refetch(user.id, true);
      if (showInactive) {
        refetchInactive(user.id, true);
      }
    } catch (error) {
      console.error('Error setting client inactive:', error);
    }
  };

  const handleSetClientActive = async (client: Client) => {
    try {
      await setClientActive(user.id, client.id);
      refetch(user.id, true);
      if (showInactive) {
        refetchInactive(user.id, true);
      }
    } catch (error) {
      console.error('Error setting client active:', error);
    }
  };

  const handleDetailsSuccess = () => {
    setIsDetailsDialogOpen(false);
    setSelectedClient(null);
    refetch(user.id, true);
  };

  const handleCreateOrderSuccess = () => {
    setIsCreateOrderDialogOpen(false);
    setCreateOrderSeed(null);
    refetch(user.id, true);
  };

  const handleCreateOrder = (clientId: number, clientName: string) => {
    setCreateOrderSeed({ clientId, clientName });
    setIsCreateOrderDialogOpen(true);
  };

  const handleDeleteClient = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;
    
    try {
      await deleteClient(user.id, clientToDelete.id);
      setIsDeleteDialogOpen(false);
      setClientToDelete(null);
      refetch(user.id, true);
    } catch (error) {
      console.error('Error deleting client:', error);
      // You might want to show a toast notification here
    }
  };

  const cancelDeleteClient = () => {
    setIsDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  const currentLoading = showInactive ? isLoadingInactive : isLoading;
  const currentError = showInactive ? isErrorInactive : isError;

  if (currentLoading) {
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

  if (currentError) {
    return (
      <div className="p-4 text-center text-destructive">
        Failed to load {showInactive ? 'inactive' : 'active'} clients data. Please try again.
        <Button variant="outline" onClick={() => showInactive ? refetchInactive(user.id, true) : refetch(user.id, true)} className="ml-2">
          <RefreshCw className="h-4 w-4 mr-2" style={{ pointerEvents: 'none' }} />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1 px-3 mt-3 md:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 sm:h-8 sm:w-8" style={{ pointerEvents: 'none' }} />
            Customers
          </h1>
          <Button
            variant="outline"
            onClick={() => refetch(user.id, true)}
            className="flex items-center justify-center gap-2"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" style={{ pointerEvents: 'none' }} />
            Refresh
          </Button>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)} 
            className="flex items-center justify-center gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" style={{ pointerEvents: 'none' }} />
            <span className="hidden sm:inline">Create New Customer</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>
      </div>

      {/* Inactive Clients Toggle */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {showInactive ? 'Showing Inactive Clients' : 'Showing Active Clients'}
            <Badge 
              variant={showInactive ? 'destructive' : 'default'}
              className="ml-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? 'Inactive' : 'Active'}
            </Badge>
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-2 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
          <div className="md:col-span-12">
            <div className="relative">
              <Search 
                className="absolute left-3 top-3 h-4 w-4 text-gray-400" 
                style={{ pointerEvents: 'none' }}
              />
              <Input
                placeholder={`Search ${showInactive ? 'inactive' : 'active'} clients by name, email, or phone...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sort and Filter */}
      <div className="bg-gray-50 rounded-lg p-2">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-joined-latest">Date Joined (Latest)</SelectItem>
              <SelectItem value="date-joined-earliest">Date Joined (Earliest)</SelectItem>
              <SelectItem value="age-oldest">Age (Oldest)</SelectItem>
              <SelectItem value="age-youngest">Age (Youngest)</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-[200px] justify-between">
                Filter by Package
                {selectedPackages.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedPackages.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
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

          <Select value={itemsPerPage.toString()} onValueChange={(value) => handleItemsPerPageChange(parseInt(value))}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 per page</SelectItem>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>


      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="managed" className="flex items-center gap-2">
            <Users className="h-4 w-4" style={{ pointerEvents: 'none' }} />
            My Clients ({data?.managedClients.length || 0})
          </TabsTrigger>
          <TabsTrigger value="shared" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" style={{ pointerEvents: 'none' }} />
            Clients Shared ({data?.sharedClients.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="managed" className="space-y-4">
          {totalClients === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" style={{ pointerEvents: 'none' }} />
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
                    <Plus className="h-4 w-4 mr-2" style={{ pointerEvents: 'none' }} />
                    Add First Client
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4">
                {paginatedClients.map((client) => (
                  <ClientPageCard
                    key={client.id}
                    client={client}
                    onClick={() => handleClientClick(client)}
                    showManaged={true}
                    showInactive={showInactive}
                    onCreateReminder={onCreateReminder}
                    onCreateOrder={handleCreateOrder}
                    onDelete={handleDeleteClient}
                    onSetInactive={handleSetClientInactive}
                    onSetActive={handleSetClientActive}
                  />
                ))}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, totalClients)} of {totalClients} clients
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" style={{ pointerEvents: 'none' }} />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" style={{ pointerEvents: 'none' }} />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="shared" className="space-y-4">
          {totalClients === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Share2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" style={{ pointerEvents: 'none' }} />
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
            <>
              <div className="grid gap-4">
                {paginatedClients.map((client) => (
                  <ClientPageCard
                    key={client.id}
                    client={client}
                    onClick={() => handleClientClick(client)}
                    showManaged={false}
                    showInactive={showInactive}
                    onCreateReminder={onCreateReminder}
                    onCreateOrder={handleCreateOrder}
                    onDelete={handleDeleteClient}
                    onSetInactive={handleSetClientInactive}
                    onSetActive={handleSetClientActive}
                  />
                ))}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, totalClients)} of {totalClients} clients
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" style={{ pointerEvents: 'none' }} />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" style={{ pointerEvents: 'none' }} />
                    </Button>
                  </div>
                </div>
              )}
            </>
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

      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={isCreateOrderDialogOpen}
        onOpenChange={setIsCreateOrderDialogOpen}
        onSuccess={handleCreateOrderSuccess}
        userId={user.id}
        createSeed={createOrderSeed}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" style={{ pointerEvents: 'none' }} />
              Delete Client
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <strong>{clientToDelete?.name}</strong>? 
              This action cannot be undone and will permanently remove all client data, 
              including orders and reminders.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDeleteClient}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteClient}>
              Delete Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
