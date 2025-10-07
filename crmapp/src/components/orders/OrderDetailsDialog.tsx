"use client";

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  CreditCard,
  MapPin,
  Notebook,
  ListChecks,
  Package,
  User,
  Pencil,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Order } from '../interface';

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onEdit: (order: Order) => void;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return '—';
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) {
    return dateString;
  }
  return parsed.toLocaleDateString('en-SG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function OrderDetailsDialog({
  open,
  onOpenChange,
  order,
  onEdit,
}: OrderDetailsDialogProps) {
  const orderItems = useMemo(() => {
    if (!order?.order_items) {
      return [] as string[];
    }

    const cleaned = order.order_items.replace(/^Order Items:\s*/i, '');
    return cleaned
      .split(/\r?\n|[•\u2022]|,/)
      .map((item) => item.replace(/^[\s•\-]+/, '').trim())
      .filter(Boolean);
  }, [order]);

  if (!order) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl sm:max-w-4xl lg:max-w-6xl xl:max-w-7xl max-h-[90vh] sm:w-full flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>Order No</span>
              {order.order_number && (
                <span className="text-gray-500">• #{order.order_number}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-gray-500" />
                {order.client_name}
              </span>
              {order.is_expired ? (
                <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                  Expired
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                  Active
                </Badge>
              )}
              {order.is_partially_collected && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                  Partially Collected
                </Badge>
              )}
              {order.collection_date && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                  Completed
                </Badge>
              )}
              {order.is_maintenance && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                  Maintenance Order
                </Badge>
              )}
              {!order.can_edit && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                  Shared (read-only)
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          <div className="space-y-6 pb-4">
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                Key Dates
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Enrollment: {formatDate(order.enrollment_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>Expiry: {formatDate(order.expiry_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Collection: {formatDate(order.collection_date)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-gray-500" />
                Payment & Delivery
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Payment Date: {formatDate(order.payment_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span>Mode: {order.payment_mode || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>Shipping: {order.shipping_location || '—'}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Collection Status Section */}
          {order.is_partially_collected && (
            <section className="rounded-lg border p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-gray-500" />
                Collection Status
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    This order has been partially collected
                  </span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  Some items from this order have been collected. Check individual item quantities for details.
                </p>
              </div>
            </section>
          )}

          <section className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-gray-500" />
              Order Items
            </h3>
            {orderItems.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {orderItems.map((item, idx) => (
                  <li key={`${item}-${idx}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No order items recorded.</p>
            )}
          </section>

          <section className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Notebook className="h-4 w-4 text-gray-500" />
              Notes
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {order.notes ? order.notes : 'No notes added for this order.'}
            </p>
          </section>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 pt-4">
          {order.can_edit && (
            <Button onClick={() => onEdit(order)} className="sm:ml-auto">
              <Pencil className="mr-2 h-4 w-4" />
              Edit Order
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

