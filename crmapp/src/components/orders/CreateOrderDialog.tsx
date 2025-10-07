"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2, Plus, Minus, Package, Coins, Check, ChevronDown, ChevronRight, Trash2, X } from 'lucide-react';
import { Database } from '@/supabase/types';
import * as z from 'zod';
import { OrderItem } from '../interface';

const orderSchema = z.object({
    client_id: z.string().min(1, 'Client is required'),
    order_number: z.string().optional().transform(val => val || undefined),
    enrollment_date: z.string().min(1, 'Enrollment date is required'),
    expiry_date: z.string().min(1, 'Expiry date is required'),
    payment_mode: z.string().optional().transform(val => val || undefined),
    collection_date: z.string().optional().transform(val => val || undefined),
    payment_date: z.string().optional().transform(val => val || undefined),
    shipping_location: z.string().optional().transform(val => val || undefined),
    notes: z.string().optional().transform(val => val || undefined),
    order_items: z.array(z.object({
      product_id: z.number().min(1, 'A product must be selected for all items.'),
      quantity: z.number().min(1, 'Quantity must be at least 1.'),
    })).min(1, 'At least one order item is required.'),
  });
  
type orderFormData = z.infer<typeof orderSchema>;
type Client = Database['public']['Functions']['get_clients_with_packages_for_admin']['Returns'][0];
type Product = Database['public']['Functions']['get_products']['Returns'][0];
  
interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
  createSeed?: { clientId: number; clientName: string } | null;
}

