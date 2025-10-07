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
import { Switch } from '@/components/ui/switch';
import { Database } from '@/supabase/types';
import * as z from 'zod';
import { OrderItem } from '../interface';
const orderSchema = z.object({
    order_number: z.string().optional().transform(val => val || undefined),
    enrollment_date: z.string().min(1, 'Enrollment date is required'),
    expiry_date: z.string().min(1, 'Expiry date is required'),
    payment_mode: z.string().optional().transform(val => val || undefined),
    collection_date: z.string().optional().transform(val => val || undefined),
    payment_date: z.string().optional().transform(val => val || undefined),
    shipping_location: z.string().optional().transform(val => val || undefined),
    notes: z.string().optional().transform(val => val || undefined),
    order_items: z.array(z.object({
      product_id: z.number().min(1, 'Order Items cannot be empty'),
      quantity: z.number().min(1, 'Quantity must be at least 1.'),
      quantity_collected: z.number().min(0, 'Quantity collected cannot be negative.').optional(),
    })).min(1, 'Order items cannot be empty'),
    is_partially_collected: z.boolean().optional(),
    is_maintenance: z.boolean().optional(),
});

type orderFormData = z.infer<typeof orderSchema>;
type Client = Database['public']['Functions']['get_clients_with_packages_for_admin']['Returns'][0];
type Product = Database['public']['Functions']['get_products']['Returns'][0];

const cloneOrderFormData = (form: orderFormData): orderFormData => ({
  ...form,
  order_items: form.order_items.map(item => ({ ...item })),
});

const areOrderFormsEqual = (a: orderFormData, b: orderFormData): boolean => {
  if (
    a.order_number !== b.order_number ||
    a.enrollment_date !== b.enrollment_date ||
    a.expiry_date !== b.expiry_date ||
    a.payment_mode !== b.payment_mode ||
    a.collection_date !== b.collection_date ||
    a.payment_date !== b.payment_date ||
    a.shipping_location !== b.shipping_location ||
    a.notes !== b.notes ||
    a.order_items.length !== b.order_items.length ||
    a.is_partially_collected !== b.is_partially_collected ||
    a.is_maintenance !== b.is_maintenance
  ) {
    return false;
  }

  for (let i = 0; i < a.order_items.length; i++) {
    const itemA = a.order_items[i];
    const itemB = b.order_items[i];
    if (itemA.product_id !== itemB.product_id || 
        itemA.quantity !== itemB.quantity ||
        itemA.quantity_collected !== itemB.quantity_collected) {
      return false;
    }
  }

  return true;
};

interface EditOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userId: string;
  order: any | null;
}

