"use client";

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';

export type DateRangeType = 'thisMonth' | 'yearToDate' | 'last3Months' | 'last6Months' | 'today' | 'thisWeek' | 'custom';

interface DateRangeFilterProps {
  type: 'orders' | 'reminders';
  onDateRangeChange: (startDate: string | null, endDate: string | null, rangeType?: DateRangeType) => void;
  className?: string;
  selectedRange?: DateRangeType;
}

export function DateRangeFilter({ type, onDateRangeChange, className = '', selectedRange: externalSelectedRange }: DateRangeFilterProps) {
  const [selectedRange, setSelectedRange] = useState<DateRangeType>(
    type === 'orders' ? 'thisMonth' : 'today'
  );
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Sync with external selectedRange prop
  useEffect(() => {
    if (externalSelectedRange) {
      setSelectedRange(externalSelectedRange);
    }
  }, [externalSelectedRange]);

  const getDateRangeOptions = () => {
    if (type === 'orders') {
      return [
        { value: 'thisMonth', label: 'This Month' },
        { value: 'yearToDate', label: 'Year to Date' },
        { value: 'last3Months', label: 'Last 3 Months' },
        { value: 'last6Months', label: 'Last 6 Months' },
        { value: 'custom', label: 'Date Range' },
      ];
    } else {
      return [
        { value: 'today', label: 'Today' },
        { value: 'thisWeek', label: 'This Week' },
        { value: 'thisMonth', label: 'This Month' },
        { value: 'custom', label: 'Date Range' },
      ];
    }
  };

  const getDateRange = (range: DateRangeType) => {
    const now = new Date();
    // Get today's date in YYYY-MM-DD format without timezone issues
    const today = now.toISOString().split('T')[0];
    console.log('Today:', today);
    
    switch (range) {
      case 'today':
        return {
          startDate: today,
          endDate: today
        };
      
      case 'thisWeek':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() - now.getDay() + 6);
        return {
          startDate: startOfWeek.toISOString().split('T')[0],
          endDate: endOfWeek.toISOString().split('T')[0]
        };
      
      case 'thisMonth':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
          startDate: startOfMonth.toISOString().split('T')[0],
          endDate: endOfMonth.toISOString().split('T')[0]
        };
      
      case 'yearToDate':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return {
          startDate: startOfYear.toISOString().split('T')[0],
          endDate: today
        };
      
      case 'last3Months':
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return {
          startDate: threeMonthsAgo.toISOString().split('T')[0],
          endDate: today
        };
      
      case 'last6Months':
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        return {
          startDate: sixMonthsAgo.toISOString().split('T')[0],
          endDate: today
        };
      
      case 'custom':
        return {
          startDate: customStartDate || null,
          endDate: customEndDate || null
        };
      
      default:
        return { startDate: null, endDate: null };
    }
  };

  const handleRangeChange = (range: DateRangeType) => {
    setSelectedRange(range);
    
    if (range === 'custom') {
      return; // Don't trigger date change yet, wait for user to set dates
    }
    
    const { startDate, endDate } = getDateRange(range);
    onDateRangeChange(startDate, endDate);
  };

  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate) {
      onDateRangeChange(customStartDate, customEndDate);
    }
  };

  const handleCustomDateClear = () => {
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedRange(type === 'orders' ? 'thisMonth' : 'today');
    const { startDate, endDate } = getDateRange(type === 'orders' ? 'thisMonth' : 'today');
    onDateRangeChange(startDate, endDate);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* <div className="flex items-center space-x-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">
          {type === 'orders' ? 'Order Date Range' : 'Reminder Date Range'}
        </Label>
      </div> */}
      
      <Select value={selectedRange} onValueChange={handleRangeChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select date range" />
        </SelectTrigger>
        <SelectContent>
          {getDateRangeOptions().map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Custom Date Range Fields - Only show when "Date Range" is selected */}
      {selectedRange === 'custom' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  // Auto-trigger date change when both dates are set
                  if (e.target.value && customEndDate) {
                    onDateRangeChange(e.target.value, customEndDate);
                  }
                }}
                className="pr-8 sm:pr-4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  // Auto-trigger date change when both dates are set
                  if (e.target.value && customStartDate) {
                    onDateRangeChange(customStartDate, e.target.value);
                  }
                }}
                className="pr-8 sm:pr-4"    
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleCustomDateChange}
              disabled={!customStartDate || !customEndDate}
              size="sm"
              className="flex-1"
            >
              Apply
            </Button>
            <Button
              onClick={handleCustomDateClear}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}