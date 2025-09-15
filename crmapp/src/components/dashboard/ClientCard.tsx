"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronRight, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ClientCardProps {
  client: {
    id: number;
    name: string;
    age?: number | null;
    issue?: string | null;
    last_order_date?: string;
    next_renewal_date?: string;
  };
  onClick: (clientId: number) => void;
}

export default function ClientCard({ client, onClick }: ClientCardProps) {
  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '';
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onClick(client.id)}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12 bg-primary">
            <AvatarFallback className="bg-primary text-primary-foreground font-medium">
              {getInitials(client.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-foreground truncate">{client.name}</h3>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
            {client.age && <p className="text-sm text-muted-foreground mb-2">Age {client.age}</p>}

            <div className="space-y-2">
              {client.issue && (
                <div>
                  <span className="text-xs text-muted-foreground">Health Issue</span>
                  <p className="text-sm text-foreground">{client.issue}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              </div>

              {client.last_order_date && (
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Last order: {format(new Date(client.last_order_date), 'yyyy-MM-dd')}</span>
                </div>
              )}

              {client.next_renewal_date && (
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Next renewal: {format(new Date(client.next_renewal_date), 'yyyy-MM-dd')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
