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

export function DonutChartCard({ title, data, description, colorScheme = 'default' }: DonutChartCardProps) {
  // Package color mapping
  const packageColors = {
    'Core': '#60A5FA',      // Light blue
    'Advanced': '#C0C0C0',  // Silver
    'Premium': '#FFD700',   // Gold
    'Others': '#1E40AF'     // Dark blue
  };

  const clientColors = {
    'My Clients': '#60A5FA',      // Light blue
    'Clients Shared with Me': '#1E40AF',  // dark blue
  };

  const getItemColor = (itemName: string, index: number) => {
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
  };

  const chartData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((item, index) => ({
      name: item.name,
      value: item.value,
      fill: getItemColor(item.name, index),
    }));
  }, [data, colorScheme]);
  
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
  }, [chartData, colorScheme]);

  const totalValue = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0)
  }, [chartData]);

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {totalValue > 0 ? (
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