export default function EditOrderDialog({
  open,
  onOpenChange,
  onSuccess,
  userId,
  order
}: EditOrderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loadingClient, setLoadingClient] = useState(false);
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialFormRef = useRef<orderFormData | null>(null);

  const [formData, setFormData] = useState<orderFormData>({
    order_number: '',
    enrollment_date: '',
    expiry_date: '',
    payment_mode: '',
    collection_date: '',
    payment_date: '',
    shipping_location: '',
    notes: '',
    order_items: [{ product_id: 0, quantity: 1, quantity_collected: 0 }],
    is_partially_collected: false,
    is_maintenance: false,
  });

  // Load data and populate form when dialog opens
  useEffect(() => {
    const loadAndPopulate = async () => {
      await loadProducts();
      if (order) {
        await populateForm();
      }
    };

    if (open) {
      loadAndPopulate();
    } else {
      initialFormRef.current = null;
      setHasUnsavedChanges(false);
    }
  }, [open, order]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const { data, error } = await supabase.rpc('get_products');

      if (error) throw error;
      
      setProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const populateForm = async () => {
    if (!order) return;

    setLoadingClient(true);

    try {
      // Fetch full order details for editing
      const { data, error } = await supabase.rpc('get_order_details', { order_id_param: order.id, admin_uuid: userId });

      if (error || !data || data.length === 0) {
        setError('Failed to load order details for editing.');
        setLoadingClient(false);
        return;
      }

      const orderDetails = data[0];

      // Fetch client with package details in one call
      if (order.client_id) {
        try {
          const { data: clientData, error: clientError } = await supabase.rpc('get_client_with_package_details', {
            client_id_param: order.client_id,
            admin_uuid_param: userId
          });

          if (clientError) {
            console.error('Error fetching client with package details:', clientError);
            // Fallback to order data if client details fail
            setSelectedClient({
              client_id: order.client_id,
              client_name: order.client_name,
              client_email: '',
              client_phone: '',
              has_existing_order: false,
              package_id: 0,
              package_name: order.package_name || '',
              package_points: order.package_points || 0
            } as Client);
          } else if (clientData && Array.isArray(clientData) && clientData.length > 0) {
            const clientDetails = clientData[0];
            setSelectedClient({
              client_id: clientDetails.client_id,
              client_name: clientDetails.client_name,
              client_email: clientDetails.client_email || '',
              client_phone: clientDetails.client_phone || '',
              has_existing_order: false,
              package_id: clientDetails.package_id || 0,
              package_name: clientDetails.package_name || '',
              package_points: clientDetails.package_points || 0 
             } as Client);
          } else {
            // If no client data returned, use order data
            setSelectedClient({
              client_id: order.client_id,
              client_name: order.client_name,
              client_email: '',
              client_phone: '',
              has_existing_order: false,
              package_id: 0,
              package_name: order.package_name || '',
              package_points: order.package_points || 0
              } as Client);
          }
        } catch (err) {
          console.error('Error fetching client with package details:', err);
          // Fallback to order data
          setSelectedClient({
            client_id: order.client_id,
            client_name: order.client_name,
            client_email: '',
            client_phone: '',
            has_existing_order: false,
            package_id: 0,
            package_name: order.package_name || '',
            package_points: order.package_points || 0
          } as Client);
        }
      }

    const nextFormData: orderFormData = {
      order_number: orderDetails.order_number || '',
      enrollment_date: orderDetails.enrollment_date,
      expiry_date: orderDetails.expiry_date || '',
      payment_mode: orderDetails.payment_mode || '',
      collection_date: orderDetails.collection_date || '',
      payment_date: orderDetails.payment_date || '',
      shipping_location: orderDetails.shipping_location || '',
      notes: orderDetails.order_notes || '',
      order_items: data.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        quantity_collected: item.quantity_collected || 0
      })),
      is_partially_collected: order.is_partially_collected || false,
      is_maintenance: order.is_maintenance || false,
    };

    const clonedForm = cloneOrderFormData(nextFormData);
    setFormData(clonedForm);
    initialFormRef.current = cloneOrderFormData(clonedForm);
    setHasUnsavedChanges(false);

    setError(null);
    } catch (err) {
      console.error('Error populating form:', err);
      setError('Failed to load order data');
    } finally {
      setLoadingClient(false);
    }
  };

  // Client selection is read-only in edit mode

  // Handle manual expiry date changes
  const handleExpiryDateChange = (value: string) => {
    setFormData(prev => ({ ...prev, expiry_date: value }));
    setIsExpiryDateManuallyEdited(true);
  };

  // Reset manual edit flag when order items change
  useEffect(() => {
    setIsExpiryDateManuallyEdited(false);
  }, [formData.order_items]);

  useEffect(() => {
    if (!open || !initialFormRef.current) {
      return;
    }
    setHasUnsavedChanges(!areOrderFormsEqual(initialFormRef.current, formData));
  }, [formData, open]);

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
      order_items: [...prev.order_items, { product_id: 0, quantity: 1, quantity_collected: 0 }],
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

  // Clear all order items
  const clearAllItems = () => {
    setFormData(prev => ({
      ...prev,
      order_items: [{ product_id: 0, quantity: 1, quantity_collected: 0 }]
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

      const summary = validItems
        .map(item => {
          const product = products.find(p => p.id === item.product_id);
          return product ? `${product.name} x${item.quantity}` : `Unknown Product x${item.quantity}`;
        })
        .join(', ');

      return `Order Items: ${summary}`;
    })();

    // Check for empty order items first
    if (!formData.order_items || formData.order_items.length === 0) {
      setError('Order items cannot be empty');
      return;
    }

    // 3. Validate form data with Zod
    const validationResult = orderSchema.safeParse({
      ...formData
    });

    if (!validationResult.success) {
      // If validation fails, show the first error message
      const firstError = validationResult.error.issues[0];
      setError(firstError.message);
      return;
    }

    // 4. Use validated and transformed data for the RPC call
    const validatedData = validationResult.data;

    try {
      setLoading(true);
      const { data, error: rpcError } = await supabase.rpc('update_order', {
        admin_uuid: userId,
        order_id_param: order!.id,
        order_number_param: validatedData.order_number,
        enrollment_date_param: validatedData.enrollment_date,
        expiry_date_param: validatedData.expiry_date,
        payment_mode_param: validatedData.payment_mode,
        collection_date_param: validatedData.collection_date,
        payment_date_param: validatedData.payment_date,
        shipping_location_param: validatedData.shipping_location,
        notes_param: validatedData.notes,
        order_items_param: validatedData.order_items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        })),
        order_items_text_param: orderItemsText ?? undefined,
        is_partially_collected_param: validatedData.is_partially_collected,
        item_collections_param: validatedData.order_items
          .filter(item => item.product_id !== 0)
          .map(item => ({
            product_id: item.product_id,
            quantity_collected: item.quantity_collected || 0
          })),
        is_maintenance_param: validatedData.is_maintenance
      });

      if (rpcError) throw rpcError;

      if (data === true) {
        initialFormRef.current = cloneOrderFormData(formData);
        setHasUnsavedChanges(false);
        onSuccess();
        onOpenChange(false);
      } else {
        setError('Failed to update order');
      }
    } catch (err) {
      console.error('Error updating order:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = calculateTotalPoints();

  // Auto-calculate expiry date when order items or enrollment date changes (only if not manually edited)
  useEffect(() => {
    if (!isExpiryDateManuallyEdited) {
      const calculatedExpiryDate = calculateExpiryDate();
      if (calculatedExpiryDate && calculatedExpiryDate !== formData.expiry_date) {
        setFormData(prev => {
          const updated = { ...prev, expiry_date: calculatedExpiryDate };
          if (initialFormRef.current && areOrderFormsEqual(initialFormRef.current, prev)) {
            initialFormRef.current = cloneOrderFormData(updated);
          }
          return updated;
        });
      }
    }
  }, [formData.order_items, formData.enrollment_date, products, isExpiryDateManuallyEdited]);

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl sm:max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[90vh] sm:w-full flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Edit Order - {order.client_name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <form onSubmit={handleSubmit} className="space-y-6 pb-4">
          {/* Client Info (Read-only) */}
          <div>
            <Label>Client *</Label>
            {loadingClient ? (
              <div className="mt-2 p-3 border rounded-md bg-muted">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading client information...</span>
                </div>
              </div>
            ) : selectedClient ? (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {selectedClient.client_name}
                  </span>
                </div>
                <div className="mt-2 p-2 bg-white rounded text-sm">
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
            ) : (
              <div className="mt-2 p-3 border rounded-md bg-red-50">
                <span className="text-sm text-red-600">Failed to load client information</span>
              </div>
            )}
          </div>

          {/* Order Number */}
          <div>
            <Label htmlFor="order_number">Order Number</Label>
            <Input
              id="order_number"
              type="text"
              placeholder="Enter order number..."
              value={formData.order_number}
              onChange={(e) => setFormData(prev => ({ ...prev, order_number: e.target.value }))}
              className="mt-2"
            />
          </div>

          {/* Partially Collected Checkbox */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Switch
                id="partially-collected"
                checked={formData.is_partially_collected || false}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_partially_collected: checked }))}
              />
              <Label htmlFor="partially-collected">Partially Collected</Label>
            </div>
            
            {/* Order Completed Button */}
            {formData.is_partially_collected && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-gray-200 hover:bg-green-50"
                  >
                    Order Completed
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Complete Order</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark all items as fully collected and mark the order as completed. 
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        // Fill all collected quantities to max
                        const updatedItems = formData.order_items.map(item => ({
                          ...item,
                          quantity_collected: item.quantity
                        }));
                        
                        // Set collection date to today
                        const today = new Date().toISOString().split('T')[0];
                        
                        setFormData(prev => ({
                          ...prev,
                          order_items: updatedItems,
                          collection_date: today,
                          is_partially_collected: false
                        }));
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Complete Order
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {/* Maintenance Order Checkbox */}
          <div className="flex items-center space-x-1">
            <Switch
              id="maintenance-order"
              checked={formData.is_maintenance || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_maintenance: checked }))}
            />
            <Label htmlFor="maintenance-order">Maintenance Order</Label>
          </div>

          {/* Order Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Order Items</Label>
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  onClick={addOrderItem} 
                  variant="outline" 
                  size="sm"
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
                <div key={index} className="relative flex flex-col sm:flex-row sm:items-center gap-2 p-2 border rounded">
                  <div className="flex-1">
                    <Select
                      value={item.product_id.toString()}
                      onValueChange={(value) => updateOrderItem(index, 'product_id', parseInt(value) || 0)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product..." />
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

                {/* Quantity Collected - only show if partially collected is enabled */}
                {formData.is_partially_collected && (
                  <div className="flex items-center gap-1 sm:min-w-[120px] mt-2">
                    <Label className="text-s">Collected:</Label>
                    <div className="flex items-center border rounded-md">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateOrderItem(index, 'quantity_collected', Math.max(0, (item.quantity_collected || 0) - 1))}
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                            <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={item.quantity_collected || 0}
                            onChange={(e) => updateOrderItem(index, 'quantity_collected', Math.min(item.quantity, Math.max(0, parseInt(e.target.value) || 0)))}
                            className="w-12 h-8 text-center border-0 focus:ring-0"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateOrderItem(index, 'quantity_collected', Math.min(item.quantity, (item.quantity_collected || 0) + 1))}
                            className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                            <Plus className="h-3 w-3" />
                        </Button>           
                    </div>
                    
                    <div className="text-sm text-gray-600 pl-2 min-w-[80px]">
                        {item.quantity_collected || 0}/{item.quantity}
                    </div>
                  </div>
                )}

                  {formData.order_items.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeOrderItem(index)}
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-gray-100"
                    >
                      <X className="h-3 w-3" />
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
            <Button type="submit" disabled={loading || !selectedClient || !hasUnsavedChanges} className="w-full sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Order'
              )}
            </Button>
          </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}