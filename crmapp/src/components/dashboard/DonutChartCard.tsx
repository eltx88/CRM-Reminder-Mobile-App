"use client"

import * as React from "react"
import { LabelList, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface DonutChartCardProps {
  title: string;
  data: { name: string; value: number }[] | null | undefined;
  description?: string;
  colorScheme?: 'default' | 'packages' | 'clients';
}

// Package color mapping
const packageColors = {
  'Core': '#60A5FA',      // Light blue
  'Advanced': '#45474B',  // Silver
  'Premium': '#FFD700',   // Gold
  'Others': '#1E40AF'     // Dark blue
};

const clientColors = {
  'My Clients': '#60A5FA',      // Light blue
  'Clients Shared with Me': '#1E40AF',  // dark blue
};

export function DonutChartCard({ title, data, description, colorScheme = 'default' }: DonutChartCardProps) {

  const getItemColor = React.useCallback((itemName: string, index: number) => {
    if (colorScheme === 'packages') {
      // Try to match exact package name first
      const normalizedName = itemName.toLowerCase();
      for (const [packageName, color] of Object.entries(packageColors)) {
        if (normalizedName === packageName.toLowerCase()) {
          return color;
        }
      }
      // If no exact match, use Others color
      return packageColors.Others;
    }
    if (colorScheme === 'clients') {
      // Try to match exact client type name first
      const normalizedName = itemName.toLowerCase();
      for (const [clientType, color] of Object.entries(clientColors)) {
        if (normalizedName === clientType.toLowerCase()) {
          return color;
        }
      }
      // If no exact match, use default color
      return `var(--chart-${(index % 5) + 1})`;
    }
    // Default color scheme
    return `var(--chart-${(index % 5) + 1})`;
  }, [colorScheme]);

  const chartData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((item, index) => ({
      name: item.name,
      value: item.value,
      fill: getItemColor(item.name, index),
    }));
  }, [data, getItemColor]);
  
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      value: {
        label: "Count",
      },
    };
    
    if (chartData) {
      chartData.forEach((item, index) => {
        const configKey = item.name.toLowerCase().replace(/\s+/g, '');
        config[configKey] = {
          label: item.name,
          color: getItemColor(item.name, index),
        };
      });
    }
    return config;
  }, [chartData, getItemColor]);

  const totalValue = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0)
  }, [chartData]);

  return (
    <Card className="flex flex-col relative">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {totalValue > 0 ? (
          <div className="relative">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[250px] [&_.recharts-text]:fill-background"
            >
              <PieChart>
                <ChartTooltip
                  content={<ChartTooltipContent nameKey="value" hideLabel />}
                />
                <Pie data={chartData} dataKey="value" nameKey="name">
                  <LabelList
                    dataKey="name"
                    className="fill-background"
                    stroke="none"
                    fontSize={12}
                    formatter={(value: string) => {
                      // Show package name and count
                      const item = chartData.find(d => d.name === value);
                      return item ? `${value}` : value;
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            
            {/* Legend */}
            {colorScheme === 'packages' && chartData.length > 0 && (
              <div className="absolute top-2 right-2 bg-background/95 backdrop-blur-sm rounded-lg p-2 shadow-sm border">
                <div className="text-xs font-medium text-muted-foreground mb-1"></div>
                <div className="space-y-1">
                  {chartData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getItemColor(item.name, index) }}
                      />
                      <span className="truncate max-w-[80px]">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-2 opacity-20">📦</div>
              <div>No package data available</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}