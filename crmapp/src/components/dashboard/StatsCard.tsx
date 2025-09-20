import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer } from "recharts";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  miniChartData?: { value: number }[];
  chartColor?: string;
  onClick?: () => void;
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp, 
  miniChartData,
  chartColor = "var(--chart-1)",
  onClick 
}: StatsCardProps) {
  return (
    <Card 
      className={`bg-card shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-foreground">{value}</div>
          <div className="flex items-center justify-between">
            {trend && (
              <div className={`text-xs flex items-center ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                <span>{trendUp ? '↗' : '↘'} {trend}</span>
              </div>
            )}
            {miniChartData && miniChartData.length > 0 && (
              <div className="h-8 w-16 ml-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={miniChartData}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={chartColor}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}