export default function CreateOrderDialog({
  open,
  onOpenChange,
  onSuccess,
  userId,
  createSeed
}: CreateOrderDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingClients, setLoadingClients] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
    const [isMaintenanceOrder, setIsMaintenanceOrder] = useState(false);
    const [isExpiryDateManuallyEdited, setIsExpiryDateManuallyEdited] = useState(false);
    const [expandedFields, setExpandedFields] = useState<{
      payment_mode: boolean;
      shipping_location: boolean;
      collection_date: boolean;
      payment_date: boolean;
      notes: boolean;
    }>({
      payment_mode: false,
      shipping_location: false,
      collection_date: false,
      payment_date: false,
      notes: false,
    });
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState<orderFormData>({
        client_id: '',
        order_number: '',
        enrollment_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        payment_mode: '',
        collection_date: '',
        payment_date: '',
        shipping_location: '',
        notes: '',
        order_items: [{ product_id: 0, quantity: 1 }],
    });

  // Load clients and products on open
  useEffect(() => {
    if (open) {
      loadClients();
      loadProducts();
      resetForm();
    }
  }, [open]);

  // Pre-select client when createSeed is provided
  useEffect(() => {
    if (createSeed && clients.length > 0) {
      const client = clients.find(c => c.client_id === createSeed.clientId);
      if (client) {
        handleClientSelect(client);
      }
    }
  }, [createSeed, clients]);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const { data, error } = await supabase.rpc('get_clients_with_packages_for_admin', {
        admin_uuid_param: userId
      });

      if (error) throw error;
      
      setClients(data || []);
    } catch (err) {
      console.error('Error loading clients:', err);
      setError('Failed to load clients');
    } finally {
      setLoadingClients(false);
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase.rpc('get_products');

      if (error) throw error;
      
      setProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products');
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      order_number: '',
      enrollment_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      payment_mode: '',
      collection_date: '',
      payment_date: '',
      shipping_location: '',
      notes: '',
      order_items: [{ product_id: 0, quantity: 1 }],
    });
    setSelectedClient(null);
    setClientSearchTerm('');
    setShowClientDropdown(false);
    setShowMaintenanceDialog(false);
    setIsMaintenanceOrder(false);
    setExpandedFields({
      payment_mode: false,
      shipping_location: false,
      collection_date: false,
      payment_date: false,
      notes: false,
    });
    setError(null);
  };

  // Filter clients based on search term
  const filteredClients = clients.filter(client =>
    client.client_name.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  // Handle client selection
  const handleClientSelect = (client: Client) => {
    // Check if client has existing order and this is not already a maintenance order
    if (client.has_existing_order && !isMaintenanceOrder) {
      setSelectedClient(client);
      setClientSearchTerm(client.client_name);
      setFormData(prev => ({ ...prev, client_id: client
        .client_id.toString() }));
      setShowClientDropdown(false);
      setShowMaintenanceDialog(true);
    } else {
      setSelectedClient(client);
      setClientSearchTerm(client.client_name);
      setFormData(prev => ({ ...prev, client_id: client.client_id.toString() }));
      setShowClientDropdown(false);
    }
  };

  // Handle manual expiry date changes
  const handleExpiryDateChange = (value: string) => {
    setFormData(prev => ({ ...prev, expiry_date: value }));
    setIsExpiryDateManuallyEdited(true);
  };

  // Reset manual edit flag when order items change
  useEffect(() => {
    setIsExpiryDateManuallyEdited(false);
  }, [formData.order_items]);

  // Toggle individual field expansion
  const toggleField = (fieldName: keyof typeof expandedFields) => {
    setExpandedFields(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  // All item modifications now update the main formData state
  const addOrderItem = () => {
    setFormData(prev => ({
      ...prev,
      order_items: [...prev.order_items, { product_id: 0, quantity: 1 }]
    }));
  };

  const removeOrderItem = (index: number) => {
    if (formData.order_items.length > 1) {
      setFormData(prev => ({
        ...prev,
        order_items: prev.order_items.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOrderItem = (index: number, field: keyof OrderItem, value: number) => {
    setFormData(prev => {
      const updatedItems = [...prev.order_items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      
      // If updating quantity, check if it would exceed points allowance
      if (field === 'quantity' && selectedClient) {
        const newTotalPoints = updatedItems.reduce((total, item) => {
          const product = products.find(p => p.id === item.product_id);
          return total + (product ? product.point_cost * item.quantity : 0);
        }, 0);
        
        if (newTotalPoints > selectedClient.package_points) {
          // Don't update if it would exceed allowance
          return prev;
        }
      }
      
      return { ...prev, order_items: updatedItems };
    });
  };

  const calculateTotalPoints = () => {
    return formData.order_items.reduce((total, item) => {
      const product = products.find(p => p.id === item.product_id);
      return total + (product ? product.point_cost * item.quantity : 0);
    }, 0);
  };

  // Get available products (excluding already selected ones)
  const getAvailableProducts = (currentIndex: number) => {
    const selectedProductIds = formData.order_items
      .map((item, index) => index !== currentIndex ? item.product_id : null)
      .filter(id => id !== null && id !== 0);
    
    return products.filter(product => !selectedProductIds.includes(product.id));
  };

  // Check if can add more items based on points allowance
  const canAddMoreItems = () => {
    if (!selectedClient) return false;
    return totalPoints < selectedClient.package_points;
  };

  // Clear all order items
  const clearAllItems = () => {
    setFormData(prev => ({
      ...prev,
      order_items: [{ product_id: 0, quantity: 1 }]
    }));
  };

  // Calculate expiry date based on order items
  const calculateExpiryDate = () => {
    if (!formData.enrollment_date) return '';

    const enrollmentDate = new Date(formData.enrollment_date);
    let maxDurationMonths = 0;

    // Check if X39 is in the order items
    const x39Item = formData.order_items.find(item => {
      const product = products.find(p => p.id === item.product_id);
      return product && product.name.toLowerCase().includes('x39');
    });

    if (x39Item) {
      // Use X39 as base calculation
      const x39Product = products.find(p => p.id === x39Item.product_id);
      if (x39Product && x39Product.duration) {
        const durationMonths = parseFloat(x39Product.duration);
        maxDurationMonths = durationMonths * x39Item.quantity;
      }
    } else {
      // Calculate based on all items, find the longest duration
      formData.order_items.forEach(item => {
        if (item.product_id !== 0) {
          const product = products.find(p => p.id === item.product_id);
          if (product && product.duration) {
            const durationMonths = parseFloat(product.duration);
            const totalDuration = durationMonths * item.quantity;
            maxDurationMonths = Math.max(maxDurationMonths, totalDuration);
          }
        }
      });
    }

    if (maxDurationMonths > 0) {
      const expiryDate = new Date(enrollmentDate);
      expiryDate.setMonth(expiryDate.getMonth() + maxDurationMonths);
      return expiryDate.toISOString().split('T')[0];
    }

    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const orderItemsText = (() => {
      const validItems = formData.order_items.filter(item => item.product_id !== 0);
      if (validItems.length === 0) return null;

      const itemsSummary = validItems
        .map(item => {
          const product = products.find(p => p.id === item.product_id);
          return product ? `${product.name} x${item.quantity}` : `Unknown Product x${item.quantity}`;
        })
        .join(', ');

      return `Order Items: ${itemsSummary}`;
    })();

    const validationResult = orderSchema.safeParse({
      ...formData,
      client_id: selectedClient ? selectedClient.client_id.toString() : ''
    });

    if (!validationResult.success) {
      // If validation fails, show the first error message
      setError(validationResult.error.message);
      return;
    }

    // 4. Use validated and transformed data for the RPC call
    const validatedData = validationResult.data;

    try {
      setLoading(true);

      const { data, error: rpcError } = await supabase.rpc('create_order', {
        admin_uuid: userId,
        client_id_param: selectedClient!.client_id,
        order_number_param: validatedData.order_number ?? '',
        enrollment_date_param: validatedData.enrollment_date,
        expiry_date_param: validatedData.expiry_date,
        order_items_param: validatedData.order_items,
        payment_mode_param: validatedData.payment_mode,
        collection_date_param: validatedData.collection_date,
        payment_date_param: validatedData.payment_date,
        shipping_location_param: validatedData.shipping_location,
        notes_param: validatedData.notes,
        order_items_text_param: orderItemsText ?? undefined,
        is_maintenance_param: isMaintenanceOrder,
      });

      if (rpcError) throw rpcError;

      if (data) {
        onSuccess();
        onOpenChange(false);
        resetForm();
      } else {
        setError('Failed to create order. No ID was returned.');
      }
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = calculateTotalPoints();

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

  // Auto-calculate expiry date when order items or enrollment date changes (only if not manually edited)
  useEffect(() => {
    if (!isExpiryDateManuallyEdited) {
      const calculatedExpiryDate = calculateExpiryDate();
      if (calculatedExpiryDate && calculatedExpiryDate !== formData.expiry_date) {
        setFormData(prev => ({
          ...prev,
          expiry_date: calculatedExpiryDate
        }));
      }
    }
  }, [formData.order_items, formData.enrollment_date, products, isExpiryDateManuallyEdited]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl sm:max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[90vh] overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isMaintenanceOrder ? 'Create Maintenance Order' : 'Create New Order'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Selection */}
        <div>
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
                    if (selectedClient && e.target.value !== selectedClient.client_name) {
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
                          key={client.client_id}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          onClick={() => handleClientSelect(client)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium">{client.client_name}</span>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{client.package_name}</span>
                              <span>•</span>
                              <span>{client.package_points} pts</span>
                            </div>
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
                        Selected: {selectedClient.client_name}
                      </span>
                      {isMaintenanceOrder && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          Maintenance Pack Order
                        </span>
                      )}
                    </div>
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{selectedClient.package_name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Coins className="h-4 w-4 text-blue-600" />
                          <span>{selectedClient.package_points} package points</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Order Number */}
        <div>
            <Label htmlFor="order_number">Order Number </Label>
            <Input
                id="order_number"
                type="text"
                placeholder="Enter order number..."
                value={formData.order_number}
                onChange={(e) => setFormData(prev => ({ ...prev, order_number: e.target.value }))}
                className="mt-2"
            />
        </div>

        {/* Order Items */}
        <div>
            <div className="flex items-center  justify-between mb-2">
            <Label>Order Items</Label>
            <div className="flex items-center gap-2">
                <Button 
                    type="button" 
                    onClick={addOrderItem} 
                    variant="outline" 
                    size="sm"
                    disabled={!canAddMoreItems()}
                    title={!canAddMoreItems() ? "Cannot add more items - points allowance reached" : "Add another item"}
                >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            disabled={formData.order_items.length <= 1 || formData.order_items.every(item => item.product_id === 0)}
                            title="Clear all items"
                        >
                            <Trash2 className="text-red-600 h-4 w-4 mr-1" />
                            Remove All
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Clear All Items</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to remove all items in the list? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={clearAllItems}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                Clear All
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            </div>
            
            <div className="space-y-2">
            {formData.order_items.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 border rounded">
                <div className="flex-1">
                    <Select
                    value={item.product_id.toString()}
                    onValueChange={(value) => updateOrderItem(index, 'product_id', parseInt(value) || 0)}
                    >
                    <SelectTrigger>
                        <SelectValue className="text-l" placeholder="Select product..." />
                    </SelectTrigger>
                    <SelectContent>
                        {getAvailableProducts(index).map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                            <div className="flex items-center gap-2 justify-between w-full">
                            <span>{product.name}</span>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>•</span>
                                <span>  {product.point_cost} point
                                  {product.point_cost > 1 ? 's' : ''}
                                </span>
                                {product.duration && (
                                <>
                                    <span>•</span>
                                    <span>{product.duration} month</span>
                                </>
                                )}
                            </div>
                            </div>
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                
                <div className="flex items-center gap-1 sm:min-w-[120px]">
                    <Label className="text-s">Quantity:</Label>
                    <div className="flex items-center border rounded-md">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateOrderItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                            <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-12 h-8 text-center border-0 focus:ring-0"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateOrderItem(index, 'quantity', item.quantity + 1)}
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                            <Plus className="h-3 w-3" />
                        </Button>           
                    </div>
                    
                    {(() => {
                        const product = products.find(p => p.id === item.product_id);
                        return product ? (
                        <div className="text-sm text-gray-600 pl-2 min-w-[80px]">
                            {product.point_cost * item.quantity} pts
                        </div>
                        ) : null;
                    })()}
                </div>

                

                {/* FIXED: Check formData.order_items.length */}
                {formData.order_items.length > 1 && (
                    <Button
                    type="button"
                    onClick={() => removeOrderItem(index)}
                    variant="ghost"
                    size="sm"
                    className="self-start sm:self-center absolute right-7"
                    >
                    <X className="h-4 w-4" />
                    </Button>
                )}
                </div>
            ))}
            </div>

            {/* Points Summary */}
            {selectedClient && (
            <div className="mt-2 p-2 bg-blue-50 text-blue-700 rounded text-sm">
                <div className="flex items-center justify-between">
                <span>Total Items Selected: {totalPoints} Points</span>
                </div>
                {totalPoints > 0 && (
                    <div className="mt-1 text-xs">
                        Remaining: {selectedClient.package_points - totalPoints} Points
                    </div>
                )}
                {!canAddMoreItems() && totalPoints > 0 && (
                    <div className="mt-1 text-xs text-red-600 font-medium">
                        ⚠️ Points allowance reached - cannot add more items
                    </div>
                )}
            </div>
            )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
            <Label htmlFor="enrollment_date">Enrollment Date *</Label>
            <Input
                className="mt-2"
                id="enrollment_date"
                type="date"
                value={formData.enrollment_date}
                onChange={(e) => setFormData(prev => ({ ...prev, enrollment_date: e.target.value }))}
            />
            </div>
            <div>
            <Label htmlFor="expiry_date">Expiry Date * {isExpiryDateManuallyEdited ? '(Manual)' : '(Auto-calculated)'}</Label>
            <Input
                className="mt-2"
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => handleExpiryDateChange(e.target.value)}
                title={isExpiryDateManuallyEdited ? "Manually edited - will auto-update when order items change" : "Automatically calculated based on order items and enrollment date"}
            />
            <p className="text-xs text-gray-500 mt-1">
                {isExpiryDateManuallyEdited 
                  ? "Manually edited - will auto-update when order items change" 
                  : "Calculated based on product durations and quantities"
                }
            </p>
            </div>
        </div>

        {/* Individual Optional Fields */}
        <div className="space-y-4">
            {/* Payment Mode */}
            <div className="border rounded-lg p-3">
                <button
                    type="button"
                    onClick={() => toggleField('payment_mode')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 w-full text-left"
                >
                    {expandedFields.payment_mode ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                    Payment Mode
                    <span className="text-xs text-gray-500">(Optional)</span>
                </button>
                {expandedFields.payment_mode && (
                    <div className="mt-3">
                        <Label htmlFor="payment_mode">Payment Mode</Label>
                        <Input
                            id="payment_mode"
                            className="mt-2"
                            value={formData.payment_mode}
                            onChange={(e) => setFormData(prev => ({ ...prev, payment_mode: e.target.value }))}
                            placeholder="e.g., Credit Card, Cash"
                        />
                    </div>
                )}
            </div>

            {/* Shipping Location */}
            <div className="border rounded-lg p-3">
                <button
                    type="button"
                    onClick={() => toggleField('shipping_location')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 w-full text-left"
                >
                    {expandedFields.shipping_location ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                    Shipping Location
                    <span className="text-xs text-gray-500">(Optional)</span>
                </button>
                {expandedFields.shipping_location && (
                    <div className="mt-3">
                        <Label htmlFor="shipping_location">Shipping Location</Label>
                        <Input
                            id="shipping_location"
                            className="mt-2"
                            value={formData.shipping_location}
                            onChange={(e) => setFormData(prev => ({ ...prev, shipping_location: e.target.value }))}
                            placeholder="Delivery address"
                        />
                    </div>
                )}
            </div>

            {/* Collection Date */}
            <div className="border rounded-lg p-3">
                <button
                    type="button"
                    onClick={() => toggleField('collection_date')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 w-full text-left"
                >
                    {expandedFields.collection_date ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                    Collection Date
                    <span className="text-xs text-gray-500">(Optional)</span>
                </button>
                {expandedFields.collection_date && (
                    <div className="mt-3">
                        <Label htmlFor="collection_date">Collection Date</Label>
                        <Input
                            id="collection_date"
                            type="date"
                            className="mt-2"
                            value={formData.collection_date}
                            onChange={(e) => setFormData(prev => ({ ...prev, collection_date: e.target.value }))}
                        />
                    </div>
                )}
            </div>

            {/* Payment Date */}
            <div className="border rounded-lg p-3">
                <button
                    type="button"
                    onClick={() => toggleField('payment_date')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 w-full text-left"
                >
                    {expandedFields.payment_date ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                    Payment Date
                    <span className="text-xs text-gray-500">(Optional)</span>
                </button>
                {expandedFields.payment_date && (
                    <div className="mt-3">
                        <Label htmlFor="payment_date">Payment Date</Label>
                        <Input
                            id="payment_date"
                            type="date"
                            className="mt-2"
                            value={formData.payment_date}
                            onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                        />
                    </div>
                )}
            </div>

            {/* Notes */}
            <div className="border rounded-lg p-3">
                <button
                    type="button"
                    onClick={() => toggleField('notes')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 w-full text-left"
                >
                    {expandedFields.notes ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                    Notes
                    <span className="text-xs text-gray-500">(Optional)</span>
                </button>
                {expandedFields.notes && (
                    <div className="mt-3">
                        <Label htmlFor="notes">Notes</Label>
                        <Input
                            id="notes"
                            className="mt-2"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Enter notes"
                        />
                    </div>
                )}
            </div>
        </div>

        {/* Error Display */}
        {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
            </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
            <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto"
            >
            Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedClient} className="w-full sm:w-auto">
            {loading ? (
                <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
                </>
            ) : (
                'Create Order'
            )}
            </Button>
        </div>
        </form>
      </DialogContent>

      {/* Maintenance Order Confirmation Dialog */}
      <AlertDialog open={showMaintenanceDialog} onOpenChange={setShowMaintenanceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Existing Order Found</AlertDialogTitle>
            <AlertDialogDescription>
              Order already exists for {selectedClient?.client_name}. 
              Would you like to create a maintenance pack order for this client instead?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowMaintenanceDialog(false);
              setSelectedClient(null);
              setClientSearchTerm('');
              setFormData(prev => ({ ...prev, client_id: '' }));
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsMaintenanceOrder(true);
                setShowMaintenanceDialog(false);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Maintenance Pack Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}