"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Trash2, Calendar, User, Clock, MapPin, CreditCard, Notebook, ListChecks } from "lucide-react";
import { Order } from "../interface";

interface OrderCardProps {
  order: Order;
  onSelect: (order: Order) => void;
  onDelete: (orderId: number) => void;
}

export default function OrderCard({ order, onSelect, onDelete }: OrderCardProps) {
  const borderColor = order.is_expired ? "border-l-red-500" : order.is_maintenance ? "border-l-purple-500" : order.can_edit ? "border-l-blue-500" : "border-l-gray-400";

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onSelect(order)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(order);
        }
      }}
      className={`hover:shadow-md transition-shadow border-l-4 ${borderColor} relative cursor-pointer`}
    >
      <div className="flex flex-wrap gap-1 absolute top-3 left-3">
      {order.is_expired && (
                <Badge variant="secondary" className="bg-red-50 text-red-700 text-xs">
                  Expired
                </Badge>
              )}
              {order.is_partially_collected && (
                <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 text-xs">
                  Partially Collected
                </Badge>
              )}
              {order.collection_date && (
                <Badge variant="secondary" className="bg-green-50 text-green-700 text-xs">
                  Collected
                </Badge>
              )}
              {order.is_maintenance && (
                <Badge variant="secondary" className="bg-purple-50 text-purple-700 text-xs">
                  Maintenance Pack
                </Badge>
              )}
              {!order.can_edit && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs">
                  Shared
                </Badge>
              )}
            </div>
      {order.can_edit && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              aria-label="Delete order"
              onClick={handleDeleteClick}
              className="absolute top-3 right-4 p-1.5 sm:p-2 rounded hover:bg-gray-100 text-red-600 hover:text-red-700 z-10"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this order?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The order will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(order.id);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <CardContent className="p-3 sm:p-4">
        {/* Header row */}
        <div className="flex justify-between items-start mb-2 sm:mb-3 pr-6 sm:pr-8">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="font-medium text-gray-900 truncate">{order.client_name}</span>
              </div>
              {order.order_number && (
                <span className="text-xs sm:text-sm text-gray-600 truncate">Order No: {order.order_number}</span>
              )}
            </div>

            <div className="flex flex-col gap-1 text-xs sm:text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Order Date: {new Date(order.enrollment_date).toLocaleDateString('en-GB')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Order Finishes: {new Date(order.expiry_date).toLocaleDateString('en-GB')}</span>
              </div>
            </div>

            {/* Enroller Information - Prominent Display */}
            {(order.enroller_name || order.enroller_id) && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-blue-600 mb-2">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="font-medium">Order placed under</span>
                </div>
                <span className="truncate">
                  {order.enroller_name === order.client_name ? (
                    "own Lifewave account"
                  ) : (
                    `${order.enroller_name || `ID: ${order.enroller_id}`}${order.enroller_name && order.enroller_id ? ` (ID: ${order.enroller_id})` : ''}`
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
            
        {/* Not collected */}
        {!order.collection_date && (
            <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
              <Calendar className="h-3 w-3" />
              <span>Not collected</span>
            </div>
        )}


        {!order.payment_date && (
          <div className="border-t pt-1 mt-1">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <CreditCard className="h-3 w-3" />
              <span>Unpaid</span>
            </div>
          </div>
        )}
        {/* Additional Details */}
        {(order.payment_mode || order.collection_date || order.payment_date || order.shipping_location) && (
          <div className="border-t pt-1 mt-1">
            <div className="flex flex-col gap-1 text-xs text-gray-600">
              {order.payment_mode && order.payment_date && (
                <div className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">Paid with {order.payment_mode} on {new Date(order.payment_date).toLocaleDateString()}</span>
                </div>
              )}
              {order.shipping_location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">Ship to: {order.shipping_location}</span>
                </div>
              )}
              {order.collection_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">Collection: {new Date(order.collection_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {(order.order_items || order.notes) && (
          <div className="border-t pt-1 mt-1">
            <div className="flex flex-col gap-1 text-xs text-gray-600">
              {order.order_items && (
                <div className="flex items-center gap-1">
                  <ListChecks className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{order.order_items}</span>
                </div>
              )}
              {order.notes && (
                <div className="flex items-center gap-1">
                  <Notebook className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{order.notes}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action hint for shared orders */}
        {!order.can_edit && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            This order is shared with you (read-only)
          </div>
        )}
      </CardContent>
    </Card>
  );
}