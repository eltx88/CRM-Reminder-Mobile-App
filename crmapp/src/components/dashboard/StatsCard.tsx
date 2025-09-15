import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export default function StatsCard({ title, value, icon: Icon, trend, trendUp }: StatsCardProps) {
  return (
    <Card className="bg-card shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-foreground">{value}</div>
          {trend && (
            <div className={`text-xs flex items-center ${trendUp ? 'text-success' : 'text-destructive'}`}>
              <span>{trendUp ? '↗' : '↘'} {trend}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}