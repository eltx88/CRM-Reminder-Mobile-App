"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Check, X, Calendar, User, Clock } from "lucide-react";
import { ReminderCardProps } from "../interface";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export default function ReminderCard({
    reminder,
    onEdit,
    onDelete,
    onStatusChange,
    onWhatsAppClick,
  }: ReminderCardProps) {
    const isExpired = new Date(reminder.trigger_date) < new Date();
    const isExpiry = reminder.reminder_type === "EXPIRY";
    const tagColor = isExpiry ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800";
    const borderColor = isExpiry ? "border-l-red-500" : "border-l-yellow-500";
  
    const handleWhatsAppClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (reminder.client_phone) onWhatsAppClick(reminder.client_phone);
    };
  
    const handleComplete = (e: React.MouseEvent) => {
      e.stopPropagation();
      onStatusChange(reminder.id, "COMPLETED");
    };
  
    const handleDismiss = (e: React.MouseEvent) => {
      e.stopPropagation();
      onStatusChange(reminder.id, "DISMISSED");
    };

    const isDone = reminder.status === "COMPLETED" || reminder.status === "DISMISSED";
    const typeBorderColor = isExpiry ? "border-l-red-500" : "border-l-yellow-500";
    const statusBorderColor = isDone ? "border-l-gray-400" : typeBorderColor;

    return (
        <Card
          role="button"
          tabIndex={0}
          onClick={() => onEdit(reminder)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onEdit(reminder);
            }
          }}
          className={`hover:shadow-md transition-shadow border-l-4 ${statusBorderColor} relative cursor-pointer`}
        >
          {/* Top-right trash icon with shadcn AlertDialog */}
          <AlertDialog> 
            <AlertDialogTrigger asChild>
              <button
                aria-label="Delete reminder"
                onClick={(e) => e.stopPropagation()}
                className="absolute top-2 right-2 p-2 rounded hover:bg-gray-100 text-grey-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this reminder?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The reminder will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(reminder.id);
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
    
          <CardContent className="p-4">
            {/* Header row */}
            <div className="flex justify-between items-start mb-3 pr-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900">{reminder.client_name}</span>
                  <Badge className={tagColor}>{reminder.reminder_type.replace("_", " ")}</Badge>
                  {isExpired && (
                    <Badge variant="secondary" className="bg-red-50 text-red-700">
                      Overdue
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(reminder.trigger_date).toLocaleDateString()}</span>
                  <Clock className="h-4 w-4 ml-3" />
                  <span className="capitalize">{reminder.status.toLowerCase()}</span>
                </div>
              </div>
            </div>
    
            {/* Message */}
            <div className="text-gray-800 mb-3">{reminder.message}</div>
    
            {/* Actions row */}
            <div className="flex items-center gap-2">
              {reminder.status === "PENDING" && (
                <>
                  <Button size="sm" variant="outline" onClick={handleComplete}>
                    <Check className="h-4 w-4 mr-1" />
                    Complete
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDismiss}>
                    <X className="h-4 w-4 mr-1" />
                    Dismiss
                  </Button>
                </>
              )}
              {reminder.client_phone && (
                <Button size="sm" color="white" variant="secondary" className="transition-colors hover:bg-green-100 hover:text-white" onClick={handleWhatsAppClick}>
                <img
                  src="whatsapp.svg"
                  alt="WhatsApp"
                  className="h-10 w-20 hover:cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